import { manager } from './manager.js';
import { Currency } from "./currency.model.js";
/**
 * DOM references and event listeners setup
 */
const pagesMonitor = document.getElementById('pages-monitor');
/**
 * Main scrollable container reference (used for initial scroll position)
 */
const container = document.getElementById('scroll-container');
/**
 * Navigation and action buttons
 */
const searchButton = document.querySelector('#search-button');
const aboutButton = document.querySelector('#about-button');
const homeButton = document.querySelector('#home-button');
const liveReportsButton = document.querySelector('#live-reports-button');
/**
 * Main search input field
 */
const mainInput = document.querySelector('#main-input');
/**
 * CryptoCompare API key
 */
const myApiKey = '785e25aa48363b73d265706d01aaf5b730d0f78a58578a8ab52f211ae73e2293';
/**
 * Enter key in main input triggers search
 */
mainInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        search();
    }
});
/**
 * Initial scroll position adjustment
 */
setTimeout(() => {
    container.scrollTop = 590;
}, 0);
/*
   Navigation Button Handlers
 */
/** homeButton.onclick:
 * Home button click handler:
 * - Stops crypto chart if it's active
 * - Clears current page content
 * - Shows loading indicator and renders main currency list (page 2) if >100 coins
 * - Otherwise renders page 2 immediately
 */
homeButton.onclick = () => {
    if (document.querySelector('#chartContainer')) {
        stopCryptoChart();
    }
    clearPagesFromMonitor();
    if (manager.currencyList.length > 100) {
        manager.show();
        setTimeout(() => {
            renderPage2();
            manager.hide();
        }, 600);
    }
    else {
        renderPage2();
    }
};
/** liveReportsButton.onclick:
 * Live Reports button click handler:
 * - Shows alert if no currencies selected
 * - Shows loading indicator for 2 seconds
 * - Stops any existing chart
 * - Clears current page content
 * - Creates chart container
 * - Starts live price chart for up to 5 selected currencies
 */
liveReportsButton.onclick = () => {
    container.scrollTop = 590;
    if (selectedCurrencies.length === 0) {
        alert('Please select at least one currency');
        return;
    }
    manager.show();
    setTimeout(manager.hide, 2000);
    stopCryptoChart();
    clearPagesFromMonitor();
    const symbols = selectedCurrencies.map((selectedCurrency) => selectedCurrency.symbol.toUpperCase());
    const fiveSymbols = [
        symbols[0] || "",
        symbols[1] || "",
        symbols[2] || "",
        symbols[3] || "",
        symbols[4] || ""
    ];
    const chartDiv = document.createElement('div');
    chartDiv.id = "chartContainer";
    chartDiv.className = "chart-container";
    pagesMonitor?.appendChild(chartDiv);
    startCryptoChart(fiveSymbols[0], fiveSymbols[1], fiveSymbols[2], fiveSymbols[3], fiveSymbols[4], myApiKey);
};
/** searchButton.onclick:
 * Search button click handler:
 * Directly triggers the search() function
 * (no cleanup, no loading state — assumes search is fast/filter-based)
 */
searchButton.onclick = () => {
    search();
};
/** aboutButton.onclick:
 * About button click handler:
 * - Stops crypto chart if active
 * - Clears current page content
 * - Renders the "About Me" page (page 3)
 */
aboutButton.onclick = () => {
    container.scrollTop = 590;
    if (document.querySelector('#chartContainer')) {
        stopCryptoChart();
    }
    clearPagesFromMonitor();
    renderPage3();
};
/*
   Global state
 */
const selectedCurrencies = [];
let pendingSixth = null;
let temporaryFixedWindowArray = [];
let isFixedWindowOpen = false;
/*
  I created 'fixedWindowToggleStates' and 'data' as plain objects (Record).
   I am not sure if it would be better to create an interface for it,
   but it did not seem crucial to me in these cases,
   so I left it as a plain object eventually.
*/
let fixedWindowToggleStates = {};
/*
   Page rendering functions
*/
/** function renderPage2()?:
 * Renders the main currency list page:
 * - Creates a container for the currency cards
 * - Appends it to the pages monitor
 * - Displays all available currencies
 */
