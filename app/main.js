require.config({ 
	baseUrl: "app",
    paths: {
		'router'				: 'router',
		'app'					: 'app',
		'templates'				: '../build/templates',
		'jquery'				: '../bower_components/jquery/dist/jquery',
		'backbone'				: '../bower_components/backbone/backbone',
		'underscore'			: '../bower_components/lodash/dist/lodash',
		'marionette'			: '../bower_components/marionette/lib/core/backbone.marionette',
		'backbone.babysitter'	: '../bower_components/backbone.babysitter/lib/backbone.babysitter',
		'backbone.wreqr'		: '../bower_components/backbone.wreqr/lib/backbone.wreqr',
		'bootstrap'				: '../bower_components/components-bootstrap/js/bootstrap',
	},
	shim : {
		jquery : {
			exports : 'jQuery'
		},
		underscore : {
			exports : '_'
		},
		backbone : {
			deps : ['jquery', 'underscore'],
			exports : 'Backbone'
		},
		marionette : {
			deps : ['jquery', 'underscore', 'backbone'],
			exports : 'Marionette'
		},
		bootstrap : {
			deps : ['jquery'],
		},
		app : {
			deps : ['jquery', 'underscore', 'backbone', 'marionette'],
		},
		router : {
			deps : ['app'],
		},
		templates : {
			deps : ['underscore']}
		},    
});

require([
	"jquery",
	"backbone",
	"underscore",
	"marionette",
	"app",
	"router",
	"templates",
	"bootstrap",
],
function(jquery, backbone, underscore, marionette, app, router) {
	app.router = new router();

    Backbone.history.start({ pushState: true });
});
