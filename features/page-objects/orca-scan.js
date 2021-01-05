module.exports = {

    url: 'https://orcascan.com',

    selectors: {
        bookADemoButton: 'a[onclick^="Calendly.initPopupWidget"]',
        calendlyIFrame: 'iframe[src*="calendly.com"]',
        calendlyIframeDemoButton: 'a[href*="orca-scan/demo"]'
    },

    bookADemo: async function(eventName) {

        var element = await helpers.getElementWithinFrame(pageObjects.orcaScan.selectors.calendlyIFrame, pageObjects.orcaScan.selectors.calendlyIframeDemoButton);

        var text = await page.evaluate(function(el) {
            return el.textContent;
        }, element);

        return Promise.resolve(text.indexOf(eventName) > -1);
    }
};
