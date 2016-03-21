(function (window, $) {
    'use strict';

    /**
     * Super tiny and super simple template engine
     * @param {string} tpl The template string to be used. Template keys require encapsulation: {key}
     * @param {object} data The data object used for the template.
     * @returns {string} Result from combining the data with the template
     * @memberOf WC
     */
    function template(tpl, data) {
        for (var p in data) {
            //ensure no prototype keys are used
            if (data.hasOwnProperty.call(data, p)) {
                tpl = tpl.replace(new RegExp('{' + p + '}', 'g'), data[p]);
            }
        }
        return tpl;
    }

    if (!window.hasOwnProperty('WC')) {
        window.WC = {};
    }

    window.WC.template = template;

    $.WCTemplate = template;

})(this, this.jQuery);

/* jshint camelcase:false*/
(function (window, $, google) {
    'use strict';

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

    if (!window.hasOwnProperty('WC')) {
        window.WC = {};
    }

    window.WC.GmapsAPILoader = GmapsAPILoader;

    $.WCGmapsAPILoader = GmapsAPILoader;

})(this, this.jQuery, this.google);

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
        if (obj === undefined) {
            return [];
        }
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

            var location = $.map(serviceLocation.get('address'), function (val) {
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
        } else {
            serviceLocation.set('gmapLatLng', undefined);
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
            if (latlng.get('gmapLatLng') !== null && latlng.get('gmapLatLng') !== undefined) {
                var marker = new google.maps.Marker({//draws the markers
                    position: latlng.get('gmapLatLng'),
                    map: null
                });

                latlng.set('gmapMarker', marker);
            }
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
            if (location.get('gmapMarker') !== null && location.get('gmapMarker') !== undefined) {
                var marker = location.get('gmapMarker');
                google.maps.event.addListener(marker, 'mouseover', $.proxy(callbackOver, context, location));
                google.maps.event.addListener(marker, 'mouseout', $.proxy(callbackOut, context, location));
            }
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
            if (location && location.get('gmapMarker') !== null && location.get('gmapMarker') !== undefined) {
                location.get('gmapMarker').setMap(map);
            }
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
            if(location.get('gmapLatLng') !== null && location.get('gmapLatLng') !== undefined){
                latlngbounds.extend(location.get('gmapLatLng'));
            }
        }

        this.map.setCenter(latlngbounds.getCenter());

        if (serviceLocation.length > 1) {
            this.map.fitBounds(latlngbounds);

            if (this.map.getZoom() >= 15) {
                this.map.setZoom(10);
            }
        } else {
            this.map.setZoom(10);
        }
    };

    if (!window.hasOwnProperty('WC')) {
        window.WC = {};
    }

    window.WC.GMaps = GMaps;

    $.WCGmaps = GMaps;

})(this, this.jQuery);

