const helpers = require("../../runtime/helpers");

module.exports = function () {

    this.When(/^I search Google for "([^"]*)"$/, function (searchQuery) {

        return helpers.loadPage('http://www.google.com').then(function() {

            // use a method on the pageObject which also returns a promise
            return pageObjects.googleSearch.preformSearch(searchQuery);
        });
    });

    this.Then(/^I should see "([^"]*)" in the results$/, function (keywords) {

        // resolves if an item on the page contains text
        return helpers.waitForLinkText(keywords, false, 30);
    });
};
