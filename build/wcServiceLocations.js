(function (window, $) {
    'use strict';

    function template(tpl, d) {
        for (var p in d) {
            //ensure no prototype keys are used
            if (d.hasOwnProperty.call(d, p)) {
                tpl = tpl.replace(new RegExp('{' + p + '}', 'g'), d[p]);
            }
        }
        return tpl;
    }

    $.WCTemplate = template;

})(this, this.jQuery);

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

    var fn = GMaps.fn = GMaps.prototype;

    /**
     * Ensures given object is an array by checking or placing it in one
     * @param obj
     * @returns {*}
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
     * @param serviceLocation An object containing lat lng keys or an array containing the various address sections
     * @param callback Argument given to callback is either false if failed or an object with latlng key and normalized address key
     */
    fn.geoCodeAddress = function (serviceLocation, callback) {
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
    fn.setLatLng = function (serviceLocation) {
        if (serviceLocation.get('lat') !== 0) {
            var latlnt = new google.maps.LatLng(serviceLocation.get('lat'), serviceLocation.get('lng'));
            serviceLocation.set('gmapLatLng', latlnt);
        }
    };

    /**
     * Creates the google maps marker
     * @param serviceLocation
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
     * @param serviceLocation
     * @param callbackOver
     * @param callbackOut
     * @param context
     */
    fn.createMarkerEvents = function (serviceLocation, callbackOver, callbackOut, context) {
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
    fn._toggleMarker = function (serviceLocation, map) {
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
    fn.showMarker = function (serviceLocation) {
        this._toggleMarker(serviceLocation, this.map);
    };

    /**
     * Hides a marker
     * @param serviceLocation
     */
    fn.hideMarker = function (serviceLocation) {
        this._toggleMarker(serviceLocation);
    };

    /**
     * Centers the viewport of the map based on the provided servicelocation(s)
     * @param serviceLocation
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

    $.WCGmaps = GMaps;
})(this, this.jQuery);

(function (win, $) {
    'use strict';

    /**
     * Paginator class
     * @type {WCPaginator}
     */
    var Pager = $.WCPaginator = function (opts) {
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

        //run on create callback with object as parameter
        this.recs.onCreate(this);

        this.ajaxSuccessCallback = $.proxy(this.ajaxSuccess, this);

        if (this.recs.data.length !== 0 || this.recs.total !== 0) {
            this.totalPages();
            this.getData(0);
        }
    };

    var fn = Pager.fn = Pager.prototype;

    /**
     * Returns the current page
     * @returns {number|$.WCPaginator.recs.currPage}
     */
    fn.getCurrentPage = function(){
        return this.recs.currPage;
    };

    /**
     * Returns an array containing the data for the current page
     * @returns {*}
     */
    fn.getCurrentPageData = function(){
        return this.recs.data[this.recs.currPage];
    };

    /**
     * Calculates the total number of pages
     * @returns {number|$.WCPaginator.recs.totalPages}
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

        return {
            start: s < 0 ? 0 : s,
            end: e > this.recs.total ? this.recs.total - 1 : e
        };
    };

    /**
     * Performs a callback before calling on page callback
     */
    fn.beforePaging = function(){
        if(this.recs.data[this.recs.currPage]){
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
            $.ajax(this.recs.url, {
                data: this.recs.params,
                type: 'POST',
                beforeSend: this.recs.onLoadingData,
                error: this.recs.onAjaxError,
                complete: this.recs.onAjaxComplete,
                success: function () {
                    var args = Array.prototype.slice.call(arguments, 0);
                    //prepend our callback
                    if(self.recs.onAjaxSuccess !== $.noop){
                        args.unshift(self.ajaxSuccessCallback);
                        self.recs.onAjaxSuccess.apply(null, args);
                    }else{
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
    fn.page = function(pageNo){
        this.beforePaging();
        if(pageNo < this.recs.totalPages && pageNo >= 0){
            this.recs.currPage = pageNo;
            this.getData(pageNo);
        }
        return this;
    };

})(this, this.jQuery);

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

    $.WCServiceLocation = WCServiceLocation;
})(this, this.jQuery, this.google);

(function (window, $, google) {
    'use strict';

    var elemIdCounter = 0;
    var ObjectCache = {};

    /**
     * Grabs the element id and returns it otherwise it will identify it
     * @param $elem
     * @returns {*}
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

    //tplMain MUST CONTAIN ELEMENTS WITH these CLASSES:
    //      - wc-first-page, wc-last-page, wc-page-next, wc-page-back
    //      - wc-map-container
    //      - wc-content-container

    /**
     * Main Class for the Services Locations widget
     * @param options
     * @constructor
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

    var fn = ServiceLocationsView.fn = ServiceLocationsView.prototype;

    /**
     * Instantiates our pager object with various callback settings ran after we have google object in the global scope
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
            onCreate: $.proxy(function () {
                //insert base html to container
                this.container.html(this.options.tplMain);

                //create the google map obj
                this.gmap = new $.WCGmaps({
                    container: this.container.find(this.options.mapContainer)
                });

                this.container.trigger('WCService:create');
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
    };

    /**
     * Callback ran before running a page, used to hide the current markers
     * @param serviceLocations
     * @private
     */
    fn._beforePage = function (serviceLocations) {
        this.gmap.hideMarker(serviceLocations);
        this.container.trigger('WCService:beforePage');
    };

    /**
     * Callback ran everytime a user changes page, paints template objects to UI, updates pager buttons, adds/shows markers
     * @param serviceLocations
     * @private
     */
    fn._showPage = function (serviceLocations) {
        var content = '';
        for (var i = 0, s = serviceLocations.length, location; i < s; i++) {
            location = serviceLocations[i];
            content += $.WCTemplate(this.options.tplLocation, location.toJSON());
        }
        this.container.find(this.options.contentContainer).html(content);

        //update the paging buttons
        if (this.boundMethods.hasOwnProperty('first')) {
            this._updatePagerButtons();
        }

        //update the markers
        this.gmap.showMarker(serviceLocations);
        this.gmap.center(serviceLocations);
        this.container.trigger('WCService:onPage');
    };

    /**
     * Callback performed everytime pager gets data from ajax. Used to perform preprocessing of data (conversion to objects)
     * @param done Callback call this call back when done processing data
     * @param data
     * @private
     */
    fn._handleData = function (done, data) {
        if (data.result) {
            //create objects
            var locations = $.map(data.data, $.proxy(function (obj) {
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
        this.container.trigger('WCService:onData', data);
    };

    /**
     * Callback Shows loading display
     * @private
     */
    fn._loading = function () {
        this.container.find(this.options.contentContainer).html(this.options.tplLoading);
        this._updatePagerButtons({
            'first': false,
            'prev': false,
            'next': false,
            'last': false
        });
        this.container.trigger('WCService:onLoading');
    };

    /**
     * Callback Used when an ajax error occurred or empty array came back from the server, displays no data message
     * @private
     */
    fn._noData = function () {
        this.container.find(this.options.contentContainer).html(this.options.tplNoData);
        this.container.find(this.options.mapContainer).hide();
        $.each(['pageFirst', 'pageLast', 'pageNext', 'pageBack'], $.proxy(function (index, elem) {
            this.container.find(this.options[elem]).hide();
        }, this));
        this.container.trigger('WCService:onNoData');
    };

    /**
     * Callback after first on page, this callback is only ran once used to setup the paging buttons
     * @private
     */
    fn._firstRun = function () {
        //on first run create the listeners for the paging
        var container = this.container;
        this.boundMethods.first = [container.find(this.options.pageFirst), $.proxy(this.pager.first, this.pager)];
        this.boundMethods.last = [container.find(this.options.pageLast), $.proxy(this.pager.last, this.pager)];
        this.boundMethods.next = [container.find(this.options.pageNext), $.proxy(this.pager.next, this.pager)];
        this.boundMethods.prev = [container.find(this.options.pageBack), $.proxy(this.pager.back, this.pager)];

        $.each(['first', 'last', 'next', 'prev'], $.proxy(function (index, item) {
            if (this.boundMethods[item][0].length) {
                this.boundMethods[item][0].on('click', this.boundMethods[item][1]).addClass(this.options.pageEnable);
            }
        }, this));

        this._updatePagerButtons();

        //create a global listener for mousein, mouseout if that data-agentCode tag is available
        if (container.find('[data-agentCode]').length) {
            container.on('mouseenter', '[data-agentCode]', $.proxy(this._onHover, this));
            container.on('mouseleave', '[data-agentCode]', $.proxy(this._onMouseLeave, this));
        }

        this.container.trigger('WCService:onFirstRun');
    };

    /**
     * Handles hover event for each record
     * @param event
     * @private
     */
    fn._onHover = function (event) {
        var target = $(event.target);
        if (!target.is('[data-agentcode]')) {
            target = target.parents('[data-agentcode]');
        }
        if (target.length) {
            var id = target.data('agentcode') + '';
            var data = this.pager.getCurrentPageData();
            this.gmap.hideMarker(data);
            //find the one we have an id for and show it
            for (var i = 0, s = data.length, location; i < s; i++) {
                location = data[i];
                if (location.get('agentCode') === id) {
                    this.gmap.showMarker(location);
                }
            }
        }
    };

    /**
     * Handles mouse out event for each record
     * @private
     */
    fn._onMouseLeave = function () {
        var data = this.pager.getCurrentPageData();
        this.gmap.showMarker(data);
    };

    /**
     * Updates the pager buttons based on current page, optional param used to overwrite settings
     * @param [pagerControls]
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
     * @private
     */
    fn._markerMouseEnter = function (serviceLocation) {
        this.container.find('[data-agentcode="' + serviceLocation.get('agentCode') + '"]').addClass(this.options.recordActive);
    };

    /**
     * Removes active from record
     * @param serviceLocation
     * @private
     */
    fn._markerMouseLeave = function (serviceLocation) {
        this.container.find('[data-agentcode="' + serviceLocation.get('agentCode') + '"]').removeClass(this.options.recordActive);
    };

    $.WCServiceLocationsView = ServiceLocationsView;

    /**
     * Basic Object factory
     * @param options
     */
    $.WCServiceLocationsView.create = function(options){
        var id = elemId($(options.container));
        //only instantiate once
        if(!ObjectCache.hasOwnProperty(id)){
            ObjectCache[id] = new ServiceLocationsView(options);
        }
    };

    /**
     * jQuery plugin for the ServicesLocationView Class
     * @param options
     * @returns {*}
     * @constructor
     */
    $.fn.WCServiceLocationsView = function (options) {
        var args = Array.prototype.slice.call(arguments, 1);
        var id = elemId($(this[0]));
        var ret;
        if(ObjectCache.hasOwnProperty(id)){
            var obj = ObjectCache[id];

            switch(options){
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
                default:
                    ret = obj;
            }

            return ret;
        }
        return this.each(function(){
            //clone options
            var opts = jQuery.extend({}, options);
            opts.container = $(this);
            $.WCServiceLocationsView.create(opts);
        });
    };

})(this, this.jQuery, this.google);