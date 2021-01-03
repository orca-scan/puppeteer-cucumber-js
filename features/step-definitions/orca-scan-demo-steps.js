module.exports = function () {

    this.Given(/^I am on the Orca Scan barcode app website/, function() {
        return helpers.loadPage(pageObjects.orcaScan.url);
    });

    this.When(/^I click the "([^"]*)" button$/, function () {
        return page.click(pageObjects.orcaScan.elements.bookADemoButton);
    });

    this.Then(/^I should be able to book an "([^"]*)"$/, function (eventName) {
        return pageObjects.orcaScan.bookADemo(eventName);
    });
};
