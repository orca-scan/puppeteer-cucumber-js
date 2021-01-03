#!/usr/bin/env node

'use strict';

var fs = require('fs-plus');
var path = require('path');
var program = require('commander');
var pjson = require('./package.json');
var cucumber = require('cucumber');

function collectPaths(value, paths) {
    paths.push(value);
    return paths;
}

function coerceInt(value, defaultValue) {

    var int = parseInt(value, 10);

    if (typeof int === 'number') return int;

    return defaultValue;
}

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

program
    .version(pjson.version)
    .description(pjson.description)
    .option('-h, --headless', 'whether to run browser in headless mode. defaults to true unless the devtools option is true', config.headless)
    .option('-b, --browser <path>', 'name of browser to use. defaults to ' + config.browser, config.browser)
    .option('-k, --browser-teardown <optional>', 'browser teardown strategy after every scenario (always, clear, none). defaults to "always"', config.browserTeardownStrategy)
    .option('-d, --disableLaunchReport [optional]', 'Disables the auto opening the browser with test report')
    .option('-j, --junit <path>', 'output path to save junit-report.xml defaults to ' + config.reports)
    .option('-t, --tags <tagName>', 'name of tag to run', collectPaths, [])
    .option('-f, --featureFiles <paths>', 'comma-separated list of feature files to run or path to directory defaults to ' + config.featureFiles, config.featureFiles)
    .option('-x, --timeOut <n>', 'steps definition timeout in milliseconds. defaults to ' + config.timeout, coerceInt, config.timeout)
    .option('-n, --noScreenshot [optional]', 'disable auto capturing of screenshots when an error is encountered')
    .option('-w, --worldParameters <JSON>', 'JSON object to pass to cucumber-js world constructor. defaults to empty', config.worldParameters)
    .option('--devTools', 'auto-open a DevTools. if true headless mode is disabled.', config.devTools)
    .parse(process.argv);

program.on('--help', function () {
    console.log('  For more details please visit https://github.com/orca-scan/puppeteer-cucumber-js#readme\n');
});

// store browserName globally (used within world.js to build driver)
global.browserName = program.browser;
global.browserTeardownStrategy = program.browserTeardown;

// should the browser be headless?
global.headless = program.headless;

// pass dev tools option
global.devTools = program.devTools;

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

// used within world.js to output junit reports
global.junitPath = path.resolve(config.junit || config.reports);

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
