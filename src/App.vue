<template>
  <div class="bg-[#131B29] text-[#F0F4F8] w-full min-h-screen text-[22px]">
    <div class="max-w-[472px] mx-auto grid grid-cols-1 gap-y-1">
      <h1
        class="font-bold text-[24px] text-white pl-[24px] pr-[20px] py-2 border-b border-gray-800"
      >
        Order Book
      </h1>
      <div class="quote-head">
        <div>Price (USD)</div>
        <div>Size</div>
        <div>Total</div>
      </div>
      <div
        v-for="({price, size, total, isNew, sizeChange}, idx) in asksInView"
        :key="idx"
        class="quote-row ask"
        :class="{
          'new-row': isNew,
          increase: sizeChange === 'increase',
          decrease: sizeChange === 'decrease',
          same: sizeChange === 'same'
        }"
      >
        <div class="text-[#FF5B5A]">{{ numberWithCommas(price) }}</div>
        <div>
          {{ numberWithCommas(size) }}
        </div>
        <div>
          {{ numberWithCommas(total) }}
          <span :style="{
            width: `${getTotalBarWidth(total, asksInView[0].total)}%`
          }" />
        </div>
      </div>
      <div
        v-if="lastPrice"
        class="last-price"
        :class="`${lastPrice.side.toLowerCase()}`"
      >
        {{ numberWithCommas(lastPrice.price) }}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="presentation" fill="none" fill-rule="nonzero" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
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
  </div>
</template>

<script>

