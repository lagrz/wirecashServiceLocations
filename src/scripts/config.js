require.config({
  baseUrl: 'scripts',

  paths: {
    'angular': '../lib/bower/angular/angular',
    'async': '../lib/bower/requirejs-plugins/src/async',
    'spinjs': '../lib/bower/spinjs/spin',
    'jquery': '../lib/bower/jquery/dist/jquery',
    'google-maps': '../lib/gmaps/google-maps',
    'gmaps': '../lib/gmaps/gmaps',
    'paginate': '../lib/paginate/paginate'
  },

  shim: {
    'angular': {
      exports: 'angular'
    },
    'gmaps': ['angular', 'jquery', 'google-maps'],
    'paginate': ['angular']
  }
});

// bootstrap
require(['bootstrap']);
