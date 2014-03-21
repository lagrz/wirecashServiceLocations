/* jshint camelcase:false*/
(function (window, $, google) {
    'use strict';

    var WCGmapsAPILoader = {
        defaultOptions: {
            key: '',
            sensor: false,
            gmapsLoaded: $.noop
        },
        init: function (options) {
            options = $.extend({}, this.defaultOptions, options || {});
            this.loadGmaps(options);
        },
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