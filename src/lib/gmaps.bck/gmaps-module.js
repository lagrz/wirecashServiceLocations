define(function(){
  'use strict';

  var angular = require('angular'),
      gmaps = require(['./gmaps']);

  console.log('gmaps', gmaps()());

  angular.module('gmaps', [])

  .directive('gmap', function() {
    return {
      restrict: 'E',
      scope: {
        options: '='
      },

      link: function(scope, element, attrs) {

        setTimeout(function() {
          console.log('scope', scope);
          console.log('element', element);
          var map = new gmaps({
              key: scope.options.key
          }, {
            container: element[0]
          });

        }, 15);
      }
    };
  })
});
