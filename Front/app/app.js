define(['marionette', 'lyt-rootview', 'router', 'controller', 

	//circular dependencies, I don't konw where to put it for the moment
	'IndivPicker',
	'MonitoredSitePicker',
	'SensorPicker'
	],
function(Marionette, Lyt_rootview, Router, Controller) {


	var app = {}, JST = window.JST = window.JST || {};

	Backbone.Marionette.Renderer.render = function(template, data){
		if (!JST[template]) throw "Template '" + template + "' not found!";
		return JST[template](data);
	};

	app = new Marionette.Application();
	app.on('start', function() {
		app.rootView = new Lyt_rootview();
		app.rootView.render();
		app.controller = new Controller();
		app.router = new Router({controller: app.controller});
		Backbone.history.start();
	});

	$( document ).ajaxStart(function(e) {
		$('#header-loader').removeClass('hidden');
	});
	$( document ).ajaxStop(function() {
		$('#header-loader').addClass('hidden');
	});
	$( document ).ajaxError(function() {
		console.error('Error from the server');
		$('#header-loader').addClass('hidden');
	});


	window.app = app;
	return app;
});
