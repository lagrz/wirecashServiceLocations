//Needs: jQuery, Handlebars, Spinjs, and of course the service locations thing
define(function(require){
  'use strict';

  var angular = require('angular'),
      Spinner = require('spinjs');

  // Module deps
  require('gmaps');
  var paginate = require('paginate');

  //module.service('Paginate', paginate);
  console.log('Paginate', paginate);

  angular.module('wcServiceLocations', ['gmaps', 'paginate'])

  .directive('serviceLocation', function() {
    return {
      restrict: 'E',
      templateUrl: 'templates/location.html',
      scope: {
        location: '='
      },
      link: function(scope, element, attrs) {
        console.log('location scope', scope);

      }
    }
  })

  .directive('serviceLocations', ['$http', 'Paginate', function($http, Paginate) {

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

        var pager = Paginate.init({
          url: 'fixtures/sample1.json',
          limit: 10,
          start: 0
        });

        scope.$watch('currentPage', function(newPage) {
          scope.locationsPageRange = newPage + ' of ' + scope.totalPages;
        });

        pager.fetch({}, function(data) {
          scope.locations = data;
          scope.currentPage = pager.currentPage;
          scope.totalPages = pager.totalPages;
        });

        scope.search = function() {
          pager.search(scope.searchTerm, function(data) {
            scope.locations = data;
            scope.currentPage = pager.currentPage;
          });
        };

        scope.nextPage = function() {
          pager.nextPage(function(data) {
            scope.locations = data;
            scope.currentPage = pager.currentPage;
          });
        };

        scope.prevPage = function() {
          pager.prevPage(function(data) {
            scope.locations = data;
            scope.currentPage = pager.currentPage;
          });
        };

        scope.firstPage = function() {
          pager.firstPage(function(data) {
            scope.locations = data;
            scope.currentPage = pager.currentPage;
          });
        }

        scope.lastPage = function() {
          pager.lastPage(function(data) {
            scope.locations = data;
            scope.currentPage = pager.currentPage;
          });
        }

        scope.mapOptions = {
          zoom: 8,
          center: {lat: -34.397, lng: 150.644}
        };
      }
    };
  }]);
});
