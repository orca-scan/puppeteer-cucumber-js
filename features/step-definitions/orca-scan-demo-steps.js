module.exports = function () {

    this.Given(/^I am on the Orca Scan barcode tracking website/, function() {
        return helpers.loadPage(pageObjects.orcaScan.url);
    });

    this.When(/^I click the Book a demo button$/, async function () {

        // click the book a demo button
        await page.click(pageObjects.orcaScan.selectors.bookADemoButton);

        // wait for calendly iframe to appear
        await page.waitForSelector(pageObjects.orcaScan.selectors.calendlyIFrame);
    });

    this.Then(/^I should be able to book a demo$/, function () {

        // check the calendly booking frame appears
        return page.$(pageObjects.orcaScan.selectors.calendlyIFrame);
    });
};
