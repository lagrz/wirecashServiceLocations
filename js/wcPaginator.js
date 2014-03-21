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