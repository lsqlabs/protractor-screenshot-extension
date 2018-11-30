// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const { ProtractorScreenshotExtension } = require('../dist/protractor-screenshot-extension');
const fs = require('fs');
const rimraf = require('rimraf');

exports.config = {
    allScriptsTimeout: 11000,
    specs: [
        './src/**/*.e2e-spec.ts'
    ],
    capabilities: {
        'browserName': 'chrome'
    },
    directConnect: true,
    baseUrl: 'http://localhost:4200/',
    framework: 'jasmine',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000,
        print: function () {}
    },
    onPrepare() {
        browser.screenshotExtension = new ProtractorScreenshotExtension('e2e/screenshots');

        require('ts-node').register({
            project: require('path').join(__dirname, './tsconfig.e2e.json')
        });
        jasmine.getEnv().addReporter(new SpecReporter({
            spec: {
                displayStacktrace: true
            }
        }));
    },
    onComplete() {
        if (fs.existsSync('e2e/screenshots')) {
            rimraf.sync('e2e/screenshots');
        }
    }
};