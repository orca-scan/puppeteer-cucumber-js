const helpers = require('../../runtime/helpers');

module.exports = {

    url: 'http://www.google.co.uk',

    elements: {
        searchInput: '[name="q"]',
        searchResultLink: 'a > h3 > span'
    },

    /**
     * enters a search term into Google's search box and presses enter
     * @param {string} searchQuery - phrase to search google with
     * @returns {Promise} a promise to enter the search values
     */
    preformSearch: async function (searchQuery) {

        // get the selector above (pageObjects.googleSearch is this object)
        var selector = pageObjects.googleSearch.elements.searchInput;

        // accept Googles `Before you continue` cookie dialog
        await helpers.clickElementWithinFrame('iframe[src*="consent.google.com"]', '#introAgreeButton > span > span');

        // set focus to the search box
        await page.focus(selector);

        // enter the search query
        await page.keyboard.type(searchQuery, { delay: 100 });

        // press enter
        return page.keyboard.press('Enter');
    }
};
