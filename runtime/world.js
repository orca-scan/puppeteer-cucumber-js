/**
 * world.js is loaded by the cucumber framework before loading the step definitions and feature files
 * it is responsible for setting up and exposing the puppeteer/browser/page/assert etc required within each step definition
 */

var fs = require('fs-plus');
var path = require('path');
var requireDir = require('require-dir');
var merge = require('merge');
var chalk = require('chalk');
var puppeteer = require('puppeteer');
var expect = require('chai').expect;
var assert = require('chai').assert;
var reporter = require('cucumber-html-reporter');
var cucumberJunit = require('cucumber-junit');
var helpers = require('../runtime/helpers.js');
var edgePaths = require('edge-paths');

var edgePath = edgePaths.getEdgePath();
var browserWidth = 1024;
var browserHeight = 768;

/**
 * log output to the console in a readable/visible format
 * @returns {void}
 */
function trace() {
    var args = [].slice.call(arguments);
    var output = chalk.bgBlue.white('\n>>>>> \n' + args + '\n<<<<<\n');

    console.log(output);
}

/**
 * Creates a list of variables to expose globally and therefore accessible within each step definition
 * @returns {void}
 */
function createWorld() {

    var runtime = {
        puppeteer: puppeteer,                   // the raw puppeteer object
        browser: null,                          // puppeteer browser object
        page: null,                             // puppeteer page object
        expect: expect,                         // expose chai expect to allow variable testing
        assert: assert,                         // expose chai assert to allow variable testing
        trace: trace,                           // expose an info method to log output to the console in a readable/visible format
        pageObjects: global.pageObjects || {},  // empty page objects placeholder
        shared: global.shared || {}             // empty shared objects placeholder
    };

    // expose properties to step definition methods via global variables
    Object.keys(runtime).forEach(function (key) {
        if (key === 'driver' && browserTeardownStrategy !== 'always') {
            return;
        }

        // make property/method available as a global (no this. prefix required)
        global[key] = runtime[key];
    });
}

/**
 * Import shared objects, pages object and helpers into global scope
 * @returns {void}
 */
function importSupportObjects() {

    // import shared objects from multiple paths (after global vars have been created)
    if (global.sharedObjectPaths && Array.isArray(global.sharedObjectPaths) && global.sharedObjectPaths.length > 0) {

        var allDirs = {};

        // first require directories into objects by directory
        global.sharedObjectPaths.forEach(function (itemPath) {

            if (fs.existsSync(itemPath)) {

                var dir = requireDir(itemPath, { camelcase: true, recurse: true });

                merge(allDirs, dir);
            }
        });

        // if we managed to import some directories, expose them
        if (Object.keys(allDirs).length > 0) {

            // expose globally
            global.shared = allDirs;
        }
    }

    // import page objects (after global vars have been created)
    if (global.pageObjectPath && fs.existsSync(global.pageObjectPath)) {

        // require all page objects using camel case as object names
        global.pageObjects = requireDir(global.pageObjectPath, { camelcase: true, recurse: true });
    }

    // add helpers
    global.helpers = helpers;
}

/**
 * Executes browser teardown strategy
 * @returns {Promise} resolves once teardown complete
 */
function teardownBrowser() {
    switch (browserTeardownStrategy) {
        case 'none':
            return Promise.resolve();
        case 'clear':
            return helpers.clearCookiesAndStorages();
        default:
            return browser.close();
    }
}

// export the "World" required by cucumber to allow it to expose methods within step def's
module.exports = async function () {

    createWorld();
    importSupportObjects();

    // this.World must be set!
    this.World = createWorld;

    // set the default timeout for all tests
    this.setDefaultTimeout(global.DEFAULT_TIMEOUT);

    // create the browser before scenario if it's not instantiated
    this.registerHandler('BeforeScenario', async function () {

        if (!global.browser) {
            var browserOptions = {
                headless: headless === true,
                product: browserName || 'chrome',
                defaultViewport: null,
                devtools: devTools === true,
                slowMo: 10, // slow down by 10ms so we can view in headful mode
                args: [
                    `--window-size=${browserWidth},${browserHeight}`
                ]
            };

            if (browserName === 'edge') {
                delete browserOptions.product;
                browserOptions.executablePath = edgePath;
            }

            global.browser = await puppeteer.launch(browserOptions);
        }

        if (!global.page) { 

            // chrome opens with exist tab
            var pages = await browser.pages();

            // using first tab
            global.page = pages[0];
        }
    });

    this.registerHandler('AfterFeatures', function (features, done) {

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
            var reportRaw = fs.readFileSync(cucumberReportPath).toString().trim();
            var xmlReport = cucumberJunit(reportRaw);
            var junitOutputPath = path.resolve(global.junitPath, 'junit-report.xml');

            fs.writeFileSync(junitOutputPath, xmlReport);
        }

        if (browserTeardownStrategy !== 'always') {
            browser.quit().then(done);
        }
        else {
            done();
        }
    });

    // executed after each scenario (always closes the browser to ensure fresh tests)
    this.After(async function (scenario) {

        // if we have a page object and there is an error
        if (page && scenario.isFailed() && !global.noScreenshot) {

            // take a screenshot
            var screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });

            // add a screenshot to the error report
            scenario.attach(new Buffer(screenshot, 'base64'), 'image/png');
        }

        return teardownBrowser();
    });
};
