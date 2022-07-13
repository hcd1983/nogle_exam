<template>
  <div class="bg-[#131B29] text-[#F0F4F8] w-full min-h-screen text-[24px]">
    <div class="max-w-[472px] mx-auto pl-[24px] pr-[20px]">
      <h1 class="font-bold text-[28px] text-white">Order Book</h1>
      <div class="quote-head">
        <div>Price (USD)</div>
        <div>Size</div>
        <div>Total</div>
      </div>
      <div v-for="([price, size], idx) in asksInView" :key="idx" class="quote-row">
        <div class="text-[#FF5B5A]">{{ numberWithCommas(price) }}</div>
        <div>{{ size }}</div>
        <div></div>
      </div>
      <div>Highlight</div>
      <div v-for="({price, size, total}, idx) in bidsInView" :key="idx" class="quote-row">
        <div class="text-[#00b15d]">{{ price }}</div>
        <div>{{ size }}</div>
        <div>{{ total }}</div>
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
      newBids: [],
      newAsks: [],
    };
  },
  computed: {
    bidsInView() {
      const keys = [...this.bids.keys()].sort().reverse().slice(0, 8);
      let total = 0;
      return keys.map((key) => {
        const [price, size] = this.bids.get(key);
        const result = {
          price,
          size,
          total: total += Number(size),
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
        this.orderHandler(this.bids, orderBook.data.bids);
        this.orderHandler(this.asks, orderBook.data.asks);
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
  },
};
</script>
<style scoped>
.quote-head {
  @apply flex w-full text-[#8698aa] whitespace-nowrap;
}
.quote-row {
  @apply flex w-full hover:bg-[#1E3059];
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
</style>