function renderPage2() {
    const listContainer = document.createElement('div');
    listContainer.className = 'pages-monitor';
    pagesMonitor?.appendChild(listContainer);
    renderCurrencyList(manager.currencyList, listContainer, selectedCurrencies);
}
/** function renderPage3():
 * Renders main currency list view (Page 2):
 * - Creates container with class 'pages-monitor'
 * - Appends it to pagesMonitor
 * - Passes all currencies from manager + selected currencies
 *   to renderCurrencyList() for actual card/row rendering
 */
function renderPage3() {
    clearPagesFromMonitor();
    const container = document.createElement('div');
    container.classList.add('page-3-container');
    const title = document.createElement('h1');
    title.className = 'about-headline';
    title.textContent = 'About-Me';
    const text = document.createElement('p');
    text.className = 'about';
    text.innerHTML = `I am a young Fullstack developer who intends to integrate all the rich life experience he has accumulated, over the thousand years that have passed him, into the amazing humble art of web development.<br>
Born in 1977 and having spent most of my life creating music, I see web development as a natural continuation of my artistic journey.<br>
Both fields require creativity, structure, rhythm, and emotional expression just in different forms.<br>
With a strong background in composition and sound design, I approach code the same way I approach music: building harmony between logic and creativity, crafting experiences that are both functional and expressive.<br>
This new path continues to inspire me, and I find the world of web development truly mind-blowing.`;
    const textWrapper = document.createElement('div');
    textWrapper.className = 'about-wrapper';
    textWrapper.appendChild(text);
    const img = document.createElement('img');
    img.className = 'my-own-image';
    img.src = 'me.jpg';
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'img-wrapper';
    const midSectionAbout = document.createElement('div');
    midSectionAbout.className = 'mid-section-about';
    imgWrapper.appendChild(img);
    midSectionAbout.append(textWrapper, imgWrapper);
    container.append(title, midSectionAbout);
    pagesMonitor?.appendChild(container);
}
/*
   Chart logic stuff
*/
let chart;
let updateIntervalId = null;
const maxPoints = 20;
/** function addSymbols():
 * Formats large numeric values with currency symbols and suffixes:
 * - Converts numbers to compact form (K, M, B)
 * - Preserves readable precision using CanvasJS formatting
 * - Prefixes the value with a dollar sign
 */
function addSymbols(valueObject) {
    const suffixes = ["", "K", "M", "B"];
    let order = Math.max(Math.floor(Math.log(Math.abs(valueObject.value)) / Math.log(1000)), 0);
    if (order > suffixes.length - 1)
        order = suffixes.length - 1;
    const formattedValue = CanvasJS.formatNumber(valueObject.value / Math.pow(1000, order));
    return "$" + formattedValue + suffixes[order];
}
/** function formatTimeLabel():
 * Formats number to compact currency string with $ + K/M/B suffix
 * Examples: 1234 → "$1.23K",  2500000 → "$2.5M",  42 → "$42"
 * Uses CanvasJS.formatNumber for locale-aware decimals/commas
 */
