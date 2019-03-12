const CRYPTOCOMPARE_API_URI = "https://min-api.cryptocompare.com";
const CRYPTOCOMPARE_URI = "https://www.cryptocompare.com";
const COINMARKETCAP_API_URI = "https://api.coinmarketcap.com";

const UPDATE_INTERVAL = 60 * 1000;


let app = new Vue({
  el: "#app",
  data: {
    coins: {},
    coinData: {}
  },
  methods: {

    /**
     * Load up all cryptocurrency data.  This data is used to find what logos
     * each currency has, so we can display things in a friendly way.
     */
    getCoinData: function () {

      axios.get(CRYPTOCOMPARE_API_URI + "/data/all/coinlist")
        .then((resp) => {
          console.log('resp', resp);
          this.coinData = resp.data.Data;
          this.getCoins();
        })
        .catch((err) => {
          this.getCoins();
          console.error(err);
        });
    },

    /**
     * Get the top 5 cryptocurrencies by value.  This data is refreshed each 5
     * minutes by the backing API service.
     */
    getCoins: function () {
      let self = this;

      axios.get(COINMARKETCAP_API_URI + "/v2/ticker/?limit=5")
        .then((resp) => {
          this.coins = resp.data.data;
        })
        .catch((err) => {
          console.error(err);
        });
    },

    /**
     * Given a cryptocurrency ticket symbol, return the currency's logo
     * image.
     */
    getCoinImage: function (symbol) {

      // These two symbols don't match up across API services. I'm manually
      // replacing these here so I can find the correct image for the currency.
      //
      // In the future, it would be nice to find a more generic way of searching
      // for currency images
      symbol = (symbol === "MIOTA" ? "IOT" : symbol);
      symbol = (symbol === "VERI" ? "VRM" : symbol);

      try {
        return CRYPTOCOMPARE_URI + this.coinData[symbol].ImageUrl;

      } catch (err) {
        console.log(err);
      }
    },

    addSocketData(data) {
      const parsed = JSON.parse(data);
      for (coin of Object.values(this.coins)) {
        if (parsed[coin.website_slug]) {
          coin.quotes.USD.price = parsed[coin.website_slug];
        }
      }
      // this.coins = {...this.coins, ...data};
    },

    subscribeToSocket() {
      this.socket = new WebSocket('wss://ws.coincap.io/prices?assets=bitcoin,ethereum,litecoin', ['json', 'xml']);
      this.socket.onmessage = event => {
        const tmpData = JSON.parse(event.data);
        const formatData = JSON.stringify(tmpData, null, '\t');

        this.addSocketData(formatData);
      };

      this.socket.onerror = event => {
        this.socket.close();
        console.log(`Error ${event}`)
      }
    },

    /**
     * Return a CSS color (either red or green) depending on whether or
     * not the value passed in is negative or positive.
     */
    getColor: (num) => {
      return num > 0 ? "color:green;" : "color:red;";
    },
  },

  /**
   * Using this lifecycle hook, we'll populate all of the cryptocurrency data as
   * soon as the page is loaded a single time.
   */
  created: function () {
    this.getCoinData();
    this.subscribeToSocket();
  },
  destroyed() {
    this.socket.close();
  }
});

/**
 * Once the page has been loaded and all of our app stuff is working, we'll
 * start polling for new cryptocurrency data every minute.
 *
 * This is sufficiently dynamic because the API's we're relying on are updating
 * their prices every 5 minutes, so checking every minute is sufficient.
 */
setInterval(() => {
  app.getCoins();
}, UPDATE_INTERVAL);