export default {
  name: 'App',
  components: {},
  data() {
    return {
      lastPriceWebSocket: null,
      lastPrice: null,
      orderBookWebsocket: null,
      lastPrices: null,
      data: null,
      seqNum: null,
      orderBook: [],
      bids: null,
      asks: null,
      newBidsPrice: null,
      newAsksPrice: null,
      bidsInViewKeys: [],
      asksInViewKeys: [],
      bidsSizeChangeLog: null,
      asksSizeChangeLog: null,
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
      const keys = this.asksInViewKeys;
      let total = 0;
      return keys.map((key) => {
        const [price, size] = this.asks.get(key);
        const result = {
          price,
          size,
          total: total += Number(size),
          isNew: this.newAsksPrice.includes(price),
          sizeChange: this.asksSizeChangeLog.get(price) || null,
        };
        return result;
      }).reverse();
    },
  },
  created() {
    // this.webSocket = new WebSocket('wss://ws.btse.com/ws/oss/futures');
    this.orderBookWebsocketInit();
    this.lastPriceWebSocketInit();
  },
  unmounted() {
    this.lastPriceWebSocket.close();
    this.orderBookWebsocket.close();
  },
  methods: {
    lastPriceWebSocketInit() {
      this.lastPriceWebSocket = new WebSocket('wss://ws.btse.com/ws/futures');
      this.lastPriceWebSocket.onopen = this.lastPriceWebSocketOnOpen;
      this.lastPriceWebSocket.onmessage = this.lastPriceWebSocketOnMessage;
      this.lastPriceWebSocket.onerror = this.webSocketOnError;
    },
    lastPriceWebSocketOnOpen() {
      console.log('last price wws connected');
      this.subscribeHistory();
    },
    lastPriceWebSocketOnMessage(e) {
      const { data } = JSON.parse(e.data);
      if (Array.isArray(data)) {
        [this.lastPrice] = [data[0]];
      }
    },
    subscribeHistory() {
      const msg = {
        op: 'subscribe',
        args: [
          'tradeHistoryApi:BTCPFC',
        ],
      };
      this.lastPriceWebSocket.send(JSON.stringify(msg));
    },
    orderBookWebsocketInit() {
      this.orderBookWebsocket = new WebSocket('wss://ws.btse.com/ws/oss/futures');
      this.orderBookWebsocket.onopen = this.orderBookWebsocketOnOpen;
      this.orderBookWebsocket.onmessage = this.orderBookWebsocketOnMessage;
      this.orderBookWebsocket.onerror = this.webSocketOnError;
    },
    orderBookWebsocketOnOpen() {
      console.log('order book connected');
      this.orderBookSubscribe();
    },
    orderBookWebsocketOnMessage(e) {
      const orderBook = JSON.parse(e.data);
      if (orderBook?.event === 'unsubscribe') {
        // 馬上重新訂閱
        this.orderBookSubscribe();
      } else if (orderBook?.data?.type) {
        const { data } = orderBook;
        if (data.type === 'snapshot') {
          this.bids = new Map();
          this.asks = new Map();
        } else if (data.type === 'delta' && data.prevSeqNum !== this.seqNum) {
          this.orderBookUnsubscribe();
        }
        this.seqNum = data.seqNum;
        this.bidsHandler(data.bids);
        this.asksHandler(data.asks);
        // this.orderHandler(this.asks, orderBook.data.asks);
      }
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
    bidsHandler(bids) {
      this.newBidsPrice = [];
      this.bidsSizeChangeLog = new Map();
      const newQuotePriceList = this.newBidsPrice;
      const inViewKeys = this.bidsInViewKeys;
      const quoteMap = this.bids;
      const sizeLogMap = this.bidsSizeChangeLog;
      this.orderLogHandler(inViewKeys, newQuotePriceList, quoteMap, sizeLogMap, bids);
      this.orderHandler(this.bids, bids);
      this.setBidsInViewKeys();
    },
    asksHandler(asks) {
      this.newAsksPrice = [];
      this.asksSizeChangeLog = new Map();
      const newQuotePriceList = this.newAsksPrice;
      const inViewKeys = this.asksInViewKeys;
      const quoteMap = this.asks;
      const sizeLogMap = this.asksSizeChangeLog;
      this.orderLogHandler(inViewKeys, newQuotePriceList, quoteMap, sizeLogMap, asks);
      this.orderHandler(this.asks, asks);
      this.setAsksInViewKeys();
    },
    orderLogHandler(inViewKeys, newQuotePriceList, quoteMap, sizeLogMap, quotes) {
      if (quoteMap.size && inViewKeys.length) {
        quotes.forEach(([price, size]) => {
          if (!inViewKeys.includes(price)) {
            // new quotes in view
            newQuotePriceList.push(price);
          } else {
            // check if size changed
            const oldSize = quoteMap.get(price)[1];
            if (size > oldSize) {
              sizeLogMap.set(price, 'increase');
            } else if (size < oldSize) {
              sizeLogMap.set(price, 'decrease');
            } else {
              sizeLogMap.set(price, 'same');
            }
          }
        });
      }
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
    webSocketOnError(error) {
      console.log(error);
    },
    numberWithCommas(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    setBidsInViewKeys() {
      this.bidsInViewKeys = [...this.bids.keys()].sort().reverse().slice(0, 8);
    },
    setAsksInViewKeys() {
      this.asksInViewKeys = [...this.asks.keys()].sort().slice(0, 8);
    },
    getTotalBarWidth(accumulativeTotal, quoteTotal) {
      return Math.floor((accumulativeTotal / quoteTotal) * 1000) / 10;
    },
  },
};
</script>
<style scoped>
.quote-row, .quote-head {
  @apply pl-[24px] pr-[20px];
}
.quote-head {
  @apply flex w-full text-[#8698aa] whitespace-nowrap;
}
.quote-row {
  @apply flex w-full hover:bg-[#1E3059] transition-colors duration-200 font-medium;
}
.quote-row > div, .quote-head > div {
  @apply w-[28%] text-right py-[2px];
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

.quote-row > div:nth-child(2) {
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

.quote-row.bid > div:last-child span {
  @apply absolute block h-full right-0 top-0;
  background-color: rgba(16, 186, 104, 0.12);
}

.quote-row.ask > div:last-child span {
  @apply absolute block h-full right-0 top-0;
  background-color: rgba(255, 90, 90, 0.12);
}

.quote-row.bid.new-row {
  background-color: rgba(0, 177, 93, 0.5);
}

.quote-row.ask.new-row {
  background-color: rgba(255, 91, 90, 0.5);
}

.last-price {
  @apply flex items-center justify-center gap-2 text-[24px];
}
.last-price.buy {
  color: #00b15d;
  background-color: rgba(16, 186, 104, 0.12);
}

.last-price.buy svg {
 @apply rotate-180;
}

.last-price.sell {
  color: #FF5B5A;
  background-color: rgba(255, 90, 90, 0.12);
}
</style>
