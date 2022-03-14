/* eslint new-cap: "off" */
const { World, Before, After, BeforeAll, AfterAll, setDefaultTimeout } = require('@cucumber/cucumber');

var fs = require('fs-plus');
var path = require('path');
var chalk = require('chalk');
var rawPuppeteerObject = require('puppeteer');
var chaiExpect = require('chai').expect;
var chaiAssert = require('chai').assert;
var reporter = require('cucumber-html-reporter');
var cucumberJunit = require('cucumber-junit');
var edgePaths = require('edge-paths');
var networkSpeeds = require('../runtime/network-speed');

var platform = process.platform;
var edgePath = '';

try {
    edgePath = (platform === 'darwin' || platform === 'win32') ? edgePaths.getEdgePath() : '';
} catch (e) {
    // no action, edge not found.
}

var browserWidth = 1024;
var browserHeight = 768;

/**
 * log output to the console in a readable/visible format
 * @returns {void}
 */
function traceFn(...params) {
    var args = [].slice.call(params);
    var output = chalk.bgBlue.white('\n>>>>> \n' + args + '\n<<<<<\n');

    console.log(output);
}

/**
 * Executes browser teardown strategy
 * @returns {Promise} resolves once teardown complete
 */
function teardownBrowser(browser) {
    switch (browserTeardownStrategy) {
        case 'none':
            return Promise.resolve();
        case 'clear':
            return helpers.clearCookiesAndStorages();
        default:
            if (browser) {
                return browser.close();
            }
            else {
                return Promise.resolve();
            }
    }
}

class CustomWorld extends World {
    constructor(options) {
        super(options);

        var puppeteer = rawPuppeteerObject;                       // the raw puppeteer object
        var browser = null;                              // puppeteer browser object
        var page = null;                                 // puppeteer page object
        var expect = chaiExpect;                             // expose chai expect to allow variable testing
        var assert = chaiAssert;                             // expose chai assert to allow variable testing
        var trace = traceFn;                               // expose an info method to log output to the console in a readable/visible format

    }
}

CustomWorld.setup = function () {

    setDefaultTimeout(global.DEFAULT_TIMEOUT);

    Before(async function () {
        if (!this.browser) {
            var browserOptions = {
                headless: headless === true,
                product: browserName || 'chrome',
                defaultViewport: null,
                devtools: devTools === true,
                slowMo: global.DEFAULT_SLOW_MO, // slow down by specified ms so we can view in headful mode
                args: [
                    `--window-size=${browserWidth},${browserHeight}`
                ]
            };

            if (this.browserPath !== '') {
                delete browserOptions.product;
                browserOptions.executablePath = this.browserPath;
            }
            else if (browserName === 'edge') {
                delete browserOptions.product;
                browserOptions.executablePath = edgePath;
            }

            this.browser = await rawPuppeteerObject.launch(browserOptions);
        }

        if (!this.page) {

            // chrome opens with exist tab
            var pages = await this.browser.pages();

            // using first tab
            this.page = pages[0];

            // throttle network if required
            if (global.networkSpeed) {

                // connect to dev tools
                var client = await this.page.target()
                    .createCDPSession();

                // set throttling
                await client.send('Network.emulateNetworkConditions', global.networkSpeed);
            }

            // set user agent if present
            if (userAgent !== '') {
                await page.setUserAgent(userAgent);
            }
        }

    });
    After(async function (scenario) {

        const isFailed = scenario.result.status === 'FAILED';

        // if we have a page object and there is an error
        if (this.page && isFailed && !global.noScreenshot) {

            // take a screenshot
            var screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });

            // add a screenshot to the error report
            scenario.attach(Buffer.from(screenshot, 'base64'), 'image/png');
        }

        return teardownBrowser(this.browser);
    });
    AfterAll(async function () {

        var cucumberReportPath = path.resolve(global.reportsPath, 'cucumber-report.json');

        if (global.reportsPath && fs.existsSync(global.reportsPath)) {

            // generate the HTML report
            var reportOptions = {
                theme: 'bootstrap',
                jsonFile: cucumberReportPath,
                output: path.resolve(global.reportsPath, 'cucumber-report.html'),
                reportSuiteAsScenarios: true,
                launchReport: (!global.disableLaunchReport),
                ignoreBadJsonFile: true
            };

            reporter.generate(reportOptions);

            // grab the file data
            var reportRaw = fs.readFileSync(cucumberReportPath)
                .toString()
                .trim();
            var xmlReport = cucumberJunit(reportRaw);
            var junitOutputPath = path.resolve(global.reportsPath, 'junit-report.xml');

            fs.writeFileSync(junitOutputPath, xmlReport);
        }

        // teardownBrowser().then(done);
        return teardownBrowser(this.browser);
    });
};

module.exports = CustomWorld;
