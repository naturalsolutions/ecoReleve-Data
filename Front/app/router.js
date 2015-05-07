/**

	TODO:
	- set login as marionette.application

**/
define(['jquery', 'marionette', 'backbone', 'config', './base/login/lyt-login', './base/header/lyt-header'],
	function($, Marionette, Backbone, config, LytLogin, LytHeader){

	'use strict';
	return Marionette.AppRouter.extend({
		appRoutes: {
			'observations/:id': 'obs',
			'stations/:id': 'sta',
			'input(/)' : 'input',
			'export(/)' : 'export',
			'import(/)' : 'import',
			'stations(/)' : 'stations',
			'*route(/:page)': 'home',
		},

		execute: function(callback, args){
			$.ajax({
				context: this,
				url: config.coreUrl + 'security/has_access'
			}).done( function() {
				$('body').addClass('app');
				this.insertHeader();
				callback.apply(this, args);
			}).fail( function(msg) {
				$('body').removeClass('app');
				this.options.controller.rgHeader.empty();
				this.options.controller.rgMain.show(new LytLogin());
				Backbone.history.navigate('login', {trigger: true});
			});
		},

		insertHeader: function(){
			if(!this.options.controller.rgHeader.hasView()){
				this.options.controller.rgHeader.show( new LytHeader());
			}
		},
	});
});
