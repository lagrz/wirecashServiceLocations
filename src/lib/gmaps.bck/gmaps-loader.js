/* jshint camelcase:false*/
define(function (require) {
    'use strict';

    var $ = require('jquery');
    /**
     * Group of method helpers for dynamically loading the google maps api
     * @namespace
     * @memberOf WC
     */
    var GmapsAPILoader = {
        /**
         * Dynamically loads the google maps api options:
         * key: maps api key, sensor: use sensor, gmapsLoaded: callback when done loading
         * @param {object} options
         * @param {string} options.key Google Maps Api key
         * @param {boolean} options.sensor Use mobile sensor
         * @param {function} options.gmapsLoaded Callback when the api is loaded
         */
        init: function (options) {
            options = $.extend({
                key: '',
                sensor: false,
                gmapsLoaded: $.noop
            }, options || {});

            this.loadGmaps(options);
        },
        /**
         * Creates a callback in the global scope removes it after
         * @param {object} options
         * @returns {string}
         */
        buildGlobalCallback: function (options) {
            var cb = 'gmap_' + Date.now();
            window[cb] = function () {
                //google maps api is now loaded
                google = window.google;
                options.gmapsLoaded(google);
                delete window[cb];
            };
            return cb;
        },
        /**
         * Creates the url string with api key
         * @param {function} cb
         * @param {object} options
         * @returns {string}
         */
        buildUrl: function (cb, options) {
            var base = 'https://maps.googleapis.com/maps/api/js?';
            if (options.key.length !== 0) {
                var params = $.extend({}, options, {
                    callback: cb,
                    v: 3
                });
                delete  params.gmapsLoaded;
                return base + $.param(params);
            }
            throw new Error('Invalid set of options');
        },
        /**
         * Dynamically loads the google maps api js file
         * @param {object} options
         */
        loadGmaps: function (options) {
            if (!window.google && options.key && options.key.length !== 0) {
                var s = document.createElement('script');
                var cb = this.buildGlobalCallback(options);
                try {
                    var url = this.buildUrl(cb, options);
                    s.type = 'text/javascript';
                    s.src = url;
                    $('head').append(s);
                } catch (e) {
                    //die
                }
            } else {
                options.gmapsLoaded(window.google);
            }
        }
    };

    return GmapsAPILoader;
});
