require.config({
  baseUrl: 'scripts',

  paths: {
    'angular': '../lib/bower/angular/angular',
    'spinjs': '../lib/bower/spinjs/spin',
    'jquery': '../lib/bower/jquery/dist/jquery'
  },

  shim: {
    'angular': {
      exports: 'angular'
    }
  }
});

// bootstrap
require(['bootstrap']);
