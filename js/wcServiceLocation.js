/* jshint camelcase:false*/
(function (window, $, google) {
    'use strict';

    /**
     * Basic Object with setter and getter representing base data for ServiceLocation
     * @param data
     * @constructor
     */
    var WCServiceLocation = function (data) {
        this.data = $.extend({
            address: null,
            agentCode: null,
            lat: 0,
            lng: 0,
            country: null,
            currency: null,
            distance: 0,
            hours: null,
            name: null,
            phone: null,
            //Google maps objects
            gmapMarker: null,
            gmapLatLng: null,
            gmapAddress: null
        }, data || {});
    };

    var fn = WCServiceLocation.fn = WCServiceLocation.prototype;

    /**
     * Gets specified data
     * @param key
     * @returns {*}
     */
    fn.get = function (key) {
        if (this.data.hasOwnProperty(key)) {
            return this.data[key];
        }
        return undefined;
    };

    /**
     * Sets specified data
     * @param key
     * @param val
     */
    fn.set = function (key, val) {
        this.data[key] = val;
    };

    /**
     * Returns an object without excluded items
     * @returns {*}
     */
    fn.toJSON = function () {
        var exclude = ['gmapMarker', 'gmapLatLng', 'gmapAddress'];
        var clone = $.extend({}, this.data);
        for (var i = 0, s = exclude.length; i < s; i++) {
            delete clone[exclude[i]];
        }
        return clone;
    };

    if (!window.hasOwnProperty('WC')) {
        window.WC = {};
    }

    window.WC.ServiceLocation = WCServiceLocation;

    $.WCServiceLocation = WCServiceLocation;

})(this, this.jQuery, this.google);