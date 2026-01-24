import {Currency} from './currency.model.js';

class Manager {

    /**
     * Creates a new Manager instance to handle cryptocurrency data fetching and caching.
     * @param {Currency[]} [currencyList=[]] - Initial list of currencies (optional, defaults to empty array).
     */
    constructor(
      public currencyList: Currency[] = []
    ) {}

    /**
     * Fetches the top 100/whole-list cryptocurrencies by market cap from CoinGecko and populates the currencyList.
     * Uses the /coins/markets endpoint which includes basic info + current prices in USD.
     * Shows a loading indicator during the request and hides it when done.
     * @returns {Promise<void>}
     */
    public async getCurrencyList(): Promise<void> {

        // 'shitCoinsUrl' is what it is- "more is less", I left it here but as a second option //
        const shitCoinsUrl = 'https://api.coingecko.com/api/v3/coins/list';
        const goodCoinsUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1';

      this.show();
      const response: Response = await fetch(goodCoinsUrl);
        if (response.ok) {
            const data:[] = await response.json();
            this.hide();
            this.currencyList = data.map(
              (currencY: {
                  id: string,
                  symbol: string,
                  name: string,
                  isOn: boolean,
                  image: string,
                  priceUSD: string,
                  priceEUR: string,
                  priceILS: string
                  timeStamp: string,
              }): Currency =>
                new Currency(
                  currencY.id,
                  currencY.symbol,
                  currencY.name,
                  currencY.isOn,
                  currencY.image,
                  currencY.priceUSD,
                  currencY.priceEUR,
                  currencY.priceILS,
                  Date.now()
                  )
            );
        } else {
          this.hide();
            this.currencyList = [];
            return;
        }
    }

    /**
     * Fetches detailed information for a single cryptocurrency by its CoinGecko ID.
     * First checks if it's already in the local currencyList (for quick access).
     * Uses the /coins/{id} endpoint to get current prices in USD, EUR, ILS.
     * Shows/hides loading indicator during the network request.
     * @param {string} id - The CoinGecko ID of the currency (e.g. "bitcoin", "ethereum")
     * @returns {Promise<Currency | null>} The detailed Currency object or null if fetch fails
     */
    public async getOneCurrency(id: string): Promise<Currency | null> {

        this.show();
        const response: Response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${id}`
        );
        if (!response.ok) {
            this.hide();
            return null;
        }
      this.hide();
        const data: any = await response.json();
        const newCurrency = new Currency(
          data.id,
          data.symbol,
          data.name,
          false,
          data.image,
          data.market_data.current_price.usd,
          data.market_data.current_price.eur,
          data.market_data.current_price.ils,
          data.timeStamp
        );
        return newCurrency;
    }

    /**
     * Fetches current USD prices for up to 5 cryptocurrencies using CryptoCompare API.
     * Supports optional API key for higher rate limits / reliability.
     * @param {string[]} coins - Array of currency symbols (e.g. ["BTC", "ETH", "ADA"])
     * @param {string} [apiKey] - Optional CryptoCompare API key
     * @returns {Promise<Record<string, { USD: number }> | undefined>}
     *          Object mapping symbol → { USD: price } or undefined on error
     */
    async getFiveCurrencies(
        coins: string[],
        apiKey?: string
    ): Promise<Record<string, { USD: number }> | undefined> {
        const url: string = apiKey
            ? `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(',')}&tsyms=USD&api_key=${apiKey}`
            : `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(',')}&tsyms=USD`;

        const response: Response = await fetch(url);

        if (!response.ok) {
            console.error("Failed to fetch prices:", response.status, response.statusText);
            return undefined;
        }

        // const data: Record<string, { USD: number }> = await response.json();
        // return data;
        return await response.json();
    }

    /**
     * Saves a single Currency object's data to localStorage for quick retrieval later.
     * Used mainly to cache detailed single-currency data (prices + image) for ~2 minutes.
     * Key format: `one-currency[bitcoin]`, `one-currency[ethereum]`, etc.
     * @param {Currency} oneCurrency - The Currency object to store
     */

    public saveDataLocally(oneCurrency: Currency | any): void {
      localStorage.setItem(`one-currency${oneCurrency?.id}`, JSON.stringify(oneCurrency));
    }

    /**
     * Displays a full-screen loading animation (orbiting currency symbols around a dollar sign).
     * Only adds the loader if it doesn't already exist in the DOM.
     * Called automatically before most fetch operations.
     */
    public show(): void {
      if (document.querySelector('.progress-bar-container')) return;

      const container:HTMLDivElement = document.createElement('div');
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

    /**
     * Removes the loading animation from the DOM if it exists.
     * Called after successful or failed fetch operations to hide the loader.
     */
    public hide(): void {
      document.querySelector('.progress-bar-container')?.remove();
     }
  }

export const manager: Manager = new Manager(); // Manager singleton
