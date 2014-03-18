/*globals asyncTest,deepEqual,equal,expect,module,notDeepEqual,notEqual,notStrictEqual,ok,QUnit,raises,start,stop,strictEqual,test */
var config;

module('Test the google maps api loader', {
    setup: function () {
        stop();
        $.get('../config/maps_api.json').done(function (data) {
            config = data;
            start();
        });
    }
});

test('Correctly builds global callback', function () {
    expect(1);
    var cb = jQuery.WCServiceListGmap.loader.buildGlobalCallback(config);
    ok(window[cb], 'Global callback exist');
});

test('Correctly builds url for maps api', function () {
    expect(3);

    config = {
        key: 'test',
        sensor: '123'
    };
    var cb = jQuery.WCServiceListGmap.loader.buildGlobalCallback(config);
    var url = jQuery.WCServiceListGmap.loader.buildUrl(cb, config);

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
        jQuery.WCServiceListGmap.loader.init($.extend({}, data, {
            gmapsLoaded: function () {
                ok(window.google, 'Google is now loaded');
                start();
            }
        }));

    });
});

module('Test the tiny template engine');

test('Render the template using a simple object', function () {
    expect(1);

    var tpl = 'hello {name} i am a {job}';
    var obj = {
        'name': 'john candy',
        'job': 'developer'
    };

    var output = $.template(tpl, obj);
    equal(output, 'hello john candy i am a developer', 'should match');
});