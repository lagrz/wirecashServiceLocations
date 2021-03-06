// Karma configuration
// Generated on Fri Mar 14 2014 12:49:01 GMT-0700 (Pacific Daylight Time)

/*globals module*/

module.exports = function (config) {
    'use strict';

    var connect = require('connect');
    connect().use(connect.static('config')).listen(19877);

    config.set({

        plugins:[
            'karma-jquery',
            'karma-qunit',
            'karma-phantomjs-launcher',
            'karma-jshint-preprocessor'
        ],

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['qunit','jquery-1.11.0'],

        // list of files / patterns to load in the browser
        files: [
            'js/*.js',
            'test/*Spec.js'
        ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'js/*.js': ['jshint']
        },

        proxies: {
            '/config/': 'http://localhost:19877/'
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],

        // web server port
        port: 19876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 5000,

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};
