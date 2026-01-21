declare var CanvasJS: any;

import { manager } from './manager.js';
import { Currency } from "./currency.model.js";

/**
 * DOM references and event listeners setup
 */
const pagesMonitor: HTMLElement | null = document.getElementById('pages-monitor');

/**
 * Main scrollable container reference (used for initial scroll position)
 */
const container = document.getElementById('scroll-container') as HTMLElement;

/**
 * Navigation and action buttons
 */
const searchButton = document.querySelector('#search-button') as HTMLButtonElement;
const aboutButton = document.querySelector('#about-button') as HTMLButtonElement;
const homeButton = document.querySelector('#home-button') as HTMLButtonElement;
const liveReportsButton = document.querySelector('#live-reports-button') as HTMLButtonElement;

/**
 * Main search input field
 */
const mainInput: HTMLInputElement | null = document.querySelector('#main-input') as HTMLInputElement;

/**
 * CryptoCompare API key
 */
const myApiKey: string = '785e25aa48363b73d265706d01aaf5b730d0f78a58578a8ab52f211ae73e2293';

/**
 * Enter key in main input triggers search
 */
mainInput?.addEventListener('keydown', (event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    search();
  }
});

/**
 * Initial scroll position adjustment
 */
setTimeout((): void => {
  container.scrollTop = 590;
}, 0);

/*
   Navigation Button Handlers
 */

/**
 * Home button click handler:
 * - Stops crypto chart if it's active
 * - Clears current page content
 * - Shows loading indicator and renders main currency list (page 2) if >100 coins
 * - Otherwise renders page 2 immediately
 */
homeButton.onclick = (): void => {
  if (document.querySelector('#chartContainer')) {
    stopCryptoChart();
  }
  clearPagesFromMonitor();
  if (manager.currencyList.length > 100) {
    manager.show();
    setTimeout((): void => {
      renderPage2();
      manager.hide();
    }, 600);
  } else {
    renderPage2();
  }
};

/**
 * Live Reports button click handler:
 * - Shows alert if no currencies selected
 * - Shows loading indicator for 2 seconds
 * - Stops any existing chart
 * - Clears current page content
 * - Creates chart container
 * - Starts live price chart for up to 5 selected currencies
 */
liveReportsButton.onclick = (): void => {
  if (selectedCurrencies.length === 0) {
    alert('Please select at least one currency');
    return;
  }

  manager.show();
  setTimeout(manager.hide, 2000);

  stopCryptoChart();
  clearPagesFromMonitor();

  const symbols: string[] = selectedCurrencies.map((c: Currency): string => c.symbol.toUpperCase());
  const fiveSymbols: [string, string, string, string, string] = [
    symbols[0] || "",
    symbols[1] || "",
    symbols[2] || "",
    symbols[3] || "",
    symbols[4] || ""
  ];

  const chartDiv: HTMLDivElement = document.createElement('div');
  chartDiv.id = "chartContainer";
  chartDiv.className = "chart-container";

  pagesMonitor?.appendChild(chartDiv);

  startCryptoChart(fiveSymbols[0], fiveSymbols[1], fiveSymbols[2], fiveSymbols[3], fiveSymbols[4], myApiKey);
};

/**
 * Search button click handler:
 * Directly triggers the search() function
 * (no cleanup, no loading state — assumes search is fast/filter-based)
 */
searchButton.onclick = (): void => {
  search();
};

/**
 * About button click handler:
 * - Stops crypto chart if active
 * - Clears current page content
 * - Renders the "About Me" page (page 3)
 */
aboutButton.onclick = (): void => {
  if (document.querySelector('#chartContainer')) {
    stopCryptoChart();
  }
  clearPagesFromMonitor();
  renderPage3();
}

/*
   Global state
 */

const selectedCurrencies: Currency[] = [];
let pendingSixth: Currency | null = null;
let temporaryFixedWindowArray: Currency[] = [];
let isFixedWindowOpen: boolean = false;

/*
  I created 'fixedWindowToggleStates' as a plain object.
   I am not sure if it would be better if I created an interface for it,
   but it did not seem crucial to me in this case,
   so I left it as a plain object eventually.
*/
let fixedWindowToggleStates: Record<string, boolean> = {};

/*
   Page rendering functions
*/

