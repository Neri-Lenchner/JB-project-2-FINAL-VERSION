import { Currency } from './currency.model.js';
declare class Manager {
    currencyList: Currency[];
    /**
     * Creates a new Manager instance to handle cryptocurrency data fetching and caching.
     * @param {Currency[]} [currencyList=[]] - Initial list of currencies (optional, defaults to empty array).
     */
    constructor(currencyList?: Currency[]);
    /** getCurrencyList():
     * Fetches the top 100/whole-list cryptocurrencies by market cap from CoinGecko and populates the currencyList.
     * Uses the /coins/markets endpoint which includes basic info + current prices in USD.
     * Shows a loading indicator during the request and hides it when done.
     * @returns {Promise<void>}
     */
    getCurrencyList(): Promise<void>;
    /** getOneCurrency():
     * Fetches detailed information for a single cryptocurrency by its CoinGecko ID.
     * First checks if it's already in the local currencyList (for quick access).
     * Uses the /coins/{id} endpoint to get current prices in USD, EUR, ILS.
     * Shows/hides loading indicator during the network request.
     * @param {string} id - The CoinGecko ID of the currency (e.g. "bitcoin", "ethereum")
     * @returns {Promise<Currency | null>} The detailed Currency object or null if fetch fails
     */
    getOneCurrency(id: string): Promise<Currency | null>;
    /**
     * Fetches current USD prices for cryptocurrencies using the CryptoCompare API.
     *
     * @param coins - Array of cryptocurrency symbols (e.g. ["BTC", "ETH", "ADA"])
     * @param apiKey - Optional CryptoCompare API key (recommended for better rate limits)
     * @returns Promise that resolves to price data object in the format
     *          `{ [coin: string]: { USD: number } }`
     *          or `undefined` if the request fails
     */
    getFiveCurrencies(coins: string[], apiKey?: string): Promise<{
        [key: string]: {
            USD: number;
        };
    } | undefined>;
    /** saveDataLocally():
     * Saves a single Currency object's data to localStorage for quick retrieval later.
     * Used mainly to cache detailed single-currency data (prices + image) for ~2 minutes.
     * Key format: `one-currency[bitcoin]`, `one-currency[ethereum]`, etc.
     * @param {Currency} oneCurrency - The Currency object to store
     */
    saveDataLocally(oneCurrency: Currency | any): void;
    /** show():
     * Displays a full-screen loading animation (orbiting currency symbols around a dollar sign).
     * Only adds the loader if it doesn't already exist in the DOM.
     * Called automatically before fetch operations.
     */
    show(): void;
    /** hide():
     * Removes the loading animation from the DOM if it exists.
     * Called after successful or failed fetch operations to hide the loader.
     */
    hide(): void;
}
export declare const manager: Manager;
export {};
//# sourceMappingURL=manager.d.ts.map