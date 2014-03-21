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

    ServiceLocationsView.fn = ServiceLocationsView.prototype;

    /**
     * Instantiates our pager object with various callback settings ran after we have google object in the global scope
     */
    ServiceLocationsView.fn.init = function () {
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
    ServiceLocationsView.fn._beforePage = function (serviceLocations) {
        this.gmap.hideMarker(serviceLocations);
        this.container.trigger('WCService:beforePage');
    };

    /**
     * Callback ran everytime a user changes page, paints template objects to UI, updates pager buttons, adds/shows markers
     * @param serviceLocations
     * @private
     */
    ServiceLocationsView.fn._showPage = function (serviceLocations) {
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
    ServiceLocationsView.fn._handleData = function (done, data) {
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
    ServiceLocationsView.fn._loading = function () {
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
    ServiceLocationsView.fn._noData = function () {
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
    ServiceLocationsView.fn._firstRun = function () {
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
    ServiceLocationsView.fn._onHover = function (event) {
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
    ServiceLocationsView.fn._onMouseLeave = function () {
        var data = this.pager.getCurrentPageData();
        this.gmap.showMarker(data);
    };

    /**
     * Updates the pager buttons based on current page, optional param used to overwrite settings
     * @param [pagerControls]
     * @private
     */
    ServiceLocationsView.fn._updatePagerButtons = function (pagerControls) {
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
    ServiceLocationsView.fn._markerMouseEnter = function (serviceLocation) {
        this.container.find('[data-agentcode="' + serviceLocation.get('agentCode') + '"]').addClass(this.options.recordActive);
    };

    /**
     * Removes active from record
     * @param serviceLocation
     * @private
     */
    ServiceLocationsView.fn._markerMouseLeave = function (serviceLocation) {
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