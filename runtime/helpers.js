var urlParser = require('url');
const fs = require('fs-extra');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

module.exports = {

    /**
     * returns a promise that is called when the url has loaded and the body element is present
     * @param {string} url - url to load
     * @param {integer} waitInSeconds - number of seconds to wait for page to load
     * @returns {Promise} resolved when url has loaded otherwise rejects
     * @example
     *      await helpers.loadPage('http://www.google.com');
     */
    loadPage: function(page, url, waitInSeconds) {

        // use either passed in timeout or global default
        var timeout = (waitInSeconds) ? (waitInSeconds * 1000) : DEFAULT_TIMEOUT;

        // load the url and wait for all requests to end
        return page.goto(url, { timeout: timeout, waitUntil: 'networkidle0' });
    },

    /**
     * Opens URL in a new tab and set it as the current page, if the URL is
     * already open in another tab in the current browser then we will use
     * that instead of opening a new one.
     * @param {string} url - url to open (or find in existing tab)
     * @param {object} options - puppeteer page.goto options
     * @returns {Promise} resolves once new sheet open or focused
     */
    openPage: async function (url, options) {

        // URLs returned from Chrome always have a trailing /
        // So convert incoming URL to match (converts urlParser.parse('https://api.com?23234234').format() to 'https://api.com/?23234234')
        url = urlParser.parse(url).format();

        const pages = await browser.pages();
        page = pages.find(page => page.url() === url);

        /**
         * We've not been able to find the page in current browser instance,
         * so lets open one and navigate to the url.
         */
        if (page === undefined) {
            page = await browser.newPage();
            await page.goto(url, {
                timeout: DEFAULT_TIMEOUT,
                waitUntil: 'networkidle0',
                ...options
            });
        }

        /**
         * Set the global page and bring to front.
         */
        page.bringToFront();
    },

    /**
     * Removes an element from the dom
     * @param {string} selector - query selector
     * @returns {Promise} resolves when complete
     * @example
     *      await helpers.removeElement('p > span');
     */
    removeElement: function(selector) {

        return page.evaluate(function(elementSelector) {
            var el = document.querySelector(elementSelector);
            if (el) el.remove();
        }, selector);
    },

    /**
     * Waits for text to appear on the page
     * @param {string} text - text to find
     * @param {boolean} exact - exact match if true, otherwise partial
     * @param {integer} waitInSeconds - number of seconds to wait before giving up
     * @returns {Promise} resolves when complete
     * @example
     *      await helpers.waitForLinkText('Orca Scan', false, 30);
     */
    waitForLinkText: function(text, exact, waitInSeconds) {

        // use either passed in timeout or global default
        var timeout = (waitInSeconds) ? (waitInSeconds * 1000) : DEFAULT_TIMEOUT;

        return page.waitForFunction(function(textToFind, exactMatch) {

            return Array.prototype.slice.call(document.querySelectorAll('a')).some(function(link) {

                if (exactMatch) {
                    return link.textContent === textToFind;
                }

                return link.textContent.indexOf(textToFind) > -1;
            });

        }, { timeout: timeout }, text, exact);
    },

    /**
     * Wait for the browser to fire an event (including custom events)
     * @param {string} eventName - Event name
     * @param {integer} waitInSeconds - number of seconds to wait
     * @returns {Promise} resolves when event fires or timeout is reached
     * @example
     *      await helpers.waitForEvent('app-ready');
     */
    waitForEvent: async function(eventName, waitInSeconds) {

        // use either passed in timeout or global default
        var timeout = (waitInSeconds) ? (waitInSeconds * 1000) : DEFAULT_TIMEOUT;

        // use race to implement a timeout
        return Promise.race([

            // add event listener and wait for event to fire before returning
            page.evaluate(function(eventName) {
                return new Promise(function(resolve, reject) {
                    document.addEventListener(eventName, function(e) {
                        resolve(); // resolves when the event fires
                    });
                });
            }, eventName),

            // if the event does not fire within n seconds, exit
            page.waitForTimeout(timeout)
        ]);
    },

    /**
     * Gets an element within an iframe
     * @param {string} frameSelector - query selector for the iframe element
     * @param {string} childSelector - query selector for the child within the iframe
     * @returns {Promise} returns element if found otherwise rejects with an error
     * @example
     *      await helpers.getElementWithinFrame('iframe[src*="consent.google.com"]', '#introAgreeButton > span > span');
     */
    getElementWithinFrame: async function(frameSelector, childSelector) {

        var elementHandle = await page.$(frameSelector);

        if (elementHandle) {
            var frame = await elementHandle.contentFrame();

            if (frame) {
                // as this is an iframe, wait for it to load by waiting for the selector to appear
                await frame.waitForSelector(childSelector);

                return frame.$(childSelector);
            }
        }

        return Promise.reject('frame not found');
    },

    /**
     * Clicks an element within an iframe
     * @param {string} frameSelector - query selector for the iframe element
     * @param {string} childSelector - query selector for the child within the iframe
     * @returns {Promise} resolves when done otherwise throws an error
     * @example
     *      await helpers.clickElementWithinFrame('iframe[src*="consent.google.com"]', '#introAgreeButton > span > span');
     */
    clickElementWithinFrame: async function(frameSelector, childSelector) {

        var el = await helpers.getElementWithinFrame(frameSelector, childSelector);

        if (el) {
            return el.click();
        }

        return Promise.reject('element not found');
    },

    /**
     * Removes all browser cookies
     * @returns {Promise} resolves once done
     * @example
     *      await helpers.clearCookies();
     */
    clearCookies: function() {

        return page.evaluate(function() {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i];
                var eqPos = cookie.indexOf('=');
                var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + '=;' +
                    'expires=Thu, 01-Jan-1970 00:00:01 GMT;' +
                    'path=/;' +
                    'domain=' + window.location.host + ';' +
                    'secure=;';
            }
        });
    },

    /**
     * Clears localStorage
     * @returns {Promise} resolves once done
     * @example
     *      await helpers.clearLocalStorage();
     */
    clearLocalStorage: function() {
        return page.evaluate(function() {
            window.localStorage.clear();
        });
    },

    /**
     * Clears sessionStorage
     * @returns {Promise} resolves once done
     * @example
     *      await helpers.clearSessionStorage();
     */
    clearSessionStorage: function() {
        return page.evaluate(function() {
            window.sessionStorage.clear();
        });
    },

    /**
     * Clears cookies and storage
     * @returns {Promise} resolves once done
     * @example
     *      await helpers.clearCookiesAndStorages();
     */
    clearCookiesAndStorages: async function() {
        await helpers.clearCookies();
        await helpers.clearLocalStorage();
        await helpers.clearSessionStorage();
    },

    /**
     * Stop the browser in debug mode
     * @returns {Promise} resolves once done
     * @example
     *      await helpers.debug();
     */
    debug: function() {

        if (devTools === true) {
            return page.evaluate('debugger');
        }
        return Promise.reject(new Error('DevTools must be enabled to use helpers.debug(). Enable DevTools using the -devTools switch'));
    },

    /**
     * Visual comparison function
     * @param fileName
     * @returns {Promise<void>}
     */
    compareImage: async (fileName) => {
        const verify = require('./imageCompare');
        await verify.assertion(fileName);
        await verify.value();
        await verify.pass();
    },

    /**
     * @param fileName
     * @param elementsToHide
     * @returns {Promise<void>}
     */
    takeImage: async (fileName, elementsToHide) => {
        const verify = require('./imageCompare');
        await verify.takeScreenshot(fileName, elementsToHide);
    },

    /**
     * hideElemements hide elements
     * @param selectors
     */
    hideElements: async (selectors) => {
        selectors = typeof selectors === 'string' ? [selectors] : selectors;
        for (let i = 0; i < selectors.length; i++) {
            const script = `document.querySelectorAll('${selectors[i]}').forEach(element => element.style.opacity = '0')`;
            await browser.execute(script);
        }
    },

    /**
     * showElemements show elements
     * @param selectors
     */
    showElements: async (selectors) => {
        selectors = typeof selectors === 'string' ? [selectors] : selectors;
        for (let i = 0; i < selectors.length; i++) {
            const script = `document.querySelectorAll('${selectors[i]}').forEach(element => element.style.opacity = '1')`;
            await browser.execute(script);
        }
    },

    /**
     * Returns number of pixels that are different between two images
     * @param {string} fileName1 - name of the first file
     * @param {string} fileName2 - name of the second file
     * @returns
     */
    numDiffPixels: async (fileName1, fileName2) => {
        const img1 = PNG.sync.read(fs.readFileSync('./artifacts/visual-regression/original/chrome/positive/' + fileName1 + '.png'));
        const img2 = PNG.sync.read(fs.readFileSync('./artifacts/visual-regression/original/chrome/positive/' + fileName2 + '.png'));
        const { width, height } = img1;
        const diff = new PNG({ width, height });
        const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
        return numDiffPixels;
    }

};
