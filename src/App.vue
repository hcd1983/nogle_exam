<template>
  <div class="bg-[#131B29] text-[#F0F4F8] w-full min-h-screen text-[24px]">
    <div class="max-w-[472px] mx-auto pl-[24px] pr-[20px]">
      <h1 class="font-bold text-[28px] text-white">Order Book</h1>
      <div class="quote-head">
        <div>Price (USD)</div>
        <div>Size</div>
        <div>Total</div>
      </div>
<!--      <div v-for="([price, size], idx) in asksInView" :key="idx" class="quote-row">-->
<!--        <div class="text-[#FF5B5A]">{{ numberWithCommas(price) }}</div>-->
<!--        <div>{{ size }}</div>-->
<!--        <div></div>-->
<!--      </div>-->
      <div>Highlight</div>
      <div
        v-for="({price, size, total, isNew, sizeChange}, idx) in bidsInView"
        :key="idx"
        class="quote-row bid"
        :class="{
          'new-row': isNew,
          increase: sizeChange === 'increase',
          decrease: sizeChange === 'decrease',
          same: sizeChange === 'same'
        }"
      >
        <div class="text-[#00b15d]">{{ numberWithCommas(price) }}</div>
        <div>
          {{ numberWithCommas(size) }}
        </div>
        <div>
          {{ numberWithCommas(total) }}
          <span :style="{
            width: `${getTotalBarWidth(total, bidsInView[bidsInView.length - 1].total)}%`
          }" />
        </div>
      </div>
    </div>
    <pre class="text-red-600">
      {{ Object.keys(bids) }}
    </pre>
    <pre>
      {{ orderBook }}
    </pre>
    <pre class="text-red-500">
      {{ lastPrices?.data?.length }}
    </pre>
    <pre>
      {{ data }}
    </pre>
  </div>
</template>

<script>

