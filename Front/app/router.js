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
			'stations(/:id)': 'sta',
			'input(/)' : 'input',
			'export(/)' : 'export',
			'import(/)' : 'import',
			'stations(/)' : 'stations',
			'newStation(/)': 'newStation',
			'*route(/:page)': 'home',
		},

		execute: function(callback, args){
			$.ajax({
				context: this,
				url: config.coreUrl + 'security/has_access'
			}).done( function() {
				this.insertHeader();
				callback.apply(this, args);
			}).fail( function(msg) {
				document.location.href="http://127.0.0.1/NsPortal/Front"; 
			});
		},

		insertHeader: function(){
			if(!this.options.controller.rgHeader.hasView()){
				this.options.controller.rgHeader.show( new LytHeader());
			}
		},
	});
});
