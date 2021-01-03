module.exports = function () {

    this.Given(/^I am online at google.co.uk/, function() {

        // use the ./page-objects/google-search.js url property
        return helpers.loadPage(pageObjects.googleSearch.url);
    });

    this.When(/^I search Google for "([^"]*)"$/, function (searchQuery) {

        // execute ./page-objects/google-search.js preformSearch method
        return pageObjects.googleSearch.preformSearch(searchQuery);
    });

    this.Then(/^I should see "([^"]*)" in the results$/, function (keywords) {

        // resolves if an item on the page contains text
        return helpers.waitForLinkText(keywords, false, 30);
    });
};
