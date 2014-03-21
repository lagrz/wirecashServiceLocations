/* jshint camelcase:false*/
(function (window, $, google) {
    'use strict';

    var WCGmapsAPILoader = {
        /**
         * Dynamically loads the google maps api options:
         * key: maps api key, sensor: use sensor, gmapsLoaded: callback when done loading
         * @param options
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
         * @param options
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
         * @param cb
         * @param options
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
         * @param options
         */
        loadGmaps: function (options) {
            if (!google && options.key.length !== 0) {
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

    $.WCGmapsAPILoader = WCGmapsAPILoader;

})(this, this.jQuery, this.google);