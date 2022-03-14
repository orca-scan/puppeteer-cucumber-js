/* eslint new-cap: "off" */
const { Given, When, Then, setWorldConstructor } = require('@cucumber/cucumber');
const CustomWorld = require('../../runtime/world');

setWorldConstructor(CustomWorld);
CustomWorld.setup();

Given(/^I am online at "([^"]*)"/, function (url) {
    throw new Error('abcdef')
    return helpers.openPage(url);
});

When(/^I search Google for "([^"]*)"$/, function (searchQuery) {

    // execute ./page-objects/google-search.js preformSearch method
    return pageObjects.googleSearch.preformSearch(searchQuery);
});

Then(/^I should see "([^"]*)" in the results$/, function (keywords) {

    // resolves if an item on the page contains text
    return helpers.waitForLinkText(keywords, false, 30);
});

Then(/^I should go back one page$/, function () {
    return page.goBack();
});
