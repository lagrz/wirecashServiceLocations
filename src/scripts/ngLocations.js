//Needs: jQuery, Handlebars, Spinjs, and of course the service locations thing
define(function(require){
  'use strict';

  var angular = require('angular'),
      Spinner = require('spinjs'),
      gmaps = require('gmaps');

  angular.module('wcServiceLocations', [])

  .directive('serviceLocations', function () {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/locations.html',

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

      link: function(scope, element, attrs) {
        var map = new gmaps({
          key: 'AIzaSyBloJAXNAVsY4hm8fAAnr4MHwcEGuPQV5A'
        },{
          container: element.find(".maps-container")[0]
        });
      }
    };
  });
});
