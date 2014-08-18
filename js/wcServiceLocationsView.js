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
     * @param {string} options.tplMain
     * <p>The main container template, can be either string or a valid html / jQuery element.</p>
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
     * @param {string} options.tplLocation
     * <p>The template that generates each location record, must be a string</p>
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
     * @param {array} serviceLocations
     * @method WC.ServiceLocationsView#_beforePage
     * @private
     */
    fn._beforePage = function (serviceLocations) {
        this.gmap.hideMarker(serviceLocations);
        this.container.trigger('WCService:beforePage');
    };

    /**
     * Callback ran everytime a user changes page, paints template objects to UI, updates pager buttons, adds/shows markers
     * @param {array} serviceLocations
     * @method WC.ServiceLocationsView#_showPage
     * @private
     */
    fn._showPage = function (serviceLocations) {
        var content = '';
        for (var i = 0, s = serviceLocations.length, location; i < s; i++) {
            location = serviceLocations[i];
            try {
                content += $.WCTemplate(this.options.tplLocation, location.toJSON());
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
        this.container.trigger('WCService:onPage');
    };

    /**
     * Callback performed everytime pager gets data from ajax. Used to perform preprocessing of data (conversion to objects)
     * @param {function} done Callback call this call back when done processing data
     * @param {json} data
     * @method WC.ServiceLocationsView#_handleData
     * @private
     */
    fn._handleData = function (done, data) {
        if (data.result === "true") {
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
        this.container.trigger('WCService:onData', data);
    };

    /**
     * Callback Shows loading display
     * @method WC.ServiceLocationsView#_loading
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
     * @method WC.ServiceLocationsView#_noData
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
     * @method WC.ServiceLocationsView#_firstRun
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
     * @method WC.ServiceLocationsView#_onHover
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

    fn.getLocationById = function (id) {
        id = parseInt(id, 10);
        var original = id;

        for (var i = 0, s = this.pager.recs.data.length; i < s; i++) {
            $.each(this.pager.recs.data[i], function (index, data) {
                if(data.get('id') === id){
                    id = data;
                    return false;
                }
            });

            if(id !== original){
                break;
            }
        }

        if(id === original){
            return null;
        }
        return id;
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
     * jQuery plugin for the ServicesLocationView Class
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