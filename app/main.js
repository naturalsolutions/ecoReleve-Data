require.config({ 
	baseUrl: 'app',
		paths : {
		'app'					: 'app',
		'config'				: 'config',
		'router'				: 'router',
		'controller'			: 'controller',
		'templates'				: '../build/templates',
		'lyt-rootview'				: './base/rootview/lyt-rootview',
		
		/*==========  Bower  ==========*/
		
		'jquery'				: '../bower_components/jquery/dist/jquery',
		'backbone'				: '../bower_components/backbone/backbone',
		'underscore'			: '../bower_components/underscore/underscore',
		'marionette'			: '../bower_components/marionette/lib/core/backbone.marionette',
		'backbone.babysitter'	: '../bower_components/backbone.babysitter/lib/backbone.babysitter',
		'backbone.wreqr'		: '../bower_components/backbone.wreqr/lib/backbone.wreqr',
		'sha1'					: '../bower_components/sha1/bin/sha1',
		'transition-region'		: '../bower_components/marionette.transition-region/marionette.transition-region',
		'jqueryui'				: '../bower_components/jqueryui/jquery-ui.min',

		/*==========  Custom  ==========*/

	},
	shim : {
		jquery : {
			exports : 'jQuery'
		},
		jqueryui: {
			exports: '$ui'
		},
		underscore : {
			exports : '_'
		},
		backbone : {
			exports : 'Backbone'
		},
		marionette : {
			exports : 'Marionette'
		},

		templates :{
			deps : ['underscore'],
			exports : 'Templates',
		},
		sha1: {
			exports: 'sha1'
		},
	},
});


require(['app', 'templates'], function(app){
		app.start();
});
