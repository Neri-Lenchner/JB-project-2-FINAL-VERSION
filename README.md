# Cryptonite - Live Crypto Tracker

A vanilla TypeScript web app for tracking live cryptocurrency prices and charts.

## Features

- Browse the **top 100 cryptocurrencies** by market cap
- **More Info** panel per coin — shows current price in USD, EUR, and ILS (cached for 2 minutes)
- **Search** by coin symbol
- Select up to **5 currencies** and view a **live price chart** that updates every 2 seconds
- Custom loading animation

## Tech Stack

- TypeScript (compiled with `tsc`)
- HTML / CSS (no frameworks)
- [CoinGecko API](https://www.coingecko.com/en/api) — currency list and individual coin data
- [CryptoCompare API](https://min-api.cryptocompare.com/) — live prices for the chart
- [CanvasJS](https://canvasjs.com/) — chart rendering

## Getting Started

1. Clone the repo
2. Run the TypeScript compiler in watch mode:
   ```bash
   tsc --watch
   ```
3. Open `index.html` with Live Server (VS Code extension)

## Notes

- No build tools or package manager required
- Data is cached in `localStorage` to reduce API calls
