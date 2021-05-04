let image;
module.exports = {

    url: 'http://www.google.co.uk/',

    selectors: {
        searchInput: '[name="q"]',
        searchResultLink: 'a > h3 > span',
        cookieIFrame: 'iframe[src*="consent.google.com"]',
        cookieAgreeButton: '#introAgreeButton > span > span'
    },

    /**
     * enters a search term into Google's search box and presses enter
     * @param {string} searchQuery - phrase to search google with
     * @returns {Promise} a promise to enter the search values
     */
    preformSearch: async function (searchQuery) {
        image = searchQuery;
        // get the selector above (pageObjects.googleSearch is this object)
        const selector = pageObjects.googleSearch.selectors.searchInput;
        await helpers.takeImage(`${image}_1-0.png`);

        // set focus to the search box
        await page.focus(selector);

        // enter the search query
        await page.keyboard.type(searchQuery, { delay: 100 });

        // press enter
        await helpers.compareImage(`${image}_1-0.png`);
        return page.keyboard.press('Enter');
    }
};