/**
 * Renders the main currency list page:
 * - Creates a container for the currency cards
 * - Appends it to the pages monitor
 * - Displays all available currencies
 */
function renderPage2(): void {
  const listContainer: HTMLDivElement = document.createElement('div');
  listContainer.className = 'pages-monitor';
  pagesMonitor?.appendChild(listContainer);
  // const currencyList: Currency[] = manager.currencyList;
  renderCurrencyList(manager.currencyList, listContainer, selectedCurrencies);
}

/**
 * Renders main currency list view (Page 2):
 * - Creates container with class 'pages-monitor'
 * - Appends it to pagesMonitor
 * - Passes all currencies from manager + selected currencies
 *   to renderCurrencyList() for actual card/row rendering
 */
function renderPage3(): void {
  clearPagesFromMonitor();

  const container: HTMLDivElement = document.createElement('div');
  container.classList.add('page-3-container');

  const title: HTMLHeadingElement = document.createElement('h1');
  title.className = 'about-headline';
  title.textContent = 'About-Me';

  const text: HTMLParagraphElement = document.createElement('p');
  text.className = 'about';
  text.innerHTML = `I am a young Fullstack developer who intends to integrate all the rich life experience he has accumulated, over the thousand years that have passed him, into the amazing humble art of web development.<br>
Born in 1977 and having spent most of my life creating music, I see web development as a natural continuation of my artistic journey.<br>
Both fields require creativity, structure, rhythm, and emotional expression just in different forms.<br>
With a strong background in composition and sound design, I approach code the same way I approach music: building harmony between logic and creativity, crafting experiences that are both functional and expressive.<br>
This new path continues to inspire me, and I find the world of web development truly mind-blowing.`;

  const textWrapper: HTMLDivElement = document.createElement('div');
  textWrapper.className = 'about-wrapper';
  textWrapper.appendChild(text);

  const img: HTMLImageElement = document.createElement('img');
  img.className = 'my-own-image';
  img.src = 'me.jpg';

  const imgWrapper: HTMLDivElement = document.createElement('div');
  imgWrapper.className = 'img-wrapper';

  const midSectionAbout: HTMLDivElement = document.createElement('div');
  midSectionAbout.className = 'mid-section-about';
  imgWrapper.appendChild(img);
  midSectionAbout.append(textWrapper, imgWrapper);
  container.append(title, midSectionAbout);

  pagesMonitor?.appendChild(container);
}

/*
   Chart logic
*/

let chart: any;
let updateIntervalId: number | null = null;
const maxPoints = 20;

/**
 * Formats large numeric values with currency symbols and suffixes:
 * - Converts numbers to compact form (K, M, B)
 * - Preserves readable precision using CanvasJS formatting
 * - Prefixes the value with a dollar sign
 */
function addSymbols(e: { value: number }): string {
  const suffixes: string[] = ["", "K", "M", "B"];
  let order: number = Math.max(Math.floor(Math.log(Math.abs(e.value)) / Math.log(1000)), 0);
  if (order > suffixes.length - 1) order = suffixes.length - 1;
  const formattedValue: any = CanvasJS.formatNumber(e.value / Math.pow(1000, order));
  return "$" + formattedValue + suffixes[order];
}

/**
 * Formats number to compact currency string with $ + K/M/B suffix
 * Examples: 1234 → "$1.23K",  2500000 → "$2.5M",  42 → "$42"
 * Uses CanvasJS.formatNumber for locale-aware decimals/commas
 */
