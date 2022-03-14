/* eslint new-cap: "off" */
const { Given, When, Then, setWorldConstructor } = require('@cucumber/cucumber');
const CustomWorld = require('../../runtime/world');

setWorldConstructor(CustomWorld);
CustomWorld.setup();

Given(/^I am on the Orca Scan barcode tracking website/, function() {
    return helpers.loadPage(this.page, pageObjects.orcaScan.url);
});

When(/^I click the Book a demo button$/, async function () {

    // click the book a demo button
    await this.page.click(pageObjects.orcaScan.selectors.bookADemoButton);

    // wait for calendly iframe to appear
    await this.page.waitForSelector(pageObjects.orcaScan.selectors.calendlyIFrame);
});

Then(/^I should be able to book a demo$/, function () {

    // check the calendly booking frame appears
    return this.page.$(pageObjects.orcaScan.selectors.calendlyIFrame);
});
