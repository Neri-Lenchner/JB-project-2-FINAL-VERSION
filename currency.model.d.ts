/**
 * Represents a single cryptocurrency with its core metadata and current pricing information.
 * Used throughout the application for listing, selection, detailed views, and live charting.
 */
export declare class Currency {
    id: string;
    symbol: string;
    name: string;
    isOn: boolean;
    image: string | {
        thumb: string;
        small: string;
        large: string;
    };
    priceUSD: string;
    priceEUR: string;
    priceILS: string;
    timeStamp: number;
    /**
     * Creates a new Currency instance.
     *
     * @param id - Unique CoinGecko identifier (e.g. "bitcoin", "ethereum-usd")
     * @param symbol - Short ticker/symbol (e.g. "btc", "eth")
     * @param name - Full display name (e.g. "Bitcoin", "Ethereum")
     * @param isOn - Whether this currency is currently selected for live tracking/charting (default: false)
     * @param image - Image URLs object from CoinGecko (thumb/small/large) or fallback string (default: empty)
     * @param priceUSD - Current price in USD (string to preserve precision/formatting)
     * @param priceEUR - Current price in EUR
     * @param priceILS - Current price in ILS (Israeli Shekel)
     * @param timeStamp - Timestamp (ms since epoch) when prices were last fetched/updated (default: 0)
     */
    constructor(id: string, symbol: string, name: string, isOn?: boolean, image?: string | {
        thumb: string;
        small: string;
        large: string;
    }, priceUSD?: string, priceEUR?: string, priceILS?: string, timeStamp?: number);
}
//# sourceMappingURL=currency.model.d.ts.map