function formatTimeLabel(e: { value: Date }): string {
  const h: string = String(e.value.getHours()).padStart(2, "0");
  const m: string = String(e.value.getMinutes()).padStart(2, "0");
  const s: string = String(e.value.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Starts live multi-line price chart for up to 5 cryptocurrencies:
 * - Creates CanvasJS spline chart with dark theme
 * - Assigns fixed colors to each coin
 * - Updates prices every 2 seconds using manager.getFiveCurrencies()
 * - Keeps only the most recent maxPoints data points (sliding window)
 * - Uses formatTimeLabel (x-axis) and addSymbols (y-axis) formatters
 */
/*
here I have tried at first to use mySql to manipulate canvas js
but since it made it harder for me to manipulate the graph I decided eventually
to get rid of mysql and use canvas js alone.
I got help from grok and gpt to learn about creating a new CanvasJS.Chart and for creating
the dataSeries returned objects
*/
function startCryptoChart(
    currency1: string,
    currency2: string,
    currency3: string,
    currency4: string,
    currency5: string,
    apiKey?: string
): void {
  const coins: string[] = [currency1, currency2, currency3, currency4, currency5].filter(Boolean);
  const colors: string[] = ["cyan", "lime", "blue", "gold", "red"];

  const dataSeries = coins.map((coin: string, i: number) => ({
    type: "spline" as const,
    showInLegend: true,
    name: coin,
    color: colors[i],
    lineThickness: 3,
    markerSize: 8,
    dataPoints: [] as { x: Date; y: number }[]
  }));

  chart = new CanvasJS.Chart("chartContainer", {
    animationEnabled: false,
    theme: "dark1",
    backgroundColor: "black",
    title: { text: "Live Crypto Prices (USD)", fontColor: "mediumspringgreen" },
    axisX: {
      valueFormatString: "HH:mm:ss",
      labelFormatter: formatTimeLabel,
      labelFontColor: "mediumspringgreen",
      maximumLabels: 5,
    },
    axisY: {
      includeZero: false,
      labelFormatter: addSymbols,
      labelFontColor: "mediumspringgreen",
      maximumLabels: 7
    },
    toolTip: { shared: true },
    legend: { fontColor: "mediumspringgreen", fontSize: 13 },
    data: dataSeries
  });

  chart.render();

  updateIntervalId = setInterval(async (): Promise<void> => {
    try {
      const data: Record<string, { USD: number}> | undefined = await manager.getFiveCurrencies(coins, apiKey);
      if (!data) return;

      const now = new Date();

      coins.forEach((coin: string, i: number): void => {
        if (coin && data[coin]?.USD !== undefined) {
          dataSeries[i]?.dataPoints.push({ x: now, y: data[coin].USD });
          if (dataSeries[i]!.dataPoints.length > maxPoints) {
            dataSeries[i]!.dataPoints.shift();
          }
        }
      });

      chart.render();
    } catch (err) {
      console.error("Error fetching crypto prices:", err);
    }
  }, 2000);
}

/**
 * Stops the live crypto chart updates:
 * - Clears the price-fetching interval if active
 * - Resets updateIntervalId to null
 */
function stopCryptoChart(): void {
  if (updateIntervalId !== null) {
    clearInterval(updateIntervalId);
    updateIntervalId = null;
  }
}

/*
   Collapser (More Info)
 */

/**
 * Creates HTML string for a collapsible/expandable currency info panel:
 * - Shows coin image (large version if available, fallback to placeholder)
 * - Displays current price in USD, EUR, and ILS
 * - Uses '—' when price data is missing
 */
function createCollapserContainer(currency: Currency | null): string {
  const imgSrc: string = (currency?.image as any)?.large || '₵ryptonit€';

  return `
    <div class="collapser">
      <img class="images" src="${imgSrc}">
      <div>Currency Price USD: <span class="collapser-span">${currency?.priceUSD || '—'}</span> $</div>
      <div>Currency Price EUR: <span class="collapser-span">${currency?.priceEUR || '—'}</span> €</div>
      <div>Currency Price ILS: <span class="collapser-span">${currency?.priceILS || '—'}</span> ₪</div>
    </div>
  `;
}

/*
   Currency card rendering
*/

/**
 * Renders list of currency cards into the monitor element:
 * - Creates card with symbol, name, "More Info" button and toggle button
 * - "More Info" → shows/hides price panel (USD/EUR/ILS) with 2-minute cache
 * - Toggle button:
 *   • Normal mode: adds/removes from selectedCurrencies (max 5)
 *   • Fixed window mode: only updates local toggle state (no selection change)
 * - Syncs toggle state visually across all matching buttons
 */
function renderCurrencyList(
    arr: Currency[],
    monitor: HTMLElement | null,
    secArr: Currency[],
    isFixedWindow: boolean = false
): void {
  arr.forEach((currency: Currency): void => {
    const card: HTMLDivElement = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <div class="card-left">
        <div class="currency-shorted-name">${currency.symbol}</div>
        <div class="currency-name">${currency.name}</div>
        <button class="more-info-btn">More Info</button>
      </div>
      <div class="card-right">
        <button class="toggle-btn" data-currency-id="${currency.id}" ${isFixedWindow ? 'data-fixed-window="true"' : ''}></button>
      </div>
    `;

    const cardContainer: HTMLDivElement = document.createElement('div');
    cardContainer.className = 'card-container';
    cardContainer.appendChild(card);
    monitor?.appendChild(cardContainer);

    const toggleBtn = cardContainer.querySelector('.toggle-btn') as HTMLButtonElement;
    const moreInfoBtn = cardContainer.querySelector('.more-info-btn') as HTMLButtonElement;

    toggleBtn?.classList.toggle('on', currency.isOn);

    // More Info Button Stuff
    moreInfoBtn?.addEventListener('click', async (): Promise<void> => {
      let collapser: HTMLDivElement | null = cardContainer.querySelector('.collapser-container') as HTMLDivElement | null;

      if (!collapser) {
        collapser = document.createElement('div');
        collapser.className = 'collapser-container';
        cardContainer.appendChild(collapser);
      } else {
        collapser.style.display = collapser.style.display === 'none' ? 'block' : 'none';
        return;
      }

      const twoMinutes = 120_000;
      let currencyData: Currency | null = null;

      const stored: string | null = localStorage.getItem(`one-currency${currency.id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Currency & { timeStamp?: number };
        if (Date.now() - (parsed.timeStamp || 0) < twoMinutes) {
          currencyData = parsed;
        }
      }

      if (!currencyData) {
        currencyData = await manager.getOneCurrency(currency.id);
        if (currencyData) {
          (currencyData as any).timeStamp = Date.now();
          manager.saveDataLocally(currencyData);
        }
      }

      collapser.innerHTML = createCollapserContainer(currencyData);
    });

    // Toggle logic stuff

    if (isFixedWindow) {
      if (!(currency.id in fixedWindowToggleStates)) {
        fixedWindowToggleStates[currency.id] = currency.isOn;
      }

      toggleBtn?.classList.toggle('on', fixedWindowToggleStates[currency.id] ?? false);

      toggleBtn?.addEventListener('click', (): void => {
        if (!cardContainer.closest('.fixed-container')) return;
        if (!isFixedWindowOpen) return;

        const current: boolean = fixedWindowToggleStates[currency.id] ?? currency.isOn;
        const next: boolean = !current;
        fixedWindowToggleStates[currency.id] = next;
        toggleBtn.classList.toggle('on', next);
      });
    } else {
      toggleBtn?.addEventListener('click', (): void => {
        if (isFixedWindowOpen) return;
        if (cardContainer.closest('.fixed-container')) return;

        if (!currency.isOn && selectedCurrencies.length === 5 && !isFixedWindowOpen) {
          pendingSixth = currency;
          renderSelectedCards();
          return;
        }

        currency.isOn = !currency.isOn;

        if (currency.isOn) {
          if (!secArr.includes(currency)) secArr.push(currency)
        } else {
          const idx: number = secArr.indexOf(currency);
          if (idx !== -1) secArr.splice(idx, 1);
        }
        document.querySelectorAll<HTMLButtonElement>(`.toggle-btn[data-currency-id="${currency.id}"]`)
            .forEach((btn: HTMLButtonElement): void => {
              // If the button (or any ancestor) is NOT inside .fixed-container → apply the class
              if (!btn.closest('.fixed-container')) {
                btn.classList.toggle('on', currency.isOn);
              }
            });
      });
    }
  });
}

