/* jshint camelcase:false*/
(function (window, $, google) {
    'use strict';

    /**
     * Basic Object with setter and getter representing base data for ServiceLocation also contains the objects for
     * google maps api.
     * @constructor
     * @param {object} data Base data
     * @param data.address Address
     * @param data.agentCode Code
     * @param data.lat Latitude
     * @param data.lng Longitude
     * @param data.country Country code
     * @param data.currency Currency (USD, MXN)
     * @param data.distance Distance in Miles
     * @param data.hours Location hours
     * @param data.name Location Name
     * @param data.phone Phone number
     * @memberOf WC
     */
    var ServiceLocation = function (data) {
        this.data = $.extend({
            address: null,
            agent_code: null,
            coordinates: {
                'latitude': 0,
                'longitude': 0
            },
            country: null,
            currency: null,
            distance: 0,
            hours_of_ops: null,
            name: null,
            phone: null,
            specialFields: {
                1: [],
                2: []
            },

            //Google maps objects
            gmapMarker: null,
            gmapLatLng: null,
            gmapAddress: null
        }, data || {});

        //update distance to be a shorter number
        try {
            this.data.distance = this.data.distance.toFixed(2);
        } catch (ignore) {}
    };

    /**
     * @property {object} prototype A simple shortcut to the ServiceLocation prototype object
     * @memberOf WC.ServiceLocation
     */
    var fn = ServiceLocation.fn = ServiceLocation.prototype;

    /**
     * Gets specified data
     * @param {string} key Name of the property
     * @returns {*}
     * @method WC.ServiceLocation#get
     */
    fn.get = function (key) {
        if (this.data.hasOwnProperty(key)) {
            return this.data[key];
        }
        return undefined;
    };

    /**
     * Sets specified data
     * @param {string} key Name of the property
     * @param {*} val Value to be stored
     * @method WC.ServiceLocation#set
     */
    fn.set = function (key, val) {
        this.data[key] = val;
    };

    /**
     * Returns an object without excluded items
     * @returns {object}
     * @method WC.ServiceLocation#toJSON
     */
    fn.toJSON = function () {
        //exclude googles objects
        var exclude = ['gmapMarker', 'gmapLatLng', 'gmapAddress'];
        var clone = $.extend({}, this.data);
        for (var i = 0, s = exclude.length; i < s; i++) {
            delete clone[exclude[i]];
        }
        return clone;
    };

    fn.hasSpecialFields = function (section) {
        if (section !== ServiceLocation.SENDER || section !== ServiceLocation.RECIPIENT) {
            return null;
        }
        return this.get('specialFields')[section].length !== 0;
    };

    ServiceLocation.SENDER = 1;
    ServiceLocation.RECIPIENT = 2;

    ServiceLocation.COMPANY = 1;
    ServiceLocation.PRODUCT = 2;
    ServiceLocation.LOCATION = 3;

    if (!window.hasOwnProperty('WC')) {
        window.WC = {};
    }

    window.WC.ServiceLocation = ServiceLocation;

    $.WCServiceLocation = ServiceLocation;

})(this, this.jQuery, this.google);