export default {
  name: 'App',
  components: {},
  data() {
    return {
      webSocket: null,
      orderBookWebsocket: null,
      lastPrices: null,
      data: null,
      orderBook: [],
      bids: new Map(),
      asks: new Map(),
      newBidsPrice: [],
      newAsksPrice: [],
      bidsInViewKeys: [],
      asksInViewKeys: [],
      bidsSizeChangeLog: null,
    };
  },
  computed: {
    bidsInView() {
      const keys = this.bidsInViewKeys;
      let total = 0;
      return keys.map((key) => {
        const [price, size] = this.bids.get(key);
        const result = {
          price,
          size,
          total: total += Number(size),
          isNew: this.newBidsPrice.includes(price),
          sizeChange: this.bidsSizeChangeLog.get(price) || null,
        };
        return result;
      });
    },
    asksInView() {
      return this.asks;
    },
  },
  mounted() {
    // this.webSocket = new WebSocket('wss://ws.btse.com/ws/oss/futures');
    this.orderBookWebsocketInit();
    this.webSocket = new WebSocket('wss://ws.btse.com/ws/futures');
    this.webSocket.onopen = this.webSocketOnOpen;
    this.webSocket.onClose = this.webSocketOnClose;
    this.webSocket.onmessage = this.webSocketOnMessage;
    this.webSocket.onerror = this.webSocketOnError;
  },
  unmounted() {
    this.webSocket.close();
  },
  methods: {
    orderBookWebsocketInit() {
      this.orderBookWebsocket = new WebSocket('wss://ws.btse.com/ws/oss/futures');
      this.orderBookWebsocket.onopen = this.orderBookWebsocketOnOpen;
      // this.orderBookWebsocket.onClose = this.webSocketOnClose;
      this.orderBookWebsocket.onmessage = this.orderBookWebsocketOnMessage;
      // this.orderBookWebsocket.onerror = this.webSocketOnError;
    },
    orderBookWebsocketOnOpen() {
      console.log('order book connected');
      this.orderBookSubscribe();
    },
    orderBookWebsocketOnMessage(e) {
      const orderBook = JSON.parse(e.data);
      if (orderBook?.data?.type) {
        this.bidsHandler(orderBook.data.bids);
        this.orderHandler(this.asks, orderBook.data.asks);
      }
    },
    bidsHandler(bids) {
      this.newBidsPrice = [];
      this.bidsSizeChangeLog = new Map();
      if (this.bidsInViewKeys.length) {
        bids.forEach(([price, size]) => {
          if (!this.bidsInViewKeys.includes(price)) {
            // new bids in view
            this.newBidsPrice.push(price);
          } else {
            // check if size changed
            const oldSize = this.bids.get(price)[1];
            if (size > oldSize) {
              this.bidsSizeChangeLog.set(price, 'increase');
            } else if (size < oldSize) {
              this.bidsSizeChangeLog.set(price, 'decrease');
            } else {
              this.bidsSizeChangeLog.set(price, 'same');
            }
          }
        });
      }
      this.orderHandler(this.bids, bids);
      this.setBidsInViewKeys();
    },
    orderHandler(quoteMap, quotes) {
      quotes.forEach(([price, size]) => {
        if (size !== '0') {
          quoteMap.set(price, [price, size]);
        } else {
          quoteMap.delete(price);
        }
      });
    },
    orderBookSubscribe() {
      const msg = {
        op: 'subscribe',
        args: [
          'update:BTCPFC',
        ],
      };
      this.orderBookWebsocket.send(JSON.stringify(msg));
    },
    orderBookUnsubscribe() {
      const msg = {
        op: 'unsubscribe',
        args: [
          'update:BTCPFC',
        ],
      };
      this.orderBookWebsocket.send(JSON.stringify(msg));
    },
    orderBookResubscribe() {
      this.orderBookUnsubscribe();
      this.orderBookSubscribe();
    },
    webSocketOnOpen() {
      console.log('connected');
      this.sendMessage();
      // this.webSocket.close();
    },
    webSocketOnClose() {
      console.log('closed');
    },
    webSocketOnMessage(e) {
      console.log(e);
      const data = JSON.parse(e.data);
      if (!this.lastPrices && data.topic === 'tradeHistoryApi') {
        this.lastPrices = data;
        this.webSocket.close();
      }
      this.data = data;
    },
    webSocketOnError(error) {
      console.log(error);
    },
    sendMessage() {
      const msg = {
        op: 'subscribe',
        args: [
          'tradeHistoryApi:BTCPFC',
        ],
      };
      this.webSocket.send(JSON.stringify(msg));
    },
    numberWithCommas(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    setBidsInViewKeys() {
      this.bidsInViewKeys = [...this.bids.keys()].sort().reverse().slice(0, 8);
    },
    getTotalBarWidth(accumulativeTotal, quoteTotal) {
      return Math.floor((accumulativeTotal / quoteTotal) * 1000) / 10;
    },
  },
};
</script>
<style scoped>
.quote-head {
  @apply flex w-full text-[#8698aa] whitespace-nowrap;
}
.quote-row {
  @apply flex w-full hover:bg-[#1E3059] transition-colors duration-200;
}
.quote-row > div, .quote-head > div {
  @apply w-[28%] text-right py-[4px];
}
.quote-row > div:last-child, .quote-head > div:last-child {
  @apply flex-1;
}
.quote-row > div:first-child, .quote-head > div:first-child {
  @apply text-left;
}

.quote-row > div:last-child {
  @apply relative;
}

.quote-row.increase > div:nth-child(2) {
  @apply transition-colors duration-200;
}

.quote-row.increase > div:nth-child(2) {
  color: #00b15d;
  background-color: rgba(16, 186, 104, 0.12);
}

.quote-row.decrease > div:nth-child(2) {
  color: #FF5B5A;
  background-color: rgba(255, 90, 90, 0.12);
}

.quote-row.same > div:nth-child(2) {
  color: #F0F4F8;
  background-color: rgba(134, 152, 170, 0.12);
}

.quote-row > div:last-child span {
  @apply absolute block h-full right-0 top-0;
  background-color: rgba(16, 186, 104, 0.12);
}

.quote-row.bid.new-row {
  background-color: rgba(0, 177, 93, 0.5);
}

.quote-row.ask.new-row {
  background-color: rgba(255, 91, 90, 0.5);
}
</style>
