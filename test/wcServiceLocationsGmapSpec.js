/*globals asyncTest,deepEqual,equal,expect,module,notDeepEqual,notEqual,notStrictEqual,ok,QUnit,raises,start,stop,strictEqual,test,$,sinon,console */

//timeout after a minute
QUnit.config.testTimeout = 60000;

//run the test in the order found here
QUnit.config.reorder = false;

var config = false;

//-- MAPS LOADER
module('Test the google maps api loader', {
    setup: function () {
        stop();
        if (!config) {
            $.get('../config/maps_api.json').done(function (data) {
                config = data;
                start();
            });
        } else {
            start();
        }
    }
});

test('Correctly builds global callback', function () {
    expect(1);
    var cb = $.WCGmapsAPILoader.buildGlobalCallback(config);
    ok(window[cb], 'Global callback exist');
});

test('Correctly builds url for maps api', function () {
    expect(3);

    var cb = $.WCGmapsAPILoader.buildGlobalCallback(config);
    var url = $.WCGmapsAPILoader.buildUrl(cb, config);

    notEqual(url.indexOf('https://maps.googleapis.com/maps/api/js?'), -1, 'Contains base url');
    notEqual(url.indexOf('key=' + config.key), -1, 'Contains key');
    notEqual(url.indexOf('sensor=' + config.sensor), -1, 'Contains key');
});

asyncTest('Loads google maps api dynamically with callback', function () {
    'ust strict';
    expect(2);

    strictEqual(window.google, undefined, 'No maps api is currently loaded');

    //load the config first
    $.get('../config/maps_api.json').done(function (data) {

        //load the gmap api
        $.WCGmapsAPILoader.init($.extend({}, data, {
            gmapsLoaded: function () {
                ok(window.google, 'Google is now loaded');
                start();
            }
        }));

    });
});


//-- TINY TEMPLATE SYSTEM
module('Test the tiny template engine');

test('Render the template using a simple object', function () {
    expect(1);

    var tpl = 'hello {name} i am a {job}';
    var obj = {
        'name': 'john candy',
        'job': 'developer'
    };

    var output = $.WCTemplate(tpl, obj);
    equal(output, 'hello john candy i am a developer', 'should match');
});


//-- PAGINATOR
module('Test paginator engine', {
    setup: function () {
        this.requestObject = function (req) {
            var obj = {};
            $.each(req.requestBody.split('&'), function (i, val) {
                val = val.split('=');
                obj[val[0]] = val[1];
            });
            return obj;
        };

        this.fakeServer = sinon.fakeServer.create();

        this.fakeServer.respondWith('POST', 'data.json', $.proxy(function (req) {
            var body = this.requestObject(req);
            var range = [];
            for (var i = Number(body.start); i <= body.end; i++) {
                range.push(i);
            }
            req.respond(200, { "Content-Type": "application/json" }, JSON.stringify(range));
        }, this));

        this.fakeServer.autoRespond = true;
    },
    teardown: function () {
        //remove stub
        this.fakeServer.restore();
        this.fakeServer = null;
    }
});

test('Throws error if no url is provided', function () {
    throws(new $.WCPaginator(), 'Throws generic Error if no url is specified');
});

test('Calculates the total number of pages base on total and show per page count', function () {
    expect(2);

    var pager = new $.WCPaginator({
        show: 1,
        total: 10,
        url: 'data.json'
    });

    var pager2 = new $.WCPaginator({
        show: 2,
        total: 10,
        url: 'data.json'
    });

    equal(pager.totalPages(), 10, 'should have 10 pages');
    equal(pager2.totalPages(), 5, 'should have 5 pages');
});

test('Calculates page ranges correctly', function () {
    expect(9);

    var pager = new $.WCPaginator({
        show: 5,
        total: 18,
        url: 'data.json'
    });

    var firstPage = pager.calculateRange(0);
    var secondPage = pager.calculateRange(1);
    var thirdPage = pager.calculateRange(2);
    var fourthPage = pager.calculateRange(3);

    equal(pager.totalPages(), 4, 'Should calculate a total of 4 pages');

    equal(firstPage.start, 0, 'First page starts at 0');
    equal(firstPage.end, 4, 'First page end at 4');

    equal(secondPage.start, 5, 'Second page starts at 5');
    equal(secondPage.end, 9, 'Second page end at 9');

    equal(thirdPage.start, 10, 'Third page starts at 10');
    equal(thirdPage.end, 14, 'Third page end at 14');

    equal(fourthPage.start, 15, 'Fourth page starts at 15');
    equal(fourthPage.end, 17, 'Fourth page end at 17');
});

