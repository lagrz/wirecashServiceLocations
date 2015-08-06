require.config({
  baseUrl: 'scripts',

  paths: {
    'angular': '../lib/bower/angular/angular',
    'spinjs': '../lib/bower/spinjs/spin'
  },

  shim: {
    'angular': {
      exports: 'angular'
    }
  }
});

// bootstrap
require(['bootstrap']);
