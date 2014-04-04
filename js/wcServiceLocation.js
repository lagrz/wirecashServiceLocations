/* jshint camelcase:false*/
(function (window, $, google) {
    'use strict';

    /**
     * Basic Object with setter and getter representing base data for ServiceLocation also contains the objects for
     * google maps api.
     * @constructor
     * @param {object} data
     * @memberOf WC
     */
    var ServiceLocation = function (data) {
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

    /**
     * @property {object} prototype A simple shortcut to the ServiceLocation prototype object
     * @memberOf WC.ServiceLocation
     */
    var fn = ServiceLocation.fn = ServiceLocation.prototype;

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
     * @returns {object}
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

    window.WC.ServiceLocation = ServiceLocation;

    $.WCServiceLocation = ServiceLocation;

})(this, this.jQuery, this.google);