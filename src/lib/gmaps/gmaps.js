define(function(){
  'use strict';

  var angular = require('angular'),
      googleMaps = require('google-maps');

  console.log('gmaps', googleMaps);

  angular.module('gmaps', [])

  .directive('gmap', function() {
    return {
      restrict: 'A',
      scope: {
        options: '='
      },

      link: function(scope, element, attrs) {

        setTimeout(function() {
          var map = new googleMaps.Map(element[0], scope.options);
        }, 15);
      }
    };
  })
});
