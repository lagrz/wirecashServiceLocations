/* jshint camelcase:false*/
/* global google */
(function (window, $) {
    'use strict';

    /**
     * Creates a google maps deal
     * @param options
     * @constructor
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

    GMaps.fn = GMaps.prototype;

    /**
     * Ensures given object is an array by checking or placing it in one
     * @param obj
     * @returns {*}
     * @private
     */
    GMaps.fn._ensureList = function (obj) {
        if (!$.isArray(obj)) {
            obj = [obj];
        }
        return obj;
    };

    /**
     * Instantiates certain google maps services
     * @private
     */
    GMaps.fn._initGmaps = function () {
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
     * @param serviceLocation An object containing lat lng keys or an array containing the various address sections
     * @param callback Argument given to callback is either false if failed or an object with latlng key and normalized address key
     */
    GMaps.fn.geoCodeAddress = function (serviceLocation, callback) {
        var addressRequest = {};
        if ($.isArray(serviceLocation.get('address'))) {
            var location = $.map(serviceLocation.get('address'),function (val) {
                return val.length ? val + ';' : '';
            }).join('');
            addressRequest.address = location;
        } else if (serviceLocation.get('lat') !== 0) {
            addressRequest.latlng = new google.maps.LatLng(serviceLocation.get('lat'), serviceLocation.get('lng'));
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
     * Sets a Google LatLng object to ServiceLocation object
     * @param serviceLocation
     */
    GMaps.fn.setLatLng = function (serviceLocation) {
        if (serviceLocation.get('lat') !== 0) {
            var latlnt = new google.maps.LatLng(serviceLocation.get('lat'), serviceLocation.get('lng'));
            serviceLocation.set('gmapLatLng', latlnt);
        }
    };

    /**
     * Creates the google maps marker
     * @param serviceLocation
     */
    GMaps.fn.createMarker = function (serviceLocation) {
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
     * @param serviceLocation
     * @param callbackOver
     * @param callbackOut
     * @param context
     */
    GMaps.fn.createMarkerEvents = function (serviceLocation, callbackOver, callbackOut, context) {
        serviceLocation = this._ensureList(serviceLocation);
        for (var i = 0, s = serviceLocation.length; i < s; i++) {
            var location = serviceLocation[i];
            google.maps.event.addListener(location.get('gmapMarker'), 'mouseover', $.proxy(callbackOver, context, location));
            google.maps.event.addListener(location.get('gmapMarker'), 'mouseout', $.proxy(callbackOut, context, location));
        }
    };

    /**
     * Toggles a marker
     * @param serviceLocation
     * @param [map]
     * @private
     */
    GMaps.fn._toggleMarker = function (serviceLocation, map) {
        serviceLocation = this._ensureList(serviceLocation);
        map = map || null;
        for (var i = 0, s = serviceLocation.length; i < s; i++) {
            var location = serviceLocation[i];
            location.get('gmapMarker').setMap(map);
        }
    };

    /**
     * Shows a marker
     * @param serviceLocation
     */
    GMaps.fn.showMarker = function (serviceLocation) {
        this._toggleMarker(serviceLocation, this.map);
    };

    /**
     * Hides a marker
     * @param serviceLocation
     */
    GMaps.fn.hideMarker = function (serviceLocation) {
        this._toggleMarker(serviceLocation);
    };

    /**
     * Centers the viewport of the map based on the provided servicelocation(s)
     * @param serviceLocation
     */
    GMaps.fn.center = function (serviceLocation) {
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

    $.WCGmaps = GMaps;
})(this, this.jQuery);