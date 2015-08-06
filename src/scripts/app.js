define(function(require){
  'use strict';

  var angular = require('angular');
  require('ngLocations');

  var appName = 'wcServiceLocationApp';

  var app = angular.module('wcServiceLocationApp', ['wcServiceLocations']);

  return app;
});