asyncTest('Grabs the first page of data by default', function () {
    expect(2);

    new $.WCPaginator({
        url: 'data.json',
        show: 5,
        total: 10,
        onAjaxSuccess: function (done, data) {
            done(data);
        },
        onPage: function (data) {
            equal(data[0], '0', 'Start is 0');
            equal(data[data.length - 1], '4', 'Stop is 4');
            start();
        },
        onAjaxError: function () {
            ok(false);
            ok(false);
            start();
        }
    });

    this.fakeServer.respond();
});

asyncTest('Uses cache for subsequent calls to same page', function () {
    expect(1);

    var callback = sinon.spy();

    new $.WCPaginator({
        url: 'data.json',
        show: 5,
        total: 10,
        onAjaxSuccess: function (done, data) {
            done(data);
        },
        onAjaxError: function () {
            ok(false);
            start();
        },
        onPage: $.proxy(function (data, pager) {
            callback();
            if (callback.callCount === 2) {
                equal(this.fakeServer.requests.length, 1, 'Only one ajax call should have occurred');
                start();
            } else {
                pager.first();
            }
        }, this)
    });

    this.fakeServer.respond();
});

asyncTest('Gets last page', function () {
    expect(3);

    var pager = new $.WCPaginator({
        url: 'data.json',
        show: 5,
        onAjaxSuccess: $.proxy(function (done, data) {
            var split = this.requestObject(this.fakeServer.requests[0]);
            equal(split.start, '10', 'Start is 10');
            equal(split.end, '14', 'Stop is 14');
            done(data);
        }, this),
        onAjaxError: function () {
            ok(false);
            ok(false);
        },
        onAjaxComplete: function () {
            start();
        }
    });

    pager.recs.total = 15;
    equal(pager.totalPages(), 3, 'Should have 3 pages total');
    pager.last();
    this.fakeServer.respond();
});

asyncTest('Goes backward correctly', function () {
    expect(11);
    var request = 0;

    var incrementAndGoBack = $.proxy(function (pager) {
        try {
            request++;
            pager.back();
            this.fakeServer.respond();
        } catch (e) {
            console.log(e);
        }
    }, this);

    var last = function (arr) {
        return arr[arr.length - 1];
    };

    new $.WCPaginator({
        url: 'data.json',
        show: 5,
        total: 17,
        onAjaxSuccess: $.proxy(function (done, data) {
            done(data);
        }, this),
        onAjaxError: function () {
            ok(false, 'It failed somewhere');
        },
        onPage: $.proxy(function (data, pager) {
            switch (request) {
                case 0:
                    equal(data[0], 0, 'should do initial request start at 0');
                    equal(last(data), 4, 'should do initial request end at 4');
                    request++;
                    pager.last();
                    this.fakeServer.respond();
                    break;

                case 1:
                    equal(data[0], 15, 'should call for last item start at 15');
                    equal(last(data), 16, 'should call for last item end at 16');
                    incrementAndGoBack(pager);
                    break;

                case 2:
                    equal(data[0], 10, 'should move to second to last page start at 10');
                    equal(last(data), 14, 'should move to second to last page end at 14');
                    incrementAndGoBack(pager);
                    break;

                case 3:
                    equal(data[0], 5, 'should move to second page starting at 5');
                    equal(last(data), 9, 'should move to second page ending at 9');
                    incrementAndGoBack(pager);
                    break;

                case 4:
                    equal(data[0], 0, 'Gets page 1 from cache start at 0');
                    equal(last(data), 4, 'Gets page 1 from cache ending at 4');
                    equal(this.fakeServer.requests.length, 4, 'It should have used cache for this call');
                    start();
                    break;
            }
        }, this)
    });

    this.fakeServer.respond();
});


//-- SERVICES LOCATION
module('Test services locations');

test('Builds a basic UI');

test('Handles paginator page clicking events');

test('Disables first page and back btn if on first page');

test('Disables back and last btn if on last page');

test('Adds markers to map');

test('Hides markers no longer in page');

test('jQuery Plugin api');

test('Ensure it removes all listeners upon deletion');