(function (win, $) {
    'use strict';

    /**
     * Paginator class.
     * @constructor
     * @param {object} opts Options to initialize the class with
     *
     * @param {integer} [opts.show=15] The number of records to show per page
     *
     * @param {string} opts.url The URL that we will be calling via ajax to grab the records
     *
     * @param {object} opts.params An object used to add additional params for each request to the server
     *
     * @param {WC.Pager~onNoData} [opts.onNoData=jQuery.noop]
     * Callback: When no data is returned from ajax call
     *
     * @param {WC.Pager~onCreate} [opts.onCreate=jQuery.noop]
     * Callback: When the class is instantiated
     *
     * @param {WC.Pager~onComplete} [opts.onComplete=jQuery.noop]
     * Callback: When the first page is done generating
     *
     * @param {WC.Pager~onLoadingData} [opts.onLoadingData=jQuery.noop]
     * Callback: When an ajax call is loading
     *
     * @param {WC.Pager~onAjaxError} [opts.onAjaxError=jQuery.noop]
     * Callback: When an ajax call returns an error status
     *
     * @param {WC.Pager~onAjaxComplete} [opts.onAjaxComplete=jQuery.noop]
     * Callback: When an ajax call is complete
     *
     * @param {WC.Pager~onAjaxSuccess} [opts.onAjaxSuccess=jQuery.noop]
     * Callback: When an ajax call is successfull
     *
     * @param {WC.Pager~onBeforePage} [opts.onBeforePage=jQuery.noop]
     * Callback: Before making an ajax request or grabbing the data for a page
     *
     * @param {WC.Pager~onPage} [opts.onPage=jQuery.noop]
     * Callback: When a page request was made
     *
     * @memberOf WC
     */
    var Pager = function (opts) {
        //extend default settings
        this.recs = $.extend({}, {
            show: 15,
            currPage: 0,
            totalPages: 0,
            total: 0,
            url: '',
            params: {},
            onNoData: $.noop,
            onCreate: $.noop,
            onComplete: $.noop,
            onLoadingData: $.noop,
            onAjaxError: $.noop,
            onAjaxComplete: $.noop,
            onAjaxSuccess: $.noop,
            onBeforePage: $.noop,
            onPage: $.noop,
            data: []
        }, opts || {});

        this.ajaxCall = null;

        //run on create callback with object as parameter
        this.recs.onCreate(this);

        this.ajaxSuccessCallback = $.proxy(this.ajaxSuccess, this);

        if (this.recs.data.length !== 0 || this.recs.total !== 0) {
            this.totalPages();
            this.getData(0);
        }
    };
    // Document the callbacks
    /**
     * Callback done when no data came back from the ajax call
     * @callback WC.Pager~onNoData
     * @param {WC.Pager} pagerObject Current instance of the WC.Pager object
     */
    /**
     * Callback done when the class is instantiated
     * @callback WC.Pager~onCreate
     * @param {WC.Pager} pagerObject Current instance of the WC.Pager object
     */
    /**
     * Callback when first page is created
     * @callback WC.Pager~onComplete
     * @param {array} currentPage Current page data
     * @param {object} json Json data returned
     * @param {WC.Pager} pagerObject Current instance of the WC.Pager object
     */
    /**
     * Callback when the ajax call is loading
     * @callback WC.Pager~onLoadingData
     */
    /**
     * Callback when the ajax call returned an error
     * @callback WC.Pager~onAjaxError
     */
    /**
     * Callback done when ajax call is done
     * @callback WC.Pager~onAjaxComplete
     */
    /**
     * Callback when ajax call successfully obtained data from the server side. Provides a callback to first param that
     * needs to be ran with an array param containing that page's data. Used for normalizing the data.
     * @callback WC.Pager~onAjaxSuccess
     * @param {WC.Pager#ajaxSuccessCallback} done This callback needs to be called with the normalized data
     * @param {object} json Json data to be normalized
     */
    /**
     * Callback done before changing pages provides current page's data. Mostly used for processing stuff on before
     * changing to another page.
     * @callback WC.Pager~onBeforePage
     * @param {array} currentPageData Current page data
     */
    /**
     * Callback done to create the current page. Accepts an array with the data for the new page, and the pager object.
     * @callback WC.Pager~onPage
     * @param {array} currentPage Current page data
     * @param {WC.Pager} pagerObject Current instance of the WC.Pager object
     */

    /**
     * @property {object} prototype A simple shortcut to the Pager prototype object
     * @memberOf WC.Pager
     */
    var fn = Pager.fn = Pager.prototype;

    /**
     * Returns the current page
     * @returns {number}
     */
    fn.getCurrentPage = function () {
        return this.recs.currPage;
    };

    /**
     * Returns an array containing the data for the current page
     * @returns {array}
     */
    fn.getCurrentPageData = function () {
        return this.recs.data[this.recs.currPage];
    };

    /**
     * Calculates the total number of pages
     * @returns {number}
     */
    fn.totalPages = function () {
        //calculate the total amount of pages
        this.recs.totalPages = Math.ceil(this.recs.total / this.recs.show);
        return this.recs.totalPages;
    };

    /**
     * Calculates the range for the page number (start, end)
     * @param pageNo
     * @returns {{start: number, end: number}}
     */
    fn.calculateRange = function (pageNo) {
        //get start record number
        var s = (pageNo * this.recs.show);
        //end record number with a fix in case start = 0
        var e = (s < 0 ? 0 : s) + (this.recs.show - 1);

        //in case we are calling for last page
        if (pageNo === (this.recs.totalPages - 1)) {
            var remainder = this.recs.total % this.recs.show;
            //if its an amount not equal to show num then lets calculate it backwards
            s = remainder === 0 ? s : this.recs.total - remainder;
            e = this.recs.total - 1;
        }

        var range = {
            start: s < 0 ? 0 : s,
            end: e > this.recs.total ? this.recs.total - 1 : e
        };

        if(range.end <= 0){
            range.end = this.recs.show - 1;
        }

        return range;
    };

    /**
     * Performs a callback before calling on page callback
     */
    fn.beforePaging = function () {
        if (this.recs.data[this.recs.currPage]) {
            this.recs.onBeforePage(this.recs.data[this.recs.currPage]);
        }
    };

    /**
     * Grabs data from server via ajax call or from local cache
     * @param pageNo
     * @returns {Pager.fn}
     */
    fn.getData = function (pageNo) {
        var self = this;
        this.recs.params = $.extend(this.recs.params, this.calculateRange(pageNo));

        //page already exists in the cache use it
        if (this.recs.data[pageNo]) {
            this.recs.onPage(this.recs.data[pageNo], this);
            return this;
        }

        if (this.recs.url.length) {
            console.log('INSIDE PAGINATOR: ',this.recs);
            this.ajaxCall = $.ajax(this.recs.url, {
                data: this.recs.params,
                type: 'POST',
                beforeSend: this.recs.onLoadingData,
                error: this.recs.onAjaxError,
                complete: function (jqXHR, status) {
                    self.ajaxCall = null;
                    self.recs.onAjaxComplete(jqXHR, status);
                },
                success: function () {
                    var args = Array.prototype.slice.call(arguments, 0);
                    //prepend our callback
                    if (self.recs.onAjaxSuccess !== $.noop) {
                        args.unshift(self.ajaxSuccessCallback);
                        self.recs.onAjaxSuccess.apply(null, args);
                    } else {
                        self.ajaxSuccessCallback(args[0]);
                    }
                }
            });
        } else {
            throw new Error('No Ajax URL Provided');
        }

        return this;
    };

    /**
     * Determines whether or not current ajax call is complete
     * @returns {boolean}
     */
    fn.ajaxDoneLoading = function () {
        if(this.ajaxCall === null){
            return true;
        }

        return this.ajaxCall.readyState === 4;
    };

    /**
     * Function called after ajax call is complete and
     * any data sanitation was performed from the 'onAjaxSuccess' callback
     * @param json
     */
    fn.ajaxSuccess = function (json) {
        var pageNo = this.recs.currPage;

        //first time running
        if (this.recs.data.length === 0 && json.length > 0) {

            //each rec in the array is a page no
            this.recs.data[pageNo] = json;

            this.recs.onPage(this.recs.data[pageNo], this);
            this.recs.onComplete(this.recs.data[pageNo], json, this);
            return;
        } else if (json.length === 0) {
            //no data was returned the first time around
            this.recs.onNoData(this);
            return;
        }

        //each rec in the array is a page no
        this.recs.data[pageNo] = json;
        this.recs.onPage(this.recs.data[pageNo], this);
    };

    /**
     * Returns an object with key and either true or false
     * for each pagination control
     * @returns {{first: *, prev: *, next: *, last: *}}
     */
    fn.pageControls = function () {
        var page = this.recs.currPage;
        var first, prev, next, last;

        if (page === 0) {
            first = prev = false;
            next = last = true;
        } else if (page === (this.recs.totalPages - 1)) {
            first = prev = true;
            next = last = false;
        } else {
            first = prev = next = last = true;
        }

        return {
            'first': first,
            'prev': prev,
            'next': next,
            'last': last
        };
    };

    /**
     * Moves to the next page
     * @returns {Pager.fn}
     */
    fn.next = function () {
        this.beforePaging();
        this.recs.currPage++;
        this.getData(this.recs.currPage);
        return this;
    };
    /**
     * Moves to the previous page
     * @returns {Pager.fn}
     */
    fn.back = function () {
        this.beforePaging();
        this.recs.currPage--;
        this.getData(this.recs.currPage);
        return this;
    };

    /**
     * Moves to the first page
     * @returns {Pager.fn}
     */
    fn.first = function () {
        this.beforePaging();
        this.recs.currPage = 0;
        this.getData(0);//get the first page
        return this;
    };

    /**
     * Moves to the last page
     * @returns {Pager.fn}
     */
    fn.last = function () {
        this.beforePaging();
        this.recs.currPage = this.recs.totalPages - 1;

        //set page to last page
        this.getData(this.recs.currPage);
        return this;
    };

    /**
     * Moves to specified page if its in range
     * @param pageNo
     * @returns {Pager.fn}
     */
    fn.page = function (pageNo) {
        this.beforePaging();
        if (pageNo < this.recs.totalPages && pageNo >= 0) {
            this.recs.currPage = pageNo;
            this.getData(pageNo);
        }
        return this;
    };
    /**
     * Resets the pager to allow changes in search result
     */
    fn.reset = function(){
        if(!this.ajaxDoneLoading() && this.ajaxCall !== null){
            //abort current call
            this.ajaxCall.abort();
        }

        //reset data
        $.extend(this.recs, {
            currPage: 0,
            totalPages: 0,
            total: 0,
            data: []
        });
    };

    if (!window.hasOwnProperty('WC')) {
        window.WC = {};
    }

    window.WC.Pager = Pager;

    $.WCPaginator = Pager;

})(this, this.jQuery);

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

