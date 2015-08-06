//Needs: jQuery, Handlebars, Spinjs, and of course the service locations thing
define(function(require){
  'use strict';

  var angular = require('angular');
  var Spinner = require('spinjs');

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

      }
    };
  });
});