/*
   Fixed window stuff
*/

/**
 * Opens a fixed selection window when the user tries to choose more than 5 currencies:
 * - Displays the currently selected 5 currencies
 * - Lets the user toggle which ones stay active
 * - Applies the changes or cancels the action
 * - Ensures only 5 currencies remain selected
 */
function renderSelectedCards(): void {
  if (isFixedWindowOpen || document.querySelector('.fixed-container')) {
    return;
  }

  if (selectedCurrencies.length !== 5 || !pendingSixth) return;

  temporaryFixedWindowArray = selectedCurrencies.map((c: Currency) =>
      ({ ...c, isOn: true }));

  fixedWindowToggleStates = {};
  temporaryFixedWindowArray.forEach((c: Currency): void => {
    fixedWindowToggleStates[c.id] = true;
  });

  const fixedContainer: HTMLDivElement = document.createElement('div');
  fixedContainer.className = 'fixed-container';

  const headline: HTMLDivElement = document.createElement('div');
  headline.className = 'headline';
  headline.textContent = 'You can only use 5 currencies';

  const applyBtn: HTMLButtonElement = document.createElement('button');
  applyBtn.className = 'apply-changes-button';
  applyBtn.textContent = 'Apply';
  applyBtn.addEventListener('click', (): void => {
    selectedCurrencies.length = 0;

    temporaryFixedWindowArray.forEach((temp: Currency): void => {
      const isOn: boolean = fixedWindowToggleStates[temp.id] ?? false;
      if (isOn && selectedCurrencies.length < 5) {
        const original: Currency | undefined = manager.currencyList.find((c: Currency): boolean => c.id === temp.id);
        if (original) {
          original.isOn = true;
          selectedCurrencies.push(original);
        }
      }
    });

    // Reset unselected currencies
    manager.currencyList.forEach((globalCurrency: Currency): void => {
      const index: number = selectedCurrencies.findIndex((selectedCurrency: Currency): boolean => selectedCurrency.id === globalCurrency.id);
      if (index === -1) {
        globalCurrency.isOn = false;
      }
    });

    // Update all toggle buttons on page
    manager.currencyList.forEach((globalCurrency: Currency): void => {
      const toggles: NodeListOf<HTMLButtonElement> = document.querySelectorAll<HTMLButtonElement>(`.toggle-btn[data-currency-id="${globalCurrency.id}"]`);
      toggles.forEach((toggle: HTMLButtonElement): boolean => toggle.classList.toggle('on', globalCurrency.isOn));
    });

    // Cleanup
    pendingSixth = null;
    temporaryFixedWindowArray = [];
    fixedWindowToggleStates = {};
    isFixedWindowOpen = false;
    fixedContainer.remove();
  });

  const cancelBtn: HTMLButtonElement = document.createElement('button');
  cancelBtn.className = 'close-button-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', (): void => {
    pendingSixth = null;
    temporaryFixedWindowArray = [];
    fixedWindowToggleStates = {};
    isFixedWindowOpen = false;
    fixedContainer.remove();
  });

  fixedContainer.append(headline, cancelBtn, applyBtn);
  document.body.appendChild(fixedContainer);

  isFixedWindowOpen = true;

  renderCurrencyList(temporaryFixedWindowArray, fixedContainer, temporaryFixedWindowArray, true);
}