function formatTimeLabel(e) {
    const hours = String(e.value.getHours()).padStart(2, "0");
    const minutes = String(e.value.getMinutes()).padStart(2, "0");
    const seconds = String(e.value.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}
/** function startCryptoChart():
 * Starts live multi-line price chart for up to 5 cryptocurrencies:
 * - Creates CanvasJS spline chart with dark theme
 * - Assigns fixed colors to each coin
 * - Updates prices every 2 seconds using manager.getFiveCurrencies()
 * - Keeps only the most recent maxPoints data points (sliding window)
 * - Uses formatTimeLabel (x-axis) and addSymbols (y-axis) formatters
 */
function startCryptoChart(coin1, coin2, coin3, coin4, coin5, apiKey) {
    const coins = [coin1, coin2, coin3, coin4, coin5].filter(Boolean);
    const colors = ["cyan", "lime", "blue", "gold", "red"];
    const dataSeries = coins.map((coin, i) => ({
        type: "spline",
        showInLegend: true,
        name: coin,
        color: colors[i],
        lineThickness: 3,
        markerSize: 8,
        dataPoints: []
    }));
    chart = new CanvasJS.Chart("chartContainer", {
        animationEnabled: false,
        theme: "dark1",
        backgroundColor: "black",
        title: {
            text: "Live Crypto Prices (USD)",
            fontColor: "mediumspringgreen"
        },
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
        toolTip: {
            shared: true
        },
        legend: {
            fontColor: "mediumspringgreen", fontSize: 13
        },
        data: dataSeries
    });
    chart.render();
    updateIntervalId = setInterval(async () => {
        try {
            const data = await manager.getFiveCurrencies(coins, apiKey);
            if (!data)
                return;
            const now = new Date();
            coins.forEach((coin, i) => {
                if (coin && data[coin]?.USD !== undefined) {
                    dataSeries[i]?.dataPoints.push({ x: now, y: data[coin].USD });
                    if (dataSeries[i].dataPoints.length > maxPoints) {
                        dataSeries[i].dataPoints.shift();
                    }
                }
            });
            chart.render();
        }
        catch (err) {
            console.error("Error fetching crypto prices:", err);
        }
    }, 2000);
}
/** function stopCryptoChart():
 * Stops the live crypto chart updates:
 * - Clears the price-fetching interval if active
 * - Resets updateIntervalId to null
 */
function stopCryptoChart() {
    if (updateIntervalId !== null) {
        clearInterval(updateIntervalId);
        updateIntervalId = null;
    }
}
/*
   Collapser
 */
/** function createCollapserContainer():
 * Creates HTML string for a collapsible/expandable currency info panel:
 * - Shows coin image (large version if available, fallback to placeholder)
 * - Displays current price in USD, EUR, and ILS
 * - Uses '—' when price data is missing
 */
function createCollapserContainer(currency) {
    const imgSrc = currency?.image?.large || '₵ryptonit€';
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
   Currency card rendering stuff
*/
/** function renderCurrencyList():
 * Renders list of currency cards into the monitor element:
 * - Creates card with symbol, name, "More Info" button and toggle button
 * - "More Info" → shows/hides price panel (USD/EUR/ILS) with 2-minute cache
 * - Toggle button:
 *   • Normal mode: adds/removes from selectedCurrencies (max 5)
 *   • Fixed window mode: only updates local toggle state (no selection change)
 * - Syncs toggle state visually across all matching buttons
 */
function renderCurrencyList(arr, monitor, secondArr, isFixedWindow = false) {
    arr.forEach((currency) => {
        const card = document.createElement('div');
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
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        cardContainer.appendChild(card);
        monitor?.appendChild(cardContainer);
        const toggleBtn = cardContainer.querySelector('.toggle-btn');
        const moreInfoBtn = cardContainer.querySelector('.more-info-btn');
        toggleBtn?.classList.toggle('on', currency.isOn);
        // More Info Button Stuff
        moreInfoBtn?.addEventListener('click', async () => {
            let collapser = cardContainer.querySelector('.collapser-container');
            if (!collapser) {
                collapser = document.createElement('div');
                collapser.className = 'collapser-container';
                cardContainer.appendChild(collapser);
            }
            else {
                collapser.style.display = collapser.style.display === 'none' ? 'block' : 'none';
                return;
            }
            const twoMinutes = 120_000;
            let currencyData = null;
            const stored = localStorage.getItem(`one-currency${currency.id}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Date.now() - (parsed.timeStamp || 0) < twoMinutes) {
                    currencyData = parsed;
                }
            }
            if (!currencyData) {
                currencyData = await manager.getOneCurrency(currency.id);
                if (currencyData) {
                    currencyData.timeStamp = Date.now();
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
            toggleBtn?.addEventListener('click', () => {
                if (!cardContainer.closest('.fixed-container'))
                    return;
                if (!isFixedWindowOpen)
                    return;
                const current = fixedWindowToggleStates[currency.id] ?? currency.isOn;
                const next = !current;
                fixedWindowToggleStates[currency.id] = next;
                toggleBtn.classList.toggle('on', next);
            });
        }
        else {
            toggleBtn?.addEventListener('click', () => {
                if (isFixedWindowOpen)
                    return;
                if (cardContainer.closest('.fixed-container'))
                    return;
                if (!currency.isOn && selectedCurrencies.length === 5 && !isFixedWindowOpen) {
                    pendingSixth = currency;
                    renderSelectedCards();
                    return;
                }
                currency.isOn = !currency.isOn;
                if (currency.isOn) {
                    if (!secondArr.includes(currency))
                        secondArr.push(currency);
                }
                else {
                    const idx = secondArr.indexOf(currency);
                    if (idx !== -1)
                        secondArr.splice(idx, 1);
                }
                const toggles = document.querySelectorAll(`.toggle-btn[data-currency-id="${currency.id}"]`);
                toggles.forEach((toggleButton) => {
                    if (!toggleButton.closest('.fixed-container')) {
                        toggleButton.classList.toggle('on', currency.isOn);
                    }
                });
            });
        }
    });
}
/*
   Fixed window stuff
*/
/** function renderSelectedCards():
 * Opens a fixed selection window when the user tries to choose more than 5 currencies:
 * - Displays the currently selected 5 currencies
 * - Lets the user toggle which ones stay active
 * - Applies the changes or cancels the action
 * - Ensures only 5 currencies remain selected
 */
function renderSelectedCards() {
    if (isFixedWindowOpen || document.querySelector('.fixed-container')) {
        return;
    }
    if (selectedCurrencies.length !== 5 || !pendingSixth)
        return;
    temporaryFixedWindowArray = selectedCurrencies.map((currency) => ({ ...currency, isOn: true }));
    fixedWindowToggleStates = {};
    temporaryFixedWindowArray.forEach((c) => {
        fixedWindowToggleStates[c.id] = true;
    });
    const fixedContainer = document.createElement('div');
    fixedContainer.className = 'fixed-container';
    const headline = document.createElement('div');
    headline.className = 'headline';
    headline.textContent = 'You can only use 5 currencies';
    const applyBtn = document.createElement('button');
    applyBtn.className = 'apply-changes-button';
    applyBtn.textContent = 'Apply';
    applyBtn.addEventListener('click', () => {
        selectedCurrencies.length = 0;
        temporaryFixedWindowArray.forEach((temporaryCurrency) => {
            const isOn = fixedWindowToggleStates[temporaryCurrency.id] ?? false;
            if (isOn && selectedCurrencies.length < 5) {
                const original = manager.currencyList.find((currency) => currency.id === temporaryCurrency.id);
                if (original) {
                    original.isOn = true;
                    selectedCurrencies.push(original);
                }
            }
        });
        manager.currencyList.forEach((globalCurrency) => {
            const index = selectedCurrencies.findIndex((selectedCurrency) => selectedCurrency.id === globalCurrency.id);
            if (index === -1) {
                globalCurrency.isOn = false;
            }
        });
        manager.currencyList.forEach((globalCurrency) => {
            const toggles = document.querySelectorAll(`.toggle-btn[data-currency-id="${globalCurrency.id}"]`);
            toggles.forEach((toggleButton) => toggleButton.classList.toggle('on', globalCurrency.isOn));
        });
        pendingSixth = null;
        temporaryFixedWindowArray = [];
        fixedWindowToggleStates = {};
        isFixedWindowOpen = false;
        fixedContainer.remove();
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'close-button-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
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
/** function search():
 * Searches for a currency by symbol and displays its details in a popup panel:
 * - Removes any existing currency monitor
 * - Validates the user input
 * - Shows an error message if the currency is not found
 * - Renders the currency info if it exists
 * - Allows closing the panel with a button
 */
async function search() {
    document.querySelector('.one-currency-monitor')?.remove();
    const symbol = mainInput?.value.trim().toUpperCase();
    if (!symbol)
        return;
    const currency = manager.currencyList.find((c) => c.symbol.toUpperCase() === symbol);
    const monitor = document.createElement('div');
    monitor.className = 'one-currency-monitor';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.textContent = 'X';
    closeBtn.onclick = () => monitor.remove();
    monitor.appendChild(closeBtn);
    if (!currency) {
        const msg = document.createElement('div');
        msg.className = 'message-container';
        msg.textContent = 'That currency does not exist';
        monitor.appendChild(msg);
    }
    else {
        renderCurrencyList([currency], monitor, selectedCurrencies);
    }
    document.body.appendChild(monitor);
    mainInput.value = '';
}
/*
   Utilities
 */
/** function clearPagesFromMonitor():
 * Removes all child elements from the pages monitor area,
 * resetting the displayed content to an empty state.
 */
function clearPagesFromMonitor() {
    pagesMonitor.innerHTML = '';
}
/** window.addEventListener:
 * Initializes the application on page load:
 * - Fetches the currency list from the API
 * - Renders the main currencies page
 */
window.addEventListener('load', async () => {
    await manager.getCurrencyList();
    renderPage2();
});
//# sourceMappingURL=main.js.map