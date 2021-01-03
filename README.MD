# puppeteer-cucumber-js

JavaScript browser automation framework using official [puppeteer](https://github.com/puppeteer/puppeteer "view puppeteer documentation") and [cucumber-js](https://github.com/cucumber/cucumber-js "view cucumber js documentation").

**Table of Contents**

* [Installation](#installation)
* [Usage](#usage)
  * [Options](#options)
  * [Feature files](#feature-files)
  * [Step definitions](#step-definitions)
  * [Page objects](#page-objects)
  * [Shared objects](#shared-objects)
  * [Helpers](#helpers)
  * [Before/After hooks](#beforeafter-hooks)
  * [Reports](#reports)
  * [How to debug](#how-to-debug)
  * [Directory structure](#directory-structure)
* [Demo](#demo)
* [Bugs](#bugs)
* [Contributing](#contributing)

## Installation

```bash
npm install puppeteer-cucumber-js --save-dev
```

## Usage

```bash
# if install within your project
node ./node_modules/puppeteer-cucumber-js/index.js

# if cloned
cd puppeteer-cucumber-js && npm install && npm start
```

### Options

```bash
-h, --help                          output usage information
-V, --version                       output the version number
-b, --browser <path>                name of browser to use. defaults to chrome
-k, --browser-teardown <optional>   browser teardown strategy after every scenario (always, clear, none). defaults to "always"
-h, --headless                      run browser in headless mode. defaults to false
-d, --disableLaunchReport           disable the auto opening the browser with test report
-j, --junit <path>                  output path to save junit-report.xml defaults to ./reports
-t, --tags <tagName>                name of tag to run
-f, --featureFile <path>            a specific feature file to run
-x, --timeOut <n>                   steps definition timeout in milliseconds. defaults to 10 seconds
-n, --noScreenshot                  disable auto capturing of screenshots when an error is encountered
```

By default tests are run using Google Chrome, to run tests using another browser supply the name of that browser along with the `-b` switch. Available options are:

Browser    | Example
---------- | ---------------
Chrome     | `-b chrome`
Firefox    | `-b firefox`

### Feature files

A feature file is a [Business Readable, Domain Specific Language](http://martinfowler.com/bliki/BusinessReadableDSL.html) file that lets you describe software’s behavior without detailing how that behavior is implemented. Feature files are written using the [Gherkin syntax](https://github.com/cucumber/cucumber/wiki/Gherkin) and must live in a folder named **features** within the root of your project.

```gherkin
# ./features/google-search.feature

Feature: Searching for vote cards app
  As an internet user
  In order to find out more about the itunes vote cards app
  I want to be able to search for information about the itunes vote cards app

  Scenario: Google search for vote cards app
    When I search Google for "itunes vote cards app"
    Then I should see some results
```

### Browser teardown strategy

The browser automatically closes after each scenario to ensure the next scenario uses a fresh browser environment. But
you can change this behavior with the "-k" or the "--browser-teardown" parameter.

Value      |  Description
---------- | ---------------
`always`   | the browser automatically closes (default)
`clear`    | the browser automatically clears cookies, local and session storages
`none`     | the browser does nothing

### Step definitions

Step definitions act as the glue between features files and the actual system under test.

_To avoid confusion **always** return a JavaScript promise from your step definition in order to let cucumber know when your task has completed._

```javascript
// ./step-definitions/google-search-steps.js

module.exports = function () {

    this.Then(/^I should see some results$/, function () {

        // driver wait returns a promise so return that
        return driver.wait(until.elementsLocated(by.css('div.g')), 10000).then(function(){

            // return the promise of an element to the following then.
            return driver.findElements(by.css('div.g'));
        })
        .then(function (elements) {

            // verify this element has children
            expect(elements.length).to.not.equal(0);
        });
    });
};
```

The following variables are available within the ```Given()```, ```When()``` and ```Then()``` functions:

Variable      | Description
------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
`helpers`     | a collection of [helper methods](runtime/helpers.js) _things selenium does not provide but really should!_
`puppeteer`   | the raw [puppeteer](https://github.com/puppeteer/puppeteer) object
`browser`     | instance of the puppeteer [browser](https://pptr.dev/#?product=Puppeteer&version=v5.5.0&show=api-class-browser) object
`page`        | instance of the puppeteer [page](https://pptr.dev/#?product=Puppeteer&version=v5.5.0&show=api-class-page) object
`pageObjects` | collection of page objects loaded from disk and keyed by filename
`shared`      | collection of **shared** objects loaded from disk and keyed by filename
`trace`       | handy trace method to log console output with increased visibility
`assert`      | instance of [chai assert](http://chaijs.com/api/assert/) to ```assert.isOk('everything', 'everything is ok')```
`expect`      | instance of [chai expect](http://chaijs.com/api/bdd/) to ```expect('something').to.equal('something')```

### Page objects

Page objects are accessible via a global ```pageObject``` variable and are automatically loaded from ```./features/page-objects``` folder. Page objects are exposed via a camel-cased version of their filename, for example ```./page-objects/google-search.js``` becomes ```pageObjects.googleSearch```. You can also use subdirectories, for example ```./page-objects/dir/google-search.js``` becomes ```pageObjects.dir.googleSearch```.

Page objects also have access to the same runtime variables available to step definitions.

An example page object:

```javascript
// ./page-objects/google-search.js

module.exports = {

    url: 'http://www.google.co.uk',

    elements: {
        searchInput: 'q',
        searchResultLink: 'div.g > h3 > a'
    },

    /**
     * enters a search term into Google's search box and presses enter
     * @param {string} searchQuery
     * @returns {Promise} a promise to enter the search values
     */
    performSearch: function (searchQuery) {

        var selector = page.googleSearch.elements.searchInput;

        // return a promise so the calling function knows the task has completed
        return driver.findElement(selector).sendKeys(searchQuery, selenium.Key.ENTER);
    }
};
```

And its usage within a step definition:

```js
// ./step-definitions/google-search-steps.js
this.When(/^I search Google for "([^"]*)"$/, function (searchQuery) {

    return helpers.loadPage('http://www.google.com').then(function() {

        // use a method on the page object which also returns a promise
        return page.googleSearch.performSearch(searchQuery);
    })
});
```

### Shared objects

Shared objects allow you to share anything from test data to helper methods throughout your project via a global ```shared``` object. Shared objects are automatically loaded from ```./shared-objects``` _(or the path specified using the ```-o``` switch)_ and made available via a camel-cased version of their filename, for example ```./shared-objects/test-data.js``` becomes ```shared.testData```. You can also use subdirectories, for example ```./shared-objects/dir/test-data.js``` becomes ```shared.dir.testData```.

Shared objects also have access to the same runtime variables available to step definitions.

An example shared object:

```javascript
// ./shared-objects/test-data.js

module.exports = {
    username: "import-test-user",
    password: "import-test-pa**word"
}
```

And its usage within a step definition:

```js
module.exports = function () {

    this.Given(/^I am logged in"$/, function () {

        driver.findElement(by.name('usn')).sendKeys(shared.testData.username);
        driver.findElement(by.name('pass')).sendKeys(shared.testData.password);
    });
};
```

### Helpers

The following helper methods make working with puppeteer a bit easier:

```js
// Load a URL, returning only when all network activity has finished
helpers.loadPage('http://www.google.com');

// Removes an element from the dom
helpers.removeElement('p > span');

// Waits for text to appear on the page
helpers.waitForLinkText('Orca Scan', false, 30);

// Waits for the browser to fire an event (including custom events)
helpers.waitForEvent('app-ready');

// Gets an element within an iframe
helpers.getElementWithinFrame('iframe[src*="consent.google.com"]', '#introAgreeButton > span > span');

// Clicks an element within an iframe
helpers.clickElementWithinFrame('iframe[src*="consent.google.com"]', '#introAgreeButton > span > span');

// Removes all browser cookies
helpers.clearCookies();

// Clears localStorage
helpers.clearLocalStorage();

// Clears sessionStorage
helpers.clearSessionStorage();

// Clears cookies and storage
helpers.clearCookiesAndStorages();
```

### Before/After hooks

You can register before and after handlers for features and scenarios:

| Event          | Example
| -------------- | ------------------------------------------------------------
| BeforeFeature  | ```this.BeforeFeatures(function(feature, callback) {})```
| AfterFeature   | ```this.AfterFeature(function(feature, callback) {});```
| BeforeScenario | ```this.BeforeScenario(function(scenario, callback) {});```
| AfterScenario  | ```this.AfterScenario(function(scenario, callback) {});```

```js
module.exports = function () {

    // add a before feature hook
    this.BeforeFeature(function(feature, done) {
        console.log('BeforeFeature: ' + feature.getName());
        done();
    });

    // add an after feature hook
    this.AfterFeature(function(feature, done) {
        console.log('AfterFeature: ' + feature.getName());
        done();
    });

    // add before scenario hook
    this.BeforeScenario(function(scenario, done) {
        console.log('BeforeScenario: ' + scenario.getName());
        done();
    });

    // add after scenario hook
    this.AfterScenario(function(scenario, done) {
        console.log('AfterScenario: ' + scenario.getName());
        done();
    });
};
```

### Reports

HTML and JSON reports are automatically generated and stored in the default `./reports` folder. This location can be changed by providing a new path using the `-r` command line switch:

![Cucumber HTML report](img/cucumber-html-report.png)

### Directory structure

Your files must live in a `features` folder within the root of your project:

```bash
.
├── page-objects
│   └── orca-scan.js
├── reports
│   ├── cucumber-report.html
│   ├── cucumber-report.json
│   └── junit-report.xml
├── shared-objects
│   └── test-data.js
└── step-definitions
│   └── orca-scan-demo-steps.js
└── orca-scan-demo.feature
```

### How to debug

Most selenium methods return a [JavaScript Promise](https://spring.io/understanding/javascript-promises "view JavaScript promise introduction") that is resolved when the method completes. The easiest way to step in with a debugger is to add a ```.then``` method to a selenium function and place a ```debugger``` statement within it, for example:

```js
module.exports = function () {

    this.When(/^I search Google for "([^"]*)"$/, function (searchQuery, done) {

        driver.findElement(by.name('q')).then(function(input) {
            expect(input).to.exist;
            debugger; // <<- your IDE should step in at this point, with the browser open
            return input;
        })
        .then(function(input){
            input.sendKeys(searchQuery);
            input.sendKeys(selenium.Key.ENTER);

            done(); // <<- let cucumber know you're done
        });
    });
};
```

## Demo

This project includes an example to help you get started. You can run the example using the following command:

```bash
node ./node_modules/puppeteer-cucumber-js/index.js
```

## Bugs

Please raise bugs via the [puppeteer-cucumber-js issue tracker](https://github.com/orca-scan/puppeteer-cucumber-js/issues) and, if possible, please provide enough information to allow the bug to be reproduced.

## Contributing

You can contribute by [raising bugs / suggesting improvements](https://github.com/orca-scan/puppeteer-cucumber-js/issues) or forking the project and submitting pull requests.

## License

Licensed under [ISC License](LICENSE) &copy; [Orca Scan](https://orcascan.com)