/*
   Search
*/

/**
 * Searches for a currency by symbol and displays its details in a popup panel:
 * - Removes any existing currency monitor
 * - Validates the user input
 * - Shows an error message if the currency is not found
 * - Renders the currency info if it exists
 * - Allows closing the panel with a button
 */
async function search(): Promise<void> {
  document.querySelector('.one-currency-monitor')?.remove();

  const symbol: string | undefined = mainInput?.value.trim().toUpperCase();
  if (!symbol) return;

  const currency: Currency | undefined = manager.currencyList.find((c: Currency): boolean => c.symbol.toUpperCase() === symbol);

  const monitor: HTMLDivElement = document.createElement('div');
  monitor.className = 'one-currency-monitor';

  const closeBtn: HTMLButtonElement = document.createElement('button');
  closeBtn.className = 'close-button';
  closeBtn.textContent = 'X';
  closeBtn.onclick = (): void => monitor.remove();

  monitor.appendChild(closeBtn);

  if (!currency) {
    const msg: HTMLDivElement = document.createElement('div');
    msg.className = 'message-container';
    msg.textContent = 'That currency does not exist';
    monitor.appendChild(msg);
  } else {
    renderCurrencyList([currency], monitor, selectedCurrencies);
  }

  document.body.appendChild(monitor);
  mainInput!.value = '';
}

/*
   Utilities
 */

/**
 * Removes all child elements from the pages monitor area,
 * resetting the displayed content to an empty state.
 */
function clearPagesFromMonitor(): void {
  pagesMonitor!.innerHTML = '';
}

/**
 * Initializes the application on page load:
 * - Fetches the currency list from the API
 * - Renders the main currencies page
 */
window.addEventListener('load', async (): Promise<void> => {
  await manager.getCurrencyList();
  renderPage2();
});
