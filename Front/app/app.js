define(['marionette', 'lyt-rootview', 'router', 'controller',
	//circular dependencies, I don't konw where to put it for the moment
	'MonitoredSitePicker',
	'IndivPicker',
	'SensorPicker'
	],
function(Marionette, Lyt_rootview, Router, Controller) {

  var app = {}, JST = window.JST = window.JST || {};

  Backbone.Marionette.Renderer.render = function(template, data) {
    if (!JST[template]) throw 'Template \'' + template + '\' not found!';
    return JST[template](data);
  };

  app = new Marionette.Application();
  app.on('start', function() {
    app.rootView = new Lyt_rootview();
    app.controller = new Controller();
    app.router = new Router({controller: app.controller});
    app.rootView.render();
    Backbone.history.start();
  });

  $(window).ajaxStart(function(e) {
    $('#header-loader').removeClass('hidden');
  });
  $(window).ajaxStop(function() {
    $('#header-loader').addClass('hidden');
  });
  $(window).ajaxError(function() {
    $('#header-loader').addClass('hidden');
  });

  window.onerror = function() {
    $('#header-loader').addClass('hidden');
  };

  window.app = app;
  return app;
});
