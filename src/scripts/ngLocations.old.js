//Needs: jQuery, Handlebars, Spinjs, and of course the service locations thing
define(function(require){
    'use strict';

    var angular = require('angular'),
        Spinner = require('spinjs');

    angular.module('wcServiceLocations', [])

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
});
