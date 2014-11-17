/* jshint camelcase:false*/
/* global google */
(function (window, $) {
    'use strict';

    /**
     * Creates a google maps object, also decorates ServiceLocation object(s) with various google objects.<br/>
     * For more information on the google maps api v3 refer to their docs page at:<br/>
     * {@link https://developers.google.com/maps/documentation/javascript/tutorial}
     * @param {object} options
     * @param {jQuery} options.container The jQuery container object
     * @param {object} options.mapsOptions Additional google maps options to be passed through
     * @constructor
     * @memberOf WC
     */
    var GMaps = function (options) {
        this.options = $.extend({}, {
            container: $(),
            mapsOptions: {}
        }, options || {});

        this.map = null;
        this.geocoder = null;
        this._initGmaps();
    };

    /**
     * @property {object} prototype A simple shortcut to the GMaps prototype object
     * @memberOf WC.GMaps
     */
    var fn = GMaps.fn = GMaps.prototype;

    /**
     * Ensures given object is an array by checking or placing it in one
     * @param {*} obj
     * @returns {array}
     * @method WC.GMaps#_ensureList
     * @private
     */
    fn._ensureList = function (obj) {
        if (!$.isArray(obj)) {
            obj = [obj];
        }
        return obj;
    };

    /**
     * Instantiates certain google maps services
     * @method WC.GMaps#_initGmaps
     * @private
     */
    fn._initGmaps = function () {
        this.geocoder = new google.maps.Geocoder();

        var latlng = new google.maps.LatLng(-104.8352628, 37.9452861);

        var myOptions = {
            zoom: 5,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        this.map = new google.maps.Map(this.options.container[0], $.extend(myOptions, this.options.mapsOptions));
    };

    /**
     * Geocodes an address to latln format
     * @param {WC.ServiceLocation} serviceLocation An object containing lat lng keys or an array containing the various address sections
     * @param {function} callback Argument given to callback is either false if failed or an object with latlng key and normalized address key
     * @method WC.GMaps#geoCodeAddress
     */
    fn.geoCodeAddress = function (serviceLocation, callback) {
        var addressRequest = {};

        if ($.isArray(serviceLocation.get('address'))) {

            var location = $.map(serviceLocation.get('address'),function (val) {
                return val.length ? val + ';' : '';
            }).join('');

            addressRequest.address = location;
        } else if (serviceLocation.get('coordinates').latitude !== 0) {

            addressRequest.latlng = new google.maps.LatLng(
                  serviceLocation.get('coordinates').latitude,
                  serviceLocation.get('coordinates').longitude
            );
        }
        this.geocoder.geocode(addressRequest, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK && results.length) {

                var location = results[0].geometry.location;

                serviceLocation.set('gmapAddress', results[0].formatted_address);
                serviceLocation.set('gmapLatLng', new google.maps.LatLng(location.lat, location.lng));

                callback({
                    latlng: location,
                    address: results[0].formatted_address,
                    serviceLocation: serviceLocation
                });
            } else {
                callback(false);
            }
        });
    };
    /**
     * Sets a Google LatLng object to WC.ServiceLocation object
     * @param {WC.ServiceLocation} serviceLocation Service Location Object
     * @method WC.GMaps#setLatLng
     */
    fn.setLatLng = function (serviceLocation) {
        if (serviceLocation.get('coordinates').latitude !== 0) {

            var latlnt = new google.maps.LatLng(
                  serviceLocation.get('coordinates').latitude,
                  serviceLocation.get('coordinates').longitude
            );

            serviceLocation.set('gmapLatLng', latlnt);
        }
    };

    /**
     * Creates the google maps marker and sets it on to the WC.ServiceLocation object
     * @param {WC.ServiceLocation | array} serviceLocation Service Location Object
     * @method WC.GMaps#createMarker
     */
    fn.createMarker = function (serviceLocation) {
        serviceLocation = this._ensureList(serviceLocation);

        for (var i = 0, s = serviceLocation.length; i < s; i++) {
            var latlng = serviceLocation[i];

            var marker = new google.maps.Marker({//draws the markers
                position: latlng.get('gmapLatLng'),
                map: null
            });

            latlng.set('gmapMarker', marker);
        }
    };

    /**
     * Creates Hover mouse event for markers
     * @param {WC.ServiceLocation | array} serviceLocation Service Location Object
     * @param {function} callbackOver Callback function to handle the Mouse Over event
     * @param {function} callbackOut Callback function to handle the Mouse Out event
     * @param {object} context Context to be used on the callback functions
     * @method WC.GMaps#createMarkerEvents
     */
    fn.createMarkerEvents = function (serviceLocation, callbackOver, callbackOut, context) {
        serviceLocation = this._ensureList(serviceLocation);

        for (var i = 0, s = serviceLocation.length; i < s; i++) {
            var location = serviceLocation[i];
            var marker = location.get('gmapMarker');
            google.maps.event.addListener(marker, 'mouseover', $.proxy(callbackOver, context, location));
            google.maps.event.addListener(marker, 'mouseout', $.proxy(callbackOut, context, location));
        }
    };

    /**
     * Toggles a marker
     * @param {WC.ServiceLocation} serviceLocation Service Location Object
     * @param [map] optional param what google map object to toggle the marker in
     * @private
     */
    fn._toggleMarker = function (serviceLocation, map) {
        serviceLocation = this._ensureList(serviceLocation);

        map = map || null;

        for (var i = 0, s = serviceLocation.length; i < s; i++) {
            var location = serviceLocation[i];

            location.get('gmapMarker').setMap(map);
        }
    };

    /**
     * Shows a marker(s)
     * @param {WC.ServiceLocation | array} serviceLocation Service Location Object
     * @method WC.GMaps#showMarker
     */
    fn.showMarker = function (serviceLocation) {
        this._toggleMarker(serviceLocation, this.map);
    };

    /**
     * Hides a marker(s)
     * @param {WC.ServiceLocation | array} serviceLocation Service Location Object
     * @method WC.GMaps#hideMarker
     */
    fn.hideMarker = function (serviceLocation) {
        this._toggleMarker(serviceLocation);
    };

    /**
     * Centers the viewport of the map based on the provided servicelocation(s)
     * @param {WC.ServiceLocation | array} serviceLocation Service Location Object
     * @method WC.GMaps#center
     */
    fn.center = function (serviceLocation) {
        serviceLocation = this._ensureList(serviceLocation);

        var latlngbounds = new google.maps.LatLngBounds();

        for (var i = 0, s = serviceLocation.length; i < s; i++) {
            var location = serviceLocation[i];
            latlngbounds.extend(location.get('gmapLatLng'));
        }

        this.map.setCenter(latlngbounds.getCenter());

        if (serviceLocation.length > 1) {
            this.map.fitBounds(latlngbounds);
        } else {
            this.map.setZoom(15);
        }
    };

    if (!window.hasOwnProperty('WC')) {
        window.WC = {};
    }

    window.WC.GMaps = GMaps;

    $.WCGmaps = GMaps;

})(this, this.jQuery);