import { Currency } from './currency.model.js';
class Manager {
    currencyList;
    /**
     * Creates a new Manager instance to handle cryptocurrency data fetching and caching.
     * @param {Currency[]} [currencyList=[]] - Initial list of currencies (optional, defaults to empty array).
     */
    constructor(currencyList = []) {
        this.currencyList = currencyList;
    }
    /** getCurrencyList():
     * Fetches the top 100/whole-list cryptocurrencies by market cap from CoinGecko and populates the currencyList.
     * Uses the /coins/markets endpoint which includes basic info + current prices in USD.
     * Shows a loading indicator during the request and hides it when done.
     * @returns {Promise<void>}
     */
    async getCurrencyList() {
        // 'shitCoinsUrl' is what it is- "more is less", I left it here but as a second option //
        const shitCoinsUrl = 'https://api.coingecko.com/api/v3/coins/list';
        const goodCoinsUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1';
        this.show();
        const response = await fetch(goodCoinsUrl);
        if (response.ok) {
            const data = await response.json();
            this.hide();
            this.currencyList = data.map((currencY) => new Currency(currencY.id, currencY.symbol, currencY.name, currencY.isOn, currencY.image, currencY.priceUSD, currencY.priceEUR, currencY.priceILS, Date.now()));
        }
        else {
            this.hide();
            this.currencyList = [];
            return;
        }
    }
    /** getOneCurrency():
     * Fetches detailed information for a single cryptocurrency by its CoinGecko ID.
     * First checks if it's already in the local currencyList (for quick access).
     * Uses the /coins/{id} endpoint to get current prices in USD, EUR, ILS.
     * Shows/hides loading indicator during the network request.
     * @param {string} id - The CoinGecko ID of the currency (e.g. "bitcoin", "ethereum")
     * @returns {Promise<Currency | null>} The detailed Currency object or null if fetch fails
     */
    async getOneCurrency(id) {
        this.show();
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
        if (!response.ok) {
            this.hide();
            return null;
        }
        this.hide();
        const data = await response.json();
        const newCurrency = new Currency(data.id, data.symbol, data.name, false, data.image, data.market_data.current_price.usd, data.market_data.current_price.eur, data.market_data.current_price.ils, data.timeStamp);
        return newCurrency;
    }
    /**
     * Fetches current USD prices for cryptocurrencies using the CryptoCompare API.
     *
     * @param coins - Array of cryptocurrency symbols (e.g. ["BTC", "ETH", "ADA"])
     * @param apiKey - Optional CryptoCompare API key (recommended for better rate limits)
     * @returns Promise that resolves to price data object in the format
     *          `{ [coin: string]: { USD: number } }`
     *          or `undefined` if the request fails
     */
    async getFiveCurrencies(coins, apiKey) {
        const url = apiKey
            ? `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(',')}&tsyms=USD&api_key=${apiKey}`
            : `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(',')}&tsyms=USD`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Failed to fetch prices:", response.status, response.statusText);
            return undefined;
        }
        return await response.json();
    }
    /** saveDataLocally():
     * Saves a single Currency object's data to localStorage for quick retrieval later.
     * Used mainly to cache detailed single-currency data (prices + image) for ~2 minutes.
     * Key format: `one-currency[bitcoin]`, `one-currency[ethereum]`, etc.
     * @param {Currency} oneCurrency - The Currency object to store
     */
    saveDataLocally(oneCurrency) {
        localStorage.setItem(`one-currency${oneCurrency?.id}`, JSON.stringify(oneCurrency));
    }
    /** show():
     * Displays a full-screen loading animation (orbiting currency symbols around a dollar sign).
     * Only adds the loader if it doesn't already exist in the DOM.
     * Called automatically before fetch operations.
     */
    show() {
        if (document.querySelector('.progress-bar-container'))
            return;
        const container = document.createElement('div');
        container.className = 'progress-bar-container';
        container.innerHTML = `
      <div class="currency-loader">
        <div class="center-currency">$</div>
        <div class="orbit orbit1" data-currency="€"></div>
        <div class="orbit orbit2" data-currency="¥"></div>
        <div class="orbit orbit3" data-currency="£"></div>
      </div>
    `;
        document.body.appendChild(container);
    }
    /** hide():
     * Removes the loading animation from the DOM if it exists.
     * Called after successful or failed fetch operations to hide the loader.
     */
    hide() {
        document.querySelector('.progress-bar-container')?.remove();
    }
}
export const manager = new Manager(); // Manager singleton
//# sourceMappingURL=manager.js.map