(function (window, $, google) {
    'use strict';

    if (!window.hasOwnProperty('WC')) {
        /**
         * Global Namespace for all classes related to Wirecash.
         * @namespace WC
         */
        window.WC = {};
    }

    var elemIdCounter = 0;
    var ObjectCache = {};

    /**
     * Grabs the element id, and returns it otherwise it will identify it by using a prefix 'anonymous_element_' and a digit (ex: anonymous_element_22)
     * @param {jQuery} $elem Element to be identified
     * @returns {string} Identity of the Element
     * @memberOf WC
     */
    function elemId($elem) {
        var id = $elem.attr('id');
        if (id) {
            return id;
        }
        do {
            id = 'anonymous_element_' + elemIdCounter++;
        } while ($('#' + id)[0]);
        $elem.attr('id', id);
        return id;
    }

    window.WC.elemId = elemId;

    /**
     * Main Class for the Services Locations widget
     * @constructor
     * @param {object} options Options to initialize the class with
     *
     * @param {jQuery} options.container
     * <p>The main container element must be a valid jQuery object, if using the jQuery plugin pattern you can omit this</p>
     *
     * @param {string | function} options.tplMain
     * <p>The main container template, can be either string or a valid html / jQuery element / function that returns a string.</p>
     * <p>It MUST contain at least an element with the following:</p>
     * <ul>
     * <li>Whatever class defined for option 'mapContainer', default: '.wc-map-container'</li>
     * <li>Whatever class defined for option 'contentContainer', default: '.wc-content-container'</li>
     * </ul>
     * <p>The following are optional, but required for pagination:</p>
     * <ul>
     * <li>- Whatever class defined for option 'pageFirst', default: '.wc-first-page'</li>
     * <li>- Whatever class defined for option 'pageLast', default: '.wc-last-page'</li>
     * <li>- Whatever class defined for option 'pageNext', default: '.wc-page-next'</li>
     * <li>- Whatever class defined for option 'pageBack', default: '.wc-page-back'</li>
     * </ul>
     *
     * @param {string | function} options.tplLocation
     * <p>The template that generates each location record, must be a string / function that returns a string</p>
     * <p>Can have any of the following keys:</p>
     * <ul>
     *     <li>{address}</li>
     *     <li>{agentCode}</li>
     *     <li>{lat}</li>
     *     <li>{lng}</li>
     *     <li>{country}</li>
     *     <li>{currency}</li>
     *     <li>{distance}</li>
     *     <li>{hours}</li>
     *     <li>{name}</li>
     *     <li>{phone}</li>
     * </ul>
     *
     * @param {string | element | jQuery} options.tplNoData
     * <p>The template that is displayed in case no data is returned from the server or
     * an ajax error occurred, can be string / html / jQuery</p>
     *
     * @param {string | element | jQuery} options.tplLoading
     * <p>The template that is displayed while the ajax call is running, can be string / html / jQuery </p>
     *
     * @param {integer} [options.pagerShowPerPage=5]
     * <p>The number of records to show per page, must be a number</p>
     *
     * @param {integer} options.pagerTotalRecords
     * <p>The total number of records available, must be a number</p>
     *
     * @param {string} options.pagerRecordsUrl
     * <p>The URL that we will be calling via ajax to grab the records</p>
     *
     * @param {object} options.pagerRecordsParams
     * <p>An object used to add additional params for each request to the server</p>
     *
     * @param {string} options.mapsAPIKey
     * <p>The google maps API key</p>
     *
     * @param {string} [options.pageFirst='.wc-first-page']
     * <p>Specify the selector for the paginator first page button</p>
     *
     * @param {string} [options.pageLast='.wc-last-page']
     * <p>Specify the selector for the paginator last page button</p>
     *
     * @param {string} [options.pageNext='.wc-page-next']
     * <p>The selector for the paginator for the next page button</p>
     *
     * @param {string} [options.pageBack='.wc-page-back']
     * <p>The selector for the paginator for the back page button</p>
     *
     * @param {string} [options.mapContainer='.wc-map-container']
     * <p>The selector for the Google maps canvas container</p>
     *
     * @param {string} [options.contentContainer='.wc-content-container']
     * <p>The selector for service locations container</p>
     *
     * @param {string} [options.pageEnable='wc-enable']
     * <p>A css class that is added when a paginator button is enabled</p>
     *
     * @param {string} [options.pageDisable='wc-disable']
     * <p>A css class that is added when a paginator button is disabled</p>
     *
     * @param {string} [options.recordActive='wc-active']
     * <p>A css class that is toggled when a map marker gets a mouseover / mouseout event</p>
     *
     * @memberOf WC
     */
    var ServiceLocationsView = function (options) {
        this.options = $.extend({
            //the mian container element must be a valid jQuery object
            container: $(),

            //tplMain does not have to be a string can be an html element
            tplMain: '',
            tplLocation: '',
            tplNoData: '',
            tplLoading: '',

            //for Paginator
            pagerShowPerPage: 5,
            pagerTotalRecords: 0,
            pagerRecordsUrl: '',

            //used to add additional params for each request to the server
            pagerRecordsParams: {},
            //Manipulate each individual record (before displaying)
            additionalDataHandler: null,

            //google api
            mapsAPIKey: '',

            //element classes
            pageFirst: '.wc-first-page',
            pageLast: '.wc-last-page',
            pageNext: '.wc-page-next',
            pageBack: '.wc-page-back',
            mapContainer: '.wc-map-container',
            contentContainer: '.wc-content-container',

            //classes added / removed for paging buttons
            pageEnable: 'wc-enable',
            pageDisable: 'wc-disable',

            //class added / removed when a related marker gets mouseover / mouseout event
            recordActive: 'wc-active'
        }, options || {});

        this.container = this.options.container;
        this.pager = null;
        this.gmap = null;
        this.boundMethods = {};

        //ensure google maps api is loaded
        if (!google) {
            $.WCGmapsAPILoader.init({
                key: this.options.mapsAPIKey,
                gmapsLoaded: $.proxy(this.init, this)
            });
        } else {
            //do stuff
            this.init();
        }
    };

    /**
     * @property {object} prototype A simple shortcut to the ServiceLocationsView prototype object
     * @memberOf WC.ServiceLocationsView
     */
    var fn = ServiceLocationsView.fn = ServiceLocationsView.prototype;

    /**
     * Instantiates our pager object with various callback settings ran after we have google object in the global scope
     * @method WC.ServiceLocationsView#init
     * @private
     */
    fn.init = function () {
        //create the pager and its callbacks
        //create the gmap object once we get data for the first time
        var noDataCallback = $.proxy(this._noData, this);

        this.pager = new $.WCPaginator({
            show: this.options.pagerShowPerPage,
            total: this.options.pagerTotalRecords,
            url: this.options.pagerRecordsUrl,
            params: this.options.pagerRecordsParams,

            //------------ CALLBACKS -----------//
            //show no data
            onNoData: noDataCallback,
            onAjaxError: noDataCallback,

            //when object is created
            onCreate: $.proxy(function (pager) {
                //insert base html to container
                if ($.isFunction(this.options.tplMain)) {
                    var html = this.options.tplMain(this.options.pagerRecordsParams);
                    this.container.html(html);
                } else {
                    this.container.html(this.options.tplMain);
                }

                //create the google map obj
                this.gmap = new $.WCGmaps({
                    container: this.container.find(this.options.mapContainer)
                });

                this.container.trigger('WCService:create', [this]);

                if (pager.ajaxDoneLoading()) {
                    pager.getData(0);
                }
            }, this),

            onBeforePage: $.proxy(this._beforePage, this),

            //when it completes its first round
            onComplete: $.proxy(this._firstRun, this),

            //show loading
            onLoadingData: $.proxy(this._loading, this),

            //normalize the data and call its callback
            onAjaxSuccess: $.proxy(this._handleData, this),

            //gets the data for specific page
            onPage: $.proxy(this._showPage, this)
        });

        this.container.on('resizemap', $.proxy(function () {
            window.google.maps.event.trigger(this.gmap.map, "resize");
            this.pager.first();
        }, this));
    };

    /**
     * Callback ran before running a page, used to hide the current markers
     * @param {array} serviceLocations
     * @method WC.ServiceLocationsView#_beforePage
     * @private
     */
    fn._beforePage = function (serviceLocations) {
        this.gmap.hideMarker(serviceLocations);
        this.container.trigger('WCService:beforePage', [this]);
    };

    /**
     * Callback ran everytime a user changes page, paints template objects to UI, updates pager buttons, adds/shows markers
     * @param {array} serviceLocations
     * @method WC.ServiceLocationsView#_showPage
     * @private
     */
    fn._showPage = function (serviceLocations) {
        var content = '';
        var tplIsFunction = $.isFunction(this.options.tplLocation);
        for (var i = 0, s = serviceLocations.length, location; i < s; i++) {
            location = serviceLocations[i];
            try {
                var data = $.extend({}, this.options.pagerRecordsParams, location.toJSON());
                data = this.options.additionalDataHandler !== null ? this.options.additionalDataHandler(data) : data;
                if (tplIsFunction) {
                    content += this.options.tplLocation(data);
                } else {
                    content += $.WCTemplate(this.options.tplLocation, data);
                }
            } catch (e) {}
        }
        this.container.find(this.options.contentContainer).html(content);

        //update the paging buttons
        if (this.boundMethods.hasOwnProperty('first')) {
            this._updatePagerButtons();
        }

        //update the markers
        this.gmap.showMarker(serviceLocations);
        this.gmap.center(serviceLocations);
        this.container.trigger('WCService:onPage', [this]);

        //disable buttons
        $.each(['pageFirst', 'pageLast', 'pageNext', 'pageBack'], $.proxy(function (index, elem) {
            this.container.find(this.options[elem]).show();
        }, this));
    };

    /**
     * Callback performed everytime pager gets data from ajax. Used to perform preprocessing of data (conversion to objects)
     * @param {function} done Callback call this call back when done processing data
     * @param {json} data
     * @method WC.ServiceLocationsView#_handleData
     * @private
     */
    fn._handleData = function (done, data) {
        if (data.result === 'true') {
            if (this.pager.recs.totalPages === 0) {
                //update total pages
                this.pager.recs.total = data.data.total;
                this.pager.totalPages();
            }

            //create objects
            var locations = $.map(data.data.data, $.proxy(function (obj) {
                var location = new $.WCServiceLocation(obj);
                
                //decorate the location object with gmap
                this.gmap.setLatLng(location);
                this.gmap.createMarker(location);
                this.gmap.createMarkerEvents(location, this._markerMouseEnter, this._markerMouseLeave, this);
                
                return location;
            }, this));

            done(locations);
        } else {
            //show no data
            done([]);
        }
        this.container.trigger('WCService:onData', [data, this]);
    };

    /**
     * Callback Shows loading display
     * @method WC.ServiceLocationsView#_loading
     * @private
     */
    fn._loading = function () {
        if ($.isFunction(this.options.tplLoading)) {
            var html = this.options.tplLoading(this.options.pagerRecordsParams);
            if (html.length) {
                this.container.find(this.options.contentContainer).html(html);
            }
        } else if (this.options.tplLoading.length) {
            this.container.find(this.options.contentContainer).html(this.options.tplLoading);
        }

        this._updatePagerButtons({
            'first': false,
            'prev': false,
            'next': false,
            'last': false
        });

        this.container.trigger('WCService:onLoading', [this]);
    };

    /**
     * Callback Used when an ajax error occurred or empty array came back from the server, displays no data message
     * @method WC.ServiceLocationsView#_noData
     * @private
     */
    fn._noData = function () {
        if ($.isFunction(this.options.tplNoData)) {
            var html = this.options.tplNoData(this.options.pagerRecordsParams);
            this.container.find(this.options.contentContainer).html(html);
        } else {
            this.container.find(this.options.contentContainer).html(this.options.tplNoData);
        }
        this.container.find(this.options.mapContainer).hide();

        //disable buttons
        $.each(['pageFirst', 'pageLast', 'pageNext', 'pageBack'], $.proxy(function (index, elem) {
            this.container.find(this.options[elem]).hide();
        }, this));

        this.container.trigger('WCService:onNoData', [this]);
    };

    /**
     * Callback after first on page, this callback is only ran once used to setup the paging buttons
     * @method WC.ServiceLocationsView#_firstRun
     * @private
     */
    fn._firstRun = function () {
        //on first run create the listeners for the paging
        var container = this.container;
        if (!this.boundMethods.hasOwnProperty("first")) {
            this.boundMethods.first = [
                container.find(this.options.pageFirst),
                $.proxy(function (e) {
                    e.preventDefault();
                    console.log("FIRST PAGE CLICK");
                    this.first();
                }, this.pager)
            ];
        }
        if (!this.boundMethods.hasOwnProperty("last")) {
            this.boundMethods.last = [
                container.find(this.options.pageLast),
                $.proxy(function (e) {
                    e.preventDefault();
                    console.log("LAST PAGE CLICK");
                    this.last();
                }, this.pager)];
        }
        if (!this.boundMethods.hasOwnProperty("next")) {
            this.boundMethods.next = [
                container.find(this.options.pageNext),
                $.proxy(function (e) {
                    e.preventDefault();
                    console.log("NEXT PAGE CLICK");
                    this.next();
                }, this.pager)];
        }
        if (!this.boundMethods.hasOwnProperty("prev")) {
            this.boundMethods.prev = [
                container.find(this.options.pageBack),
                $.proxy(function (e) {
                    e.preventDefault();
                    console.log("PREVIOUS PAGE CLICK");
                    this.back();
                }, this.pager)];
        }

        $.each(['first', 'last', 'next', 'prev'], $.proxy(function (index, item) {
            //if button element still exists
            if (this.boundMethods[item][0].length) {
                //create listener
                this.boundMethods[item][0].on('click', this.boundMethods[item][1]).addClass(this.options.pageEnable);
            }
        }, this));

        this._updatePagerButtons();

        //create a global listener for mousein, mouseout if that data-agentCode tag is available
        if (container.find('[data-agentCode]').length) {
            container.on('mouseenter', '[data-agentCode]', $.proxy(this._onHover, this));
            container.on('mouseleave', '[data-agentCode]', $.proxy(this._onMouseLeave, this));
        }

        this.container.trigger('WCService:onFirstRun', [this]);
    };

    /**
     * Handles hover event for each record
     * @param event
     * @method WC.ServiceLocationsView#_onHover
     * @private
     */
    fn._onHover = function (event) {
        var target = $(event.target);
        if (!target.is('[data-id]')) {
            target = target.closest('[data-id]');
        }
        if (target.length) {
            var id = parseInt(target.data('id'), 10);
            var data = this.pager.getCurrentPageData();
            this.gmap.hideMarker(data);

            //find the one we have an id for and show it
            for (var i = 0, s = data.length, location; i < s; i++) {
                location = data[i];
                if (parseInt(location.get('id'), 10) === id) {
                    this.gmap.showMarker(location);
                }
            }
        }
    };

    /**
     * Handles mouse out event for each record
     * @method WC.ServiceLocationsView#_onMouseLeave
     * @private
     */
    fn._onMouseLeave = function () {
        var data = this.pager.getCurrentPageData();
        this.gmap.showMarker(data);
    };

    /**
     * Updates the pager buttons based on current page, optional param used to overwrite settings
     * @param [pagerControls]
     * @method WC.ServiceLocationsView#_updatePagerButtons
     * @private
     */
    fn._updatePagerButtons = function (pagerControls) {
        var controls = pagerControls || this.pager.pageControls();
        $.each(['first', 'last', 'next', 'prev'], $.proxy(function (index, item) {
            if (this.boundMethods.hasOwnProperty(item)) {
                this.boundMethods[item][0].removeClass(this.options.pageEnable + ' ' + this.options.pageDisable);
                this.boundMethods[item][0].off('click', this.boundMethods[item][1]).addClass(this.options.pageDisable);
                if (controls[item]) {
                    //enable
                    this.boundMethods[item][0].on('click', this.boundMethods[item][1]).addClass(this.options.pageEnable).removeClass(this.options.pageDisable);
                }
            }
        }, this));
    };
    /**
     * Adds active class to record
     * @param serviceLocation
     * @method WC.ServiceLocationsView#_markerMouseEnter
     * @private
     */
    fn._markerMouseEnter = function (serviceLocation) {
        this.container.find('[data-agentcode="' + serviceLocation.get('agent_code') + '"]').addClass(this.options.recordActive);
    };

    /**
     * Removes active from record
     * @param serviceLocation
     * @method WC.ServiceLocationsView#_markerMouseLeave
     * @private
     */
    fn._markerMouseLeave = function (serviceLocation) {
        this.container.find('[data-agentcode="' + serviceLocation.get('agent_code') + '"]').removeClass(this.options.recordActive);
    };

    /**
     * Returns the WC.ServiceLocation object pertaining to that ID, mainly used to grab special fields data
     * @param {Number} id ID of location
     * @returns {WC.ServiceLocation}
     * @method WC.ServiceLocationsView#getLocationById
     */
    fn.getLocationById = function (id) {
        id = parseInt(id, 10);
        var original = id;
        var rec = function (index, data) {
            if (data.get('id') === id) {
                id = data;
                return false;
            }
        };

        for (var i = 0, s = this.pager.recs.data.length; i < s; i++) {
            if (this.pager.recs.data[i]) {
                $.each(this.pager.recs.data[i], rec);
            }

            if (id !== original) {
                break;
            }
        }

        if (id === original) {
            return null;
        }

        return id;
    };

    /**
     * <p>Change the search results by reseting the data and changing the parameters. Automatically grabs first page of new set.</p>
     * @param {object} params Parameters that are going to overwrite params used by the pager
     * @method WC.ServiceLocationsView#changeSearchConditions
     */
    fn.changeSearchConditions = function (params) {
        //remove gmap markers first
        $.each(this.pager.recs.data, $.proxy(function (ignore, list) {
            if (list) {
                this.gmap.hideMarker(list);
            }
        }, this));

        //reset the pager
        this.pager.reset();

        //change the id of the product
        $.extend(this.pager.recs.params, params || {});
        this.pager.getData(0);
    };

    window.WC.ServiceLocationsView = ServiceLocationsView;

    /**
     * <p>The jQuery namespace, also known as the global `$` variable.</p>
     * <p>Visit the jQuery website for more information: {@link http://jquery.com/}</p>
     * @namespace jQuery
     */

    /**
     * Alias to jQuery's Global Namespace
     * @function WCServiceLocationsView
     * @param {object} options {@link WC.ServiceLocationsView}
     * @memberOf jQuery
     * @public
     **/
    $.WCServiceLocationsView = ServiceLocationsView;

    /**
     * Basic Object factory Helper
     * @param {object} options {@link WC.ServiceLocationsView}
     * @returns {@link WC.ServiceLocationsView}
     * @function WCServiceLocationsView.create
     * @memberOf jQuery
     * @public
     */
    $.WCServiceLocationsView.create = function (options) {
        var id = elemId($(options.container));
        var obj;
        //only instantiate once
        if (!ObjectCache.hasOwnProperty(id)) {
            obj = ObjectCache[id] = new ServiceLocationsView(options);
        } else {
            obj = ObjectCache[id];
        }
        return obj;
    };

    /**
     * jQuery plugin for the ServicesLocationView Class, no longer supported
     * @param {object|string} options {@link WC.ServiceLocationsView}
     *  <p>Additionally the following Strings are valid parameters</p>
     *  <ul>
     *  <li>'first' - Moves to first page</li>
     *  <li>'last' - Moves to last page</li>
     *  <li>'next' - Moves to next page</li>
     *  <li>'back' - Moves back a page</li>
     *  <li>'totalPages' - Returns total number of pages</li>
     *  <li>'getCurrentPageData' - returns an array containing the current page's data</li>
     *  <li>'currentPage' - returns the current page number</li>
     *  </ul>
     * @returns {jQuery}
     * @method fn.WCServiceLocationsView
     * @memberOf jQuery
     * @public
     * @deprecated
     */
    $.fn.WCServiceLocationsView = function (options) {
        var args = Array.prototype.slice.call(arguments, 1);
        var id = elemId($(this[0]));
        var ret;
        if (ObjectCache.hasOwnProperty(id)) {
            var obj = ObjectCache[id];

            switch (options) {
                case 'first':
                case 'last':
                case 'next':
                case 'back':
                    obj.pager[options].apply(obj.pager, args);
                    ret = obj;
                    break;
                case 'totalPages':
                case 'getCurrentPageData':
                    ret = obj.pager[options].apply(obj.pager, args);
                    break;
                case 'currentPage':
                    ret = obj.pager.getCurrentPage();
                    break;
                case 'page':
                    //only use the page command if an argument was given
                    if (args.length) {
                        obj.pager[options].apply(obj.pager, args);
                        ret = obj;
                    }
                    break;
                default:
                    ret = obj;
            }

            return ret;
        }
        return this.each(function () {
            //clone options
            var opts = jQuery.extend({}, options);
            opts.container = $(this);
            $.WCServiceLocationsView.create(opts);
        });
    };

})(this, this.jQuery, this.google);

this["WC"] = this["WC"] || {};
this["WC"]["locationsTPL"] = this["WC"]["locationsTPL"] || {};

this["WC"]["locationsTPL"]["tpl-location"] = Handlebars.template({"1":function(depth0,helpers,partials,data) {
    return "color:#a0a0a0";
},"3":function(depth0,helpers,partials,data) {
    var helper;

  return "            <div>"
    + this.escapeExpression(((helper = (helper = helpers.address2 || (depth0 != null ? depth0.address2 : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"address2","hash":{},"data":data}) : helper)))
    + "</div>\n";
},"5":function(depth0,helpers,partials,data) {
    var helper;

  return "            <div>Phone: "
    + this.escapeExpression(((helper = (helper = helpers.phone || (depth0 != null ? depth0.phone : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"phone","hash":{},"data":data}) : helper)))
    + "</div>\n";
},"7":function(depth0,helpers,partials,data) {
    return "            <span>Maximum send amount of "
    + this.escapeExpression((helpers.dollar || (depth0 && depth0.dollar) || helpers.helperMissing).call(depth0,(depth0 != null ? depth0.limit : depth0),{"name":"dollar","hash":{},"data":data}))
    + "</span>\n";
},"9":function(depth0,helpers,partials,data) {
    var helper;

  return "            <button type=\"button\" class=\"btn btn-primary btn-sm btn-location\" data-id=\""
    + this.escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"id","hash":{},"data":data}) : helper)))
    + "\" style=\"margin-top:15px;\">\n                Use this location\n            </button>\n";
},"11":function(depth0,helpers,partials,data) {
    var helper;

  return "            Distance: "
    + this.escapeExpression(((helper = (helper = helpers.distance || (depth0 != null ? depth0.distance : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"distance","hash":{},"data":data}) : helper)))
    + " Miles\n";
},"13":function(depth0,helpers,partials,data) {
    var helper;

  return "            <br/>\n            Hours: "
    + this.escapeExpression(((helper = (helper = helpers.hours_of_ops || (depth0 != null ? depth0.hours_of_ops : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"hours_of_ops","hash":{},"data":data}) : helper)))
    + "\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var stack1, helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return "<div class=\"row location-row\" data-id=\""
    + alias3(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"id","hash":{},"data":data}) : helper)))
    + "\"\n     style=\"border-bottom: 1px solid #ddd;padding-bottom:10px;"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.limitLessThanAmount : depth0),{"name":"if","hash":{},"fn":this.program(1, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "\">\n    <div class=\"col-md-12\">\n        <h4>"
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"name","hash":{},"data":data}) : helper)))
    + "</h4>\n    </div>\n    <div class=\"col-md-7\">\n        <div>"
    + alias3(((helper = (helper = helpers.address || (depth0 != null ? depth0.address : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"address","hash":{},"data":data}) : helper)))
    + "</div>\n\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.address2 : depth0),{"name":"if","hash":{},"fn":this.program(3, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "\n        "
    + alias3(((helper = (helper = helpers.cityState || (depth0 != null ? depth0.cityState : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"cityState","hash":{},"data":data}) : helper)))
    + "\n\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.phone : depth0),{"name":"if","hash":{},"fn":this.program(5, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.limitLessThanAmount : depth0),{"name":"if","hash":{},"fn":this.program(7, data, 0),"inverse":this.program(9, data, 0),"data":data})) != null ? stack1 : "")
    + "    </div>\n    <div class=\"col-md-5\">\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.distance : depth0),{"name":"if","hash":{},"fn":this.program(11, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.hours_of_ops : depth0),{"name":"if","hash":{},"fn":this.program(13, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "    </div>\n</div>";
},"useData":true});

this["WC"]["locationsTPL"]["tpl-main"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    return "<div class=\"row\">\n    <div class=\"col-md-12\">\n        <div class=\"maps-container\" style=\"height: 300px;width: 100%;border: 1px solid #808080\"></div>\n    </div>\n</div>\n\n<div class=\"row\" style=\"position: relative;\">\n    <div class=\"col-md-12 text-center navsection\">\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-first-page\">\n            <span class=\"glyphicon glyphicon-fast-backward\"></span>\n        </a>\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-page-back\">\n            <span class=\"glyphicon glyphicon-step-backward\"></span>\n        </a>\n\n        <span>Showing</span> <span class=\"locations-range\"></span>\n\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-page-next\">\n            <span class=\"glyphicon glyphicon-step-forward\"></span>\n        </a>\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-last-page\">\n            <span class=\"glyphicon glyphicon-fast-forward\"></span>\n        </a>\n    </div>\n\n\n    <div id=\"searchContainer\"\n         class=\"input-group col-md-3 input-group-sm\"\n         style=\"position: absolute; top: 5px; right: 15px;z-index: 999999\">\n        <input type=\"search\" class=\"form-control\" placeholder=\"Search Locations\"/>\n      <span class=\"input-group-btn\">\n        <button class=\"btn btn-default\" type=\"button\" style=\"background: #6ca7db\">Search</button>\n      </span>\n    </div>\n</div>\n\n<div class=\"row\">\n    <div class=\"col-md-12 locations-content\" style=\"position: relative\"></div>\n</div>\n\n<div class=\"row\">\n    <div class=\"col-md-12 text-center navsection\">\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-first-page\">\n            <span class=\"glyphicon glyphicon-fast-backward\"></span>\n        </a>\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-page-back\">\n            <span class=\"glyphicon glyphicon-step-backward\"></span>\n        </a>\n\n        <span>Showing</span> <span class=\"locations-range\"></span>\n\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-page-next\">\n            <span class=\"glyphicon glyphicon-step-forward\"></span>\n        </a>\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-last-page\">\n            <span class=\"glyphicon glyphicon-fast-forward\"></span>\n        </a>\n    </div>\n</div>";
},"useData":true});

//Needs: jQuery, Handlebars, Spinjs, and of course the service locations thing
define(function(require){
    'use strict';
    var angular = require('angular');
    var Spinner = require('spinner');
    var $ = require('jquery');

    angular.module('WC', [])

        .directive('serviceLocations', function () {

            return {
                restrict: 'E',
                replace: true,

                scope: {
                    //I'm guessing using two way binding somehow this is
                    //how you get the selected location object
                    location: '=',

                    //actual params sent to server one way binding right?
                    productId: '@',
                    currencyId: '@',
                    amount: '@',
                    keyword: '@',
                    raddress1: '@',
                    raddress2: '@',
                    rcity: '@',
                    rstate: '@',
                    rpostal: '@',
                    country: '@'
                },

                compile: function (element) {
                    //replace the element with a plain div
                    //not sure if this is even needed or not
                    var newElem = $('<div></div>');
                    element.replaceWith(newElem);

                    return function (scope, element) {

                        //actual variable containing the object
                        var locationsObj;

                        //location template this can be replaced with something else if the template is being
                        //acquired by other means
                        var locationTpl = WC.locationsTPL['tpl-location'];

                        var spinner = new Spinner({
                            lines: 10, // The number of lines to draw
                            length: 3, // The length of each line
                            width: 3, // The line thickness
                            radius: 10, // The radius of the inner circle
                            corners: 1, // Corner roundness (0..1)
                            rotate: 9, // The rotation offset
                            direction: 1, // 1: clockwise, -1: counterclockwise
                            color: '#000', // #rgb or #rrggbb or array of colors
                            speed: 1, // Rounds per second
                            trail: 43, // Afterglow percentage
                            shadow: false, // Whether to render a shadow
                            hwaccel: false, // Whether to use hardware acceleration
                            className: 'spinner', // The CSS class to assign to the spinner
                            zIndex: 2e9, // The z-index (defaults to 2000000000)
                            top: '50%', // Top position relative to parent
                            left: '50%' // Left position relative to parent
                        });

                        //callback when search is used
                        var locationSearch = function () {
                            var search = element.find('#searchContainer input').val();
                            if (search.length && locationsObj) {
                                locationsObj.changeSearchConditions({
                                    keyword: search
                                });
                            }
                        };

                        var params = {
                            productId: scope.productId,
                            currencyId: scope.currencyId,
                            amount: scope.amount,
                            keyword: scope.keyword,
                            raddress1: scope.raddress1,
                            raddress2: scope.raddress2,
                            rcity: scope.rcity,
                            rpostal: scope.rpostal,
                            country: scope.country
                        };

                        //set the right state parameter
                        if (scope.country === 'MX') {
                            params.states_carduser1 = scope.rstate;
                        } else if (scope.country === 'CA') {
                            params.states_carduser2 = scope.rstate;
                        }

                        //creates an overlay loading thing only in the
                        //container element itself
                        var overlayLoading = function (elem, text) {
                            var overlay = $("<div style='background: none repeat scroll 0 0 rgba(255, 255, 255, 0.5);height: 100%;position: absolute;top: 0;left:0;width: 100%;z-index: 1023123;'/>");

                            if (text && text.length) {
                                var temp = $('<h3/>').addClass('text-center').text(text);
                                overlay.append(temp);
                            }

                            if (elem && elem.append) {
                                elem.append(overlay);
                            } else {
                                element.find('.locations-content').append(overlay);
                            }
                        };

                        //Handles Initial loading view
                        element.one('WCService:onLoading', function () {
                            //hide the map container
                            element.find('.maps-container').hide();

                            //show overlay loading
                            overlayLoading(null, 'Loading locations');

                            //show the spinner
                            spinner.spin();
                            element.find('.locations-content').append(spinner.el);
                        });

                        //Handles Initial data view
                        element.one('WCService:onData', function (event, ajaxData) {
                            //handles a special case where there is only one location
                            //automatically select that location no point
                            //in showing just one
                            if (ajaxData.result === 'true' && ajaxData.data.total === 1) {
                                $('.locations-content, .navsection, #searchContainer').html('');

                                //AUTOMATICALLY SELECT SINGLE LOCATION
                                //Update the location used in the two way binding
                                //not even sure if this will work
                                scope.location = locationsObj.getLocationById(ajaxData.data.data[0].id);
                            } else {
                                $('.maps-container').show();
                                $('#locationContainer').trigger('resizemap');
                            }
                        });

                        //handles event when a page changes
                        element.on('WCService:onPage', function (e, obj) {
                            var curr = obj.pager.getCurrentPage() + 1;
                            var total = obj.pager.recs.totalPages;

                            //updates the display that shows what page of how many were in
                            element.find('.locations-range').html(curr + ' of ' + total + ' pages');
                        });

                        //handles enter key press event on the search box
                        element.on('keydown', '#searchContainer input', function (e) {
                            var key = e.which;
                            if (key === 13) {
                                locationSearch();
                            }
                        });

                        //handles the click event on the search button
                        element.on('click', '#searchContainer .btn', locationSearch);

                        //Handles the event when a location is selected
                        element.on('click', '.btn-location', function (e) {
                            e.preventDefault();
                            var button = $(e.target);
                            if (button.length) {

                                //Update the location used in the two way binding
                                //not even sure if this will work
                                scope.location = locationsObj.getLocationById(button.data('id'));
                            }
                        });

                        locationsObj = new $.WCServiceLocationsView({
                            //the container dom element for all this insanity
                            container: element,

                            //the main template this can be replaced if some other
                            //form of getting templates is being used
                            tplMain: WC.locationsTPL['tpl-main']({}),

                            //handles the view for each location
                            tplLocation: function (item) {
                                //show the search box
                                element.find('#searchContainer').show();

                                //trigger map resize to redraw it with the new location points
                                google.maps.event.trigger(locationsObj.gmap.map, 'resize');

                                //show the page forward / back nav
                                if (!element.find('.navsection').is(':visible')) {
                                    element.find('.navsection').show();
                                }

                                //distance is greater than 1000 or less than 0 miles dont show distance
                                var distance = parseInt(item.distance, 10);
                                if (distance > 1000 || distance < 0) {
                                    item = angular.extend({}, item, {distance: false});
                                }

                                //used for amount based filtering purposes
                                item.limitLessThanAmount = false;
                                if (item.limit !== 0
                                    && item.limit < scope.amount
                                    && (locationsObj.pager.recs.params.keyword && locationsObj.pager.recs.params.keyword.length)) {

                                    item.limitLessThanAmount = true;
                                }

                                //run the object through the template
                                return locationTpl(item);
                            },

                            //the template when its loading a new page currently its handled by
                            //the external event so we just need to clear the view
                            tplLoading: function () {
                                element.find('.navsection').hide();
                                element.find('searchContainer').hide();
                                return '';
                            },

                            //template when there is no data
                            tplNoData: '<div class="no-data">No data was found please try again</div>',

                            //these are selectors used in order to listen to click events on the nav bar
                            pageFirst: '.wc-first-page',
                            pageLast: '.wc-last-page',
                            pageNext: '.wc-page-next',
                            pageBack: '.wc-page-back',

                            //map container selector
                            mapContainer: '.maps-container',

                            //content container selector
                            contentContainer: '.locations-content',

                            //class used on the paging navigation arrows for enabled and disabled
                            pageEnable: 'enabled',
                            pageDisable: 'hidden',

                            //URL where to grab the service locations
                            pagerRecordsUrl: '/card/getServiceLocations.do',

                            //parameters to add on ajax requests
                            pagerRecordsParams: params,

                            //the google maps api code
                            mapsAPIKey: 'AIzaSyBloJAXNAVsY4hm8fAAnr4MHwcEGuPQV5A'
                        });

                    };
                }
            };
        });
})(this.angular, this.jQuery, this.WC);