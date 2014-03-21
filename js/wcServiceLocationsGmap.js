(function (window, $, google) {
    'use strict';

    //tplMain MUST CONTAIN ELEMENTS WITH these CLASSES:
    //      - wc-first-page, wc-last-page, wc-page-next, wc-page-back
    //      - wc-map-container
    //      - wc-content-container

    var ServiceLocationsView = function (options) {
        this.options = $.extend({
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
            pageDisable: 'wc-disable'
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

    ServiceLocationsView.fn._beforePage = function (locations) {
        this.gmap.hideMarker(locations);
    };

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
    };

    ServiceLocationsView.fn._handleData = function (done, data) {
        if (data.result) {
            //create objects
            var locations = $.map(data.data, $.proxy(function (obj) {
                var location = new $.WCServiceLocation(obj);
                this.gmap.setLatLng(location);
                this.gmap.createMarker(location);
                return location;
            }, this));
            done(locations);
        } else {
            //show no data
            done([]);
        }
    };

    ServiceLocationsView.fn._loading = function () {
        console.log('loading');
        this.container.find(this.options.contentContainer).html(this.options.tplLoading);
    };

    ServiceLocationsView.fn._noData = function () {
        console.log('no data found');
        this.container.find(this.options.contentContainer).html(this.options.tplNoData);
        this.container.find(this.options.mapContainer).hide();
        $.each(['pageFirst', 'pageLast', 'pageNext', 'pageBack'], $.proxy(function (index, elem) {
            this.container.find(this.options[elem]).hide();
        }, this));
    };

    ServiceLocationsView.fn._firstRun = function () {
        //on first run create the listeners for the paging
        var container = this.container;
        this.boundMethods.first = [container.find(this.options.pageFirst), $.proxy(this.pager.first, this.pager)];
        this.boundMethods.last = [container.find(this.options.pageLast), $.proxy(this.pager.last, this.pager)];
        this.boundMethods.next = [container.find(this.options.pageNext), $.proxy(this.pager.next, this.pager)];
        this.boundMethods.prev = [container.find(this.options.pageBack), $.proxy(this.pager.back, this.pager)];

        $.each(['first', 'last', 'next', 'prev'], $.proxy(function (index,item) {
            if (this.boundMethods[item][0].length) {
                this.boundMethods[item][0].on('click', this.boundMethods[item][1]).addClass(this.options.pageEnable);
            }
        }, this));

        this._updatePagerButtons();
    };

    ServiceLocationsView.fn._updatePagerButtons = function () {
        var controls = this.pager.pageControls();
        $.each(['first', 'last', 'next', 'prev'], $.proxy(function (index,item) {
            this.boundMethods[item][0].removeClass(this.options.pageEnable + ' ' + this.options.pageDisable);
            if (controls[item]) {
                //enable
                this.boundMethods[item][0].on('click', this.boundMethods[item][1]).addClass(this.options.pageEnable);
            } else {
                //disable
                this.boundMethods[item][0].off('click', this.boundMethods[item][1]).addClass(this.options.pageDisable);
            }
        }, this));
    };

    $.WCServiceLocationsView = ServiceLocationsView;

})(this, this.jQuery, this.google);