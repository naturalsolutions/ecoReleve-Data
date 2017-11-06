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
    'ns_ruler': 'ns_modules/ns_ruler',

    /*==========  Bower  ==========*/
    'jquery': '../bower_components/jquery/dist/jquery',
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
    'moment-timezone-with-data': '../bower_components/moment-timezone/builds/moment-timezone-with-data-2012-2022',
    'dateTimePicker': '../bower_components/eonasdan-bootstrap-datetimepicker/src/js/bootstrap-datetimepicker',
    //'backbone.list'     : '../bower_components/backbone-forms/distribution.amd/editors/list',
    'backbone.paginator': '../bower_components/backbone.paginator/lib/backbone.paginator.min',
    'requirejs-text': '../bower_components/requirejs-text/text',
    'L': '../bower_components/leaflet/dist/leaflet-src',
    'leaflet_cluster': '../bower_components/leaflet.markercluster/dist/leaflet.markercluster-src',
    'leaflet_google': '../bower_components/leaflet-plugins/layer/tile/Google',
    'dropzone': '../bower_components/dropzone/dist/dropzone',
    'i18n': '../bower_components/i18n/i18next',
    'chart': '../bower_components/chartjs/Chart',
    'tooltipster': '../bower_components/tooltipster/dist/js/tooltipster.bundle.min',

    'ns_filter_bower': '../bower_components/NaturalJS_Filter/model-filter',
    'ag-grid': '../bower_components/ag-grid/dist/ag-grid',
    'resumable': '../bower_components/resumable.js/resumable',


    /*==========  Vendors  ==========*/
    //waiting for a new release (amd friendly)
    'backgrid': 'vendors/backgrid',
    'backgrid.paginator': 'vendors/backgrid-paginator',


    'backbone-forms': 'vendors/backbone-forms',
    'fancytree': 'vendors/jquery.fancytree-all.min',

    'autocompTree': './vendors/jquery.autocompTree',
    'tooltipster-list': 'vendors/tooltipList',
    'popper' : '../bower_components/popper.js/index',

    'backgrid-moment-cell':'./vendors/backgrid-moment-cell',

    "bootstrap-modal": "../bower_components/bootstrap/js/modal",
    "backbone.bootstrap-modal": "../bower_components/backbone.bootstrap-modal/src/backbone.bootstrap-modal",
    "ez-plus": "../bower_components/ez-plus/src/jquery.ez-plus",
    "bootstrap-tagsinput" : "../bower_components/bootstrap-tagsinput/src/bootstrap-tagsinput",
    'mousetrap':'vendors/mousetrap/mousetrap.min',
    'backbone.marionette.keyShortcuts': 'vendors/marionette/backbone.marionette.keyshortcuts',
    'backbone.virtualcollection' : '../bower_components/backbone.virtualcollection/backbone.virtual-collection',
    'noty' : '../bower_components/noty/js/noty/packaged/jquery.noty.packaged',
    'jquery.rateit': '../bower_components/jquery.rateit/scripts/jquery.rateit',
    'bootstrap-star-rating': '../bower_components/bootstrap-star-rating/js/star-rating',
    'exif-js' : '../bower_components/exif-js/exif',
    'wheelzoom' : './vendors/wheelzoom',
    'imageLoaded' : '../bower_components/imagesloaded/imagesloaded.pkgd',
    'workerExif' : '../app/modules/importFile/camTrap/workerExif'
  },
  map: {
      '*': {
        'backbone_forms' : 'backbone-forms'
      }
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
    'mousetrap':{
      exports: 'MouseTrap'
    },
    'backbone.marionette.keyShortcuts':{
      deps:[
        'marionette',
        'mousetrap'
      ],
    },
    'ez-plus':{
      deps:[
        'jquery',
      ]
    },
    'bootstrap-tagsinput':{
      deps:[
        'jquery',
      ]
    },
    'jquery.rateit':{
      deps:[
        'jquery',
      ]
    },
    'bootstrap-star-rating':{
      deps:[
        'jquery',
      ]
    },
    'wheelzoom':{
        exports: 'wheelzoom'
    },
    'imageLoaded': {
      deps:[
        'jquery',
      ],
      exports: 'imageLoaded'
    },
    'workerExif' : {
      deps :[],
      exports : 'workerExif'
    }
    
  }
});

require(['app', 'templates','translater'],
function(app, templates, Translater) {
  this.translater = Translater.getTranslater();
  this.translater.dfd.done(function(){
    app.start();
  })

});
