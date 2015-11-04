require.config({ 
	baseUrl: 'app',
	paths : {


		'tmp'				: './tmp',

		'app'				: 'app',
		'config'			: 'config',
		'router'			: 'router',
		'controller'		: 'controller',
		'models'			: './models',
		'collections'		: './collections',
		'templates'			: '../build/templates',
		'lyt-rootview'		: './base/rootview/lyt-rootview',
		'transition-region'	: './base/transition-region/transition-region',
		'googleLoaer'			: 				'./vendors/google-maps-loader',
		'translater'		: 'translater', 
		
		
		/*==========  NS modules  ==========*/
		'ns_modules'	: 'ns_modules',
		'ns_filter'		: 'ns_modules/ns_filter',
		'ns_form'		: 'ns_modules/ns_form',
		'ns_grid'		: 'ns_modules/ns_grid',
		'ns_map'		: 'ns_modules/ns_map',
		'ns_stepper'	: 'ns_modules/ns_stepper',
		'ns_navbar'	: 'ns_modules/ns_navbar',
		'FileUploadEditor': 'ns_modules/ns-bbforms-editors/FileUploadEditor/backboneForm-editors-fileUpload',

		//circular dependencies
		'IndivPicker'	: 'ns_modules/ns-bbforms-editors/IndividualPicker/backboneForm-editors-individualPicker',
		'MonitoredSitePicker'	: 'ns_modules/ns-bbforms-editors/MonitoredSitePicker/backboneForm-editors-monitoredSitePicker',
		'SensorPicker'	: 'ns_modules/ns-bbforms-editors/SensorPicker/backboneForm-editors-SensorPicker',

		
		
		'ListOfNestedModel' 	: 'vendors/ListOfNestedModel/ListOfNestedModel',
		'AutocompleteEditor'	: '../externalModules/NaturalJS-BackBone-Forms-Editors/Autocomplete/AutocompleteEditor',

		/*==========  Bower  ==========*/
		'jquery'				: '../bower_components/jquery/jquery',
		'jqueryui'				: '../bower_components/jqueryui/jquery-ui.min',
		'underscore'			: '../bower_components/underscore/underscore',
		'backbone'				: '../bower_components/backbone/backbone',
		'marionette'			: '../bower_components/marionette/lib/core/backbone.marionette',
		'backbone.babysitter'	: '../bower_components/backbone.babysitter/lib/backbone.babysitter',
		'backbone.wreqr'		: '../bower_components/backbone.wreqr/lib/backbone.wreqr',
		'radio'					: '../bower_components/backbone.radio/build/backbone.radio',
		'bootstrap'				: '../bower_components/bootstrap/dist/js/bootstrap',
		'sha1'					: '../bower_components/sha1/sha1',
		'sweetAlert'			:'../bower_components/sweetalert/lib/sweet-alert.min',
		'moment'				: '../bower_components/moment/min/moment.min',
		'dateTimePicker'		: '../bower_components/eonasdan-bootstrap-datetimepicker/src/js/bootstrap-datetimepicker',

		'backbone_forms'		: '../bower_components/backbone-forms/distribution.amd/backbone-forms',
		'backbone.list'			: '../bower_components/backbone-forms/distribution/editors/list',
/*
		'backbone_forms'		: '../bower_components/backbone-forms/distribution.amd/backbone-forms',
		'backbone.list'			: '../bower_components/backbone-forms/distribution.amd/editors/list',
*/

		'backbone.paginator'	: '../bower_components/backbone.paginator/lib/backbone.paginator.min',
		'requirejs-text'		: '../bower_components/requirejs-text/text',
		'L'						: '../bower_components/leaflet/dist/leaflet-src',
		'leaflet_cluster'		: '../bower_components/leaflet.markercluster/dist/leaflet.markercluster',
		'leaflet_google'		: '../bower_components/leaflet-plugins/layer/tile/Google',
		'swiper'				: '../bower_components/swiper/dist/js/swiper',
		'dropzone'				: '../bower_components/dropzone/dist/dropzone',
		'i18n'					: '../bower_components/i18n/i18next',
		'fancytree'				: '../bower_components/fancytree/dist/jquery.fancytree-all.min',

		'fuelux'				: '../bower_components/fuelux/dist/js/fuelux',
		'floatThead'			: '../bower_components/floatThead/dist/jquery.floatThead-slim', 

		//waiting for a new release (amd friendly)
		'backgrid'				: 'vendors/backgrid',
		'backgrid.paginator'	: 'vendors/backgrid-paginator',
		'backgridSelect_all'	:'vendors/backgrid-select-all',

		'simplePagination'		: 'vendors/jquery.simplePagination',


		'bbDate': 'vendors/backboneForm-editors',
		'bbAutoComp': '../externalModules/NaturalJS-BackBone-Forms-Editors/ThesaurusEditor/backboneForm-editors-autocompTree',
		'autocompTree' : '../externalModules/NaturalJS-BackBone-Forms-Editors/ThesaurusEditor/AutoCompletTree/jquery.autocompTree',
		'tooltipster': '../bower_components/tooltipster/js/jquery.tooltipster.min',
    'tooltipster-list': '../bower_components/tooltipster-list/dist/js/tooltipList',
	},


	shim : {
		jquery : {
			exports : '$'
		},
		jqueryui: {
			exports: 'ui'
		},
		underscore : {
			exports : '_'
		},
		backbone : {
			deps : ['jquery', 'underscore'],
			exports : 'Backbone'
		},
		marionette : {
			exports : 'Marionette'
		},
		radio : {
			exports : 'Radio'
		},
		bootstrap: {
			deps: ['jquery'],
			exports : 'Bootstrap'
		},
		templates :{
			deps : ['underscore'],
			exports : 'Templates',
		},
		sha1: {
			exports: 'sha1'
		},
		sweetAlert: {
			exports:'Swal'
		},
		moment : {
			exports : 'moment'
		},
		dateTimePicker : {
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
		backgridSelect_all : {
			exports : 'BackgridSelect_all'
		},
		leaflet_cluster : {
			deps:['L'],
			exports : 'leaflet_cluster'
		},
		leaflet_google : {
			deps:['L'],
			exports : 'leaflet_google'
		},
		leaflet : {
			exports : 'L'
		},
		swiper : {
			exports : 'Swiper'
		},
		simplePagination: {
			deps : ['jquery'],
			exports : 'SimplePagination'
		},
		fancytree :  {
			deps:['jquery','jqueryui'],
			exports : 'Fancytree'
		},
		autocompTree : {
			deps:['fancytree'],
			exports : 'autocompTree'
		},

		fuelux:{
			deps:['jquery','bootstrap'],
			exports: 'Fuelux'
		},
		dropzone : {
			deps: ['jquery'],
			exports : 'Dropzone'
		},
		i18n : {
			deps: ['jquery'],
			exports : '$'
		},
		floatThead : {
			deps: ['backgrid'],
			exports :  'FloatThead'
		},
		ListOfNestedModel: {
            deps: [
            'backbone',
             'backgrid',
             'backbone_forms'
            ]
        },
         FileUploadEditor: {
            deps: [
             'backbone',
             'backbone_forms'
            ],
            exports: 'FileUploadEditor' 
        },
        tooltipster: {
            deps: [
                'jquery'
            ],
            exports: '$'
        },
        'tooltipster-list': {
            deps: [
                'jquery',
                'tooltipster'
            ],
            exports: '$'
        },
	},
});

require(['app', 'templates','translater'], function(app,templates,Translater){
		app.start();
		this.translater = Translater.getTranslater();
});
