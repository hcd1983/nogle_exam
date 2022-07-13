(function(){"use strict";var e={9562:function(e,s,t){var i=t(9242),r=t(3396),o=t(7139);const n=e=>((0,r.dD)("data-v-4fe44cbf"),e=e(),(0,r.Cn)(),e),a={class:"bg-[#131B29] text-[#F0F4F8] w-full min-h-screen text-[22px]"},c={class:"max-w-[472px] mx-auto grid grid-cols-1 gap-y-1"},l=n((()=>(0,r._)("h1",{class:"font-bold text-[24px] text-white pl-[24px] pr-[20px] py-2 border-b border-gray-800"}," Order Book ",-1))),d=n((()=>(0,r._)("div",{class:"quote-head"},[(0,r._)("div",null,"Price (USD)"),(0,r._)("div",null,"Size"),(0,r._)("div",null,"Total")],-1))),u={class:"text-[#FF5B5A]"},h=n((()=>(0,r._)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",role:"presentation",fill:"none","fill-rule":"nonzero",stroke:"currentColor","stroke-width":"4","stroke-linecap":"round","stroke-linejoin":"round"},[(0,r._)("line",{x1:"12",y1:"5",x2:"12",y2:"19"}),(0,r._)("polyline",{points:"19 12 12 19 5 12"})],-1))),b={class:"text-[#00b15d]"};function k(e,s,t,i,n,k){return(0,r.wg)(),(0,r.iD)("div",a,[(0,r._)("div",c,[l,d,((0,r.wg)(!0),(0,r.iD)(r.HY,null,(0,r.Ko)(k.asksInView,(({price:e,size:s,total:t,isNew:i,sizeChange:n},a)=>((0,r.wg)(),(0,r.iD)("div",{key:a,class:(0,o.C_)(["quote-row ask",{"new-row":i,increase:"increase"===n,decrease:"decrease"===n,same:"same"===n}])},[(0,r._)("div",u,(0,o.zw)(k.numberWithCommas(e)),1),(0,r._)("div",null,(0,o.zw)(k.numberWithCommas(s)),1),(0,r._)("div",null,[(0,r.Uk)((0,o.zw)(k.numberWithCommas(t))+" ",1),(0,r._)("span",{style:(0,o.j5)({width:`${k.getTotalBarWidth(t,k.asksInView[0].total)}%`})},null,4)])],2)))),128)),n.lastPrice?((0,r.wg)(),(0,r.iD)("div",{key:0,class:(0,o.C_)(["last-price",`${n.lastPrice.side.toLowerCase()}`])},[(0,r.Uk)((0,o.zw)(k.numberWithCommas(n.lastPrice.price))+" ",1),h],2)):(0,r.kq)("",!0),((0,r.wg)(!0),(0,r.iD)(r.HY,null,(0,r.Ko)(k.bidsInView,(({price:e,size:s,total:t,isNew:i,sizeChange:n},a)=>((0,r.wg)(),(0,r.iD)("div",{key:a,class:(0,o.C_)(["quote-row bid",{"new-row":i,increase:"increase"===n,decrease:"decrease"===n,same:"same"===n}])},[(0,r._)("div",b,(0,o.zw)(k.numberWithCommas(e)),1),(0,r._)("div",null,(0,o.zw)(k.numberWithCommas(s)),1),(0,r._)("div",null,[(0,r.Uk)((0,o.zw)(k.numberWithCommas(t))+" ",1),(0,r._)("span",{style:(0,o.j5)({width:`${k.getTotalBarWidth(t,k.bidsInView[k.bidsInView.length-1].total)}%`})},null,4)])],2)))),128))])])}t(6699);var w={name:"App",components:{},data(){return{lastPriceWebSocket:null,lastPrice:null,orderBookWebsocket:null,lastPrices:null,data:null,seqNum:null,orderBook:[],bids:null,asks:null,newBidsPrice:null,newAsksPrice:null,bidsInViewKeys:[],asksInViewKeys:[],bidsSizeChangeLog:null,asksSizeChangeLog:null}},computed:{bidsInView(){const e=this.bidsInViewKeys;let s=0;return e.map((e=>{const[t,i]=this.bids.get(e),r={price:t,size:i,total:s+=Number(i),isNew:this.newBidsPrice.includes(t),sizeChange:this.bidsSizeChangeLog.get(t)||null};return r}))},asksInView(){const e=this.asksInViewKeys;let s=0;return e.map((e=>{const[t,i]=this.asks.get(e),r={price:t,size:i,total:s+=Number(i),isNew:this.newAsksPrice.includes(t),sizeChange:this.asksSizeChangeLog.get(t)||null};return r})).reverse()}},created(){this.orderBookWebsocketInit(),this.lastPriceWebSocketInit()},unmounted(){this.lastPriceWebSocket.close(),this.orderBookWebsocket.close()},methods:{lastPriceWebSocketInit(){this.lastPriceWebSocket=new WebSocket("wss://ws.btse.com/ws/futures"),this.lastPriceWebSocket.onopen=this.lastPriceWebSocketOnOpen,this.lastPriceWebSocket.onmessage=this.lastPriceWebSocketOnMessage,this.lastPriceWebSocket.onerror=this.webSocketOnError},lastPriceWebSocketOnOpen(){console.log("last price wws connected"),this.subscribeHistory()},lastPriceWebSocketOnMessage(e){const{data:s}=JSON.parse(e.data);Array.isArray(s)&&([this.lastPrice]=[s[0]])},subscribeHistory(){const e={op:"subscribe",args:["tradeHistoryApi:BTCPFC"]};this.lastPriceWebSocket.send(JSON.stringify(e))},orderBookWebsocketInit(){this.orderBookWebsocket=new WebSocket("wss://ws.btse.com/ws/oss/futures"),this.orderBookWebsocket.onopen=this.orderBookWebsocketOnOpen,this.orderBookWebsocket.onmessage=this.orderBookWebsocketOnMessage,this.orderBookWebsocket.onerror=this.webSocketOnError},orderBookWebsocketOnOpen(){console.log("order book connected"),this.orderBookSubscribe()},orderBookWebsocketOnMessage(e){const s=JSON.parse(e.data);if("unsubscribe"===s?.event)this.orderBookSubscribe();else if(s?.data?.type){const{data:e}=s;"snapshot"===e.type?(this.bids=new Map,this.asks=new Map):"delta"===e.type&&e.prevSeqNum!==this.seqNum&&this.orderBookUnsubscribe(),this.seqNum=e.seqNum,this.bidsHandler(e.bids),this.asksHandler(e.asks)}},orderBookSubscribe(){const e={op:"subscribe",args:["update:BTCPFC"]};this.orderBookWebsocket.send(JSON.stringify(e))},orderBookUnsubscribe(){const e={op:"unsubscribe",args:["update:BTCPFC"]};this.orderBookWebsocket.send(JSON.stringify(e))},bidsHandler(e){this.newBidsPrice=[],this.bidsSizeChangeLog=new Map;const s=this.newBidsPrice,t=this.bidsInViewKeys,i=this.bids,r=this.bidsSizeChangeLog;this.orderLogHandler(t,s,i,r,e),this.orderHandler(this.bids,e),this.setBidsInViewKeys()},asksHandler(e){this.newAsksPrice=[],this.asksSizeChangeLog=new Map;const s=this.newAsksPrice,t=this.asksInViewKeys,i=this.asks,r=this.asksSizeChangeLog;this.orderLogHandler(t,s,i,r,e),this.orderHandler(this.asks,e),this.setAsksInViewKeys()},orderLogHandler(e,s,t,i,r){t.size&&e.length&&r.forEach((([r,o])=>{if(e.includes(r)){const e=t.get(r)[1];o>e?i.set(r,"increase"):o<e?i.set(r,"decrease"):i.set(r,"same")}else s.push(r)}))},orderHandler(e,s){s.forEach((([s,t])=>{"0"!==t?e.set(s,[s,t]):e.delete(s)}))},webSocketOnError(e){console.log(e)},numberWithCommas(e){return e.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")},setBidsInViewKeys(){this.bidsInViewKeys=[...this.bids.keys()].sort().reverse().slice(0,8)},setAsksInViewKeys(){this.asksInViewKeys=[...this.asks.keys()].sort().slice(0,8)},getTotalBarWidth(e,s){return Math.floor(e/s*1e3)/10}}},g=t(89);const p=(0,g.Z)(w,[["render",k],["__scopeId","data-v-4fe44cbf"]]);var f=p;(0,i.ri)(f).mount("#app")}},s={};function t(i){var r=s[i];if(void 0!==r)return r.exports;var o=s[i]={exports:{}};return e[i](o,o.exports,t),o.exports}t.m=e,function(){var e=[];t.O=function(s,i,r,o){if(!i){var n=1/0;for(d=0;d<e.length;d++){i=e[d][0],r=e[d][1],o=e[d][2];for(var a=!0,c=0;c<i.length;c++)(!1&o||n>=o)&&Object.keys(t.O).every((function(e){return t.O[e](i[c])}))?i.splice(c--,1):(a=!1,o<n&&(n=o));if(a){e.splice(d--,1);var l=r();void 0!==l&&(s=l)}}return s}o=o||0;for(var d=e.length;d>0&&e[d-1][2]>o;d--)e[d]=e[d-1];e[d]=[i,r,o]}}(),function(){t.n=function(e){var s=e&&e.__esModule?function(){return e["default"]}:function(){return e};return t.d(s,{a:s}),s}}(),function(){t.d=function(e,s){for(var i in s)t.o(s,i)&&!t.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:s[i]})}}(),function(){t.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){t.o=function(e,s){return Object.prototype.hasOwnProperty.call(e,s)}}(),function(){var e={143:0};t.O.j=function(s){return 0===e[s]};var s=function(s,i){var r,o,n=i[0],a=i[1],c=i[2],l=0;if(n.some((function(s){return 0!==e[s]}))){for(r in a)t.o(a,r)&&(t.m[r]=a[r]);if(c)var d=c(t)}for(s&&s(i);l<n.length;l++)o=n[l],t.o(e,o)&&e[o]&&e[o][0](),e[o]=0;return t.O(d)},i=self["webpackChunknogle_exam"]=self["webpackChunknogle_exam"]||[];i.forEach(s.bind(null,0)),i.push=s.bind(null,i.push.bind(i))}();var i=t.O(void 0,[998],(function(){return t(9562)}));i=t.O(i)})();
//# sourceMappingURL=app.452ba0ed.js.map