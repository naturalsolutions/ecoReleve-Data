require.config({
  baseUrl: 'app',
  paths: {

    'tmp': './tmp',

    'app': 'app',
    'config': 'config',
    'router': 'router',
    'controller': 'controller',
    'models': './models',
    'collections': './collections',
    'templates': '../build/templates',
    'objects' : './modules/objects',
    'lyt-rootview': './base/rootview/lyt-rootview',
    'transition-region': './base/transition-region/transition-region',
    'googleLoaer': './vendors/google-maps-loader',
    'translater': 'translater',

    /*==========  NS modules  ==========*/
    'ns_modules': 'ns_modules',
    'ns_filter': 'ns_modules/ns_filter',
    'ns_form': 'ns_modules/ns_form',
    'ns_grid': 'ns_modules/ns_grid',
    'ns_map': 'ns_modules/ns_map',
    'ns_stepper': 'ns_modules/ns_stepper',
    'ns_navbar': 'ns_modules/ns_navbar',

    /*==========  Bower  ==========*/
    'jquery': '../bower_components/jquery/jquery',
    'jqueryui': '../bower_components/jqueryui/jquery-ui',
    'underscore': '../bower_components/underscore/underscore',
    'backbone': '../bower_components/backbone/backbone',
    'marionette': '../bower_components/marionette/lib/core/backbone.marionette',
    'backbone.babysitter': '../bower_components/backbone.babysitter/lib/backbone.babysitter',
    'backbone.wreqr': '../bower_components/backbone.wreqr/lib/backbone.wreqr',
    'radio': '../bower_components/backbone.radio/build/backbone.radio',
    'bootstrap': '../bower_components/bootstrap/dist/js/bootstrap',
    'sha1': '../bower_components/sha1/sha1',
    'sweetAlert': '../bower_components/sweetalert/lib/sweet-alert.min',
    'moment': '../bower_components/moment/min/moment.min',
    'dateTimePicker': '../bower_components/eonasdan-bootstrap-datetimepicker/src/js/bootstrap-datetimepicker',
    //'backbone.list'     : '../bower_components/backbone-forms/distribution.amd/editors/list',
    'backbone.paginator': '../bower_components/backbone.paginator/lib/backbone.paginator.min',
    'requirejs-text': '../bower_components/requirejs-text/text',
    'L': '../bower_components/leaflet/dist/leaflet-src',
    'leaflet_cluster': '../bower_components/leaflet.markercluster/dist/leaflet.markercluster',
    'leaflet_google': '../bower_components/leaflet-plugins/layer/tile/Google',
    'dropzone': '../bower_components/dropzone/dist/dropzone',
    'i18n': '../bower_components/i18n/i18next',
    'floatThead': '../bower_components/floatThead/dist/jquery.floatThead-slim',
    'chart': '../bower_components/chartjs/Chart',
    'tooltipster-list': '../bower_components/tooltipster-list/dist/js/tooltipList',
    'tooltipster': '../bower_components/tooltipster/js/jquery.tooltipster.min',


    /*==========  Vendors  ==========*/
    //waiting for a new release (amd friendly)

    //'fancytree': '../bower_components/fancytree/dist/jquery.fancytree-all.min',
    //'backbone-forms': '../bower_components/backbone-forms/distribution.amd/backbone-forms',
    'backbone-forms': 'vendors/backbone-forms',
    'fancytree': 'vendors/jquery.fancytree-all.min',
    'backgrid': 'vendors/backgrid',
    'backgrid.paginator': 'vendors/backgrid-paginator',
    'backgridSelect_all': 'vendors/backgrid-select-all',
    'autocompTree': './vendors/jquery.autocompTree',

    'backgrid-moment-cell':'./vendors/backgrid-moment-cell',
  },

  shim: {
    jquery: {
      exports: '$'
    },
    jqueryui: {
      exports: '$.ui'
    },
    underscore: {
      exports: '_'
    },
    backbone: {
      deps: ['jquery', 'underscore'],
      exports: 'Backbone'
    },
    marionette: {
      exports: 'Marionette'
    },
    radio: {
      exports: 'Radio'
    },
    bootstrap: {
      deps: ['jquery'],
      exports: 'Bootstrap'
    },
    templates: {
      deps: ['underscore'],
      exports: 'Templates',
    },
    sha1: {
      exports: 'sha1'
    },
    sweetAlert: {
      exports: 'Swal'
    },
    moment: {
      exports: 'moment'
    },
    dateTimePicker: {
      exports: 'dateTimePicker'
    },
    'backbone.paginator': {
      exports: 'backbone.paginator',
    },
    backgrid: {
      exports: 'Backgrid'
    },
    'backgrid.paginator': {
      exports: 'backgrid.paginator',
    },
    backgridSelect_all: {
      exports: 'BackgridSelect_all'
    },
    'backgrid-moment-cell': {
      deps: ['moment','backgrid'],
    },
    leaflet_cluster: {
      deps: ['L'],
      exports: 'leaflet_cluster'
    },
    leaflet_google: {
      deps: ['L'],
      exports: 'leaflet_google'
    },
    leaflet: {
      exports: 'L'
    },
    fancytree: {
      //useless?
      deps: ['jquery','jqueryui'],
      exports: 'Fancytree'
    },
    autocompTree: {
      deps: ['fancytree'],
      exports: 'autocompTree'
    },
    dropzone: {
      deps: ['jquery'],
      exports: 'Dropzone'
    },
    i18n: {
      deps: ['jquery'],
      exports: 'i18n'
    },
    floatThead: {
      deps: ['backgrid'],
      exports:  'FloatThead'
    },
    tooltipster: {
      deps: [
          'jquery'
      ],
      exports: 'ToolStiper'
    },
    'tooltipster-list': {
      deps: [
          'jquery',
          'tooltipster'
      ],
      exports: 'TooltipList'
    },
  },
});

require(['app', 'templates','translater'],
function(app, templates, Translater) {
  app.start();
  this.translater = Translater.getTranslater();
});
