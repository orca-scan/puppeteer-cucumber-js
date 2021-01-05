#!/usr/bin/env node

var fs = require('fs-plus');
var path = require('path');
var program = require('commander');
var pjson = require('./package.json');
var cucumber = require('cucumber');

var config = {
    featureFiles: './features',
    steps: './features/step-definitions',
    pageObjects: './features/page-objects',
    sharedObjects: './features/shared-objects',
    reports: './features/reports',
    browser: 'chrome',
    browserTeardownStrategy: 'always',
    timeout: 15000,
    headless: false,
    devTools: false
};

// global defaults (before cli commands)
global.browserName = 'chrome';
global.browserPath = '';
global.browserTeardownStrategy = config.browserTeardownStrategy;
global.headless = config.headless;
global.devTools = config.devTools;
global.userAgent = '';
global.disableLaunchReport = false;
global.noScreenshot = false;

program
    .version(pjson.version)
    .description(pjson.description)
    .option('--tags <@tagname>', 'cucumber @tag name to run', collectPaths, [])
    .option('--featureFiles <paths>', 'comma-separated list of feature files or path to directory. defaults to ' + config.featureFiles, config.featureFiles)
    .option('--browser <name>', 'name of browser to use (chrome, firefox, edge, brave). default ' + config.browser, config.browser)
    .option('--browserPath <path>', 'optional path to a browser executable')
    .option('--browser-teardown <optional>', 'browser teardown after each scenario (always, clear, none). defaults ' + config.browserTeardownStrategy, config.browserTeardownStrategy)
    .option('--headless', 'whether to run browser in headless mode. defaults to true unless the devtools option is true', config.headless)
    .option('--devTools', 'auto-open a DevTools. if true headless mode is disabled.', config.devTools)
    .option('--noScreenshot', 'disable auto capturing of screenshots when an error is encountered')
    .option('--disableLaunchReport', 'Disables the auto opening the browser with test report')
    .option('--timeOut <number>', 'steps definition timeout in milliseconds. defaults to ' + config.timeout, coerceInt, config.timeout)
    .option('--worldParameters <JSON>', 'JSON object to pass to cucumber-js world constructor. defaults to empty', config.worldParameters)
    .option('--userAgent <string>', 'user agent string')
    .parse(process.argv);

program.on('--help', function () {
    console.log('  For more details please visit https://github.com/orca-scan/puppeteer-cucumber-js#readme\n');
});

// name of the browser to use for the test
global.browserName = program.browser || global.browserName;

// if user specified a browser path, check it exists first
if (program.browserPath) {
    if (fs.existsSync(program.browserPath)) {
        global.browserPath = program.browserPath;
    }
    else {
        throw new Error('browserPath not found');
    }
}

// if user specified brave, attempt to find the path
if (program.browser === 'brave' && global.browserPath === '') {
    var bravePath = findBrave();
    if (bravePath) {
        global.browserPath = bravePath;
        global.browserName = '';
    }
    else {
        throw new Error('Brave Browser not found, check your installation or provide the path using --browserPath');
    }
}

// how should the browser clean up
global.browserTeardownStrategy = program.browserTeardown || global.browserTeardownStrategy;

// should the browser be headless?
global.headless = program.headless;

// pass dev tools option
global.devTools = program.devTools;

// pass user agent if set (remove wrapped quotes)
global.userAgent = String(program.userAgent || '').replace(/(^"|"$)/g, '');

// used within world.js to import page objects
global.pageObjectPath = path.resolve(config.pageObjects);

// used within world.js to output reports
global.reportsPath = path.resolve(config.reports);
if (!fs.existsSync(config.reports)) {
    fs.makeTreeSync(config.reports);
}

// used within world.js to decide if reports should be generated
global.disableLaunchReport = (program.disableLaunchReport);

// used with world.js to determine if a screenshot should be captured on error
global.noScreenshot = (program.noScreenshot);

// set the default timeout to 10 seconds if not already globally defined or passed via the command line
global.DEFAULT_TIMEOUT = global.DEFAULT_TIMEOUT || program.timeOut || 10 * 1000;

// used within world.js to import shared objects into the shared namespace
global.sharedObjectPaths = path.resolve(config.sharedObjects);

// rewrite command line switches for cucumber
process.argv.splice(2, 100);

// allow specific feature files to be executed
if (program.featureFiles) {
    var splitFeatureFiles = program.featureFiles.split(',');

    splitFeatureFiles.forEach(function (feature) {
        process.argv.push(feature);
    });
}

// add switch to tell cucumber to produce json report files
process.argv.push('-f');
process.argv.push('pretty');
process.argv.push('-f');
process.argv.push('json:' + path.resolve(__dirname, global.reportsPath, 'cucumber-report.json'));

// add cucumber world as first required script (this sets up the globals)
process.argv.push('-r');
process.argv.push(path.resolve(__dirname, 'runtime/world.js'));

// add path to import step definitions
process.argv.push('-r');
process.argv.push(path.resolve(config.steps));

// add tag
if (program.tags) {
    program.tags.forEach(function (tag) {
        process.argv.push('-t');
        process.argv.push(tag);
    });
}

if (program.worldParameters) {
    process.argv.push('--world-parameters');
    process.argv.push(program.worldParameters);
}

// add strict option (fail if there are any undefined or pending steps)
process.argv.push('-S');

//
// execute cucumber
//
var cucumberCli = cucumber.Cli(process.argv);

global.cucumber = cucumber;

cucumberCli.run(function (succeeded) {

    var code = succeeded ? 0 : 1;

    function exitNow() {
        process.exit(code);
    }

    if (process.stdout.write('')) {
        exitNow();
    }
    else {
        // write() returned false, kernel buffer is not empty yet...
        process.stdout.on('drain', exitNow);
    }
});

function findBrave() {

    var locations = [
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    ];

    return locations.find(function(item) {
        return fs.existsSync(item);
    });
}

function collectPaths(value, paths) {
    paths.push(value);
    return paths;
}

function coerceInt(value, defaultValue) {

    var int = parseInt(value, 10);

    if (typeof int === 'number') return int;

    return defaultValue;
}
