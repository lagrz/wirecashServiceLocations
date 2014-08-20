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

        this.ajaxCallajaxCall = null;

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

    fn.ajaxDoneLoading = function () {
        return this.ajaxCall === null || this.ajaxCall.readyState === 4;
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