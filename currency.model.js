/**
 * Represents a single cryptocurrency with its core metadata and current pricing information.
 * Used throughout the application for listing, selection, detailed views, and live charting.
 */
export class Currency {
    id;
    symbol;
    name;
    isOn;
    image;
    priceUSD;
    priceEUR;
    priceILS;
    timeStamp;
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
    constructor(id, symbol, name, isOn = false, image = '', priceUSD = '', priceEUR = '', priceILS = '', timeStamp = 0) {
        this.id = id;
        this.symbol = symbol;
        this.name = name;
        this.isOn = isOn;
        this.image = image;
        this.priceUSD = priceUSD;
        this.priceEUR = priceEUR;
        this.priceILS = priceILS;
        this.timeStamp = timeStamp;
    }
}
//# sourceMappingURL=currency.model.js.map