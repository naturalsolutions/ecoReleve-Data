
define(['jquery', 'marionette', 'backbone', 'config', 'controller'],
	function($, Marionette, Backbone, config){

	'use strict';
	return Marionette.AppRouter.extend({

		appRoutes: {
			'observations/:id': 'obs',
			'input(/)' : 'input',
			'export(/)' : 'export',
			'import(/)' : 'import',
			'stations(/)' : 'stations',
			'individual(/)' : 'individual',
			'individuals(/)' : 'individual',
			'individual(/):id' : 'indiv',
			'newStation(/)': 'newStation',
			'editStations(/)': 'editStations',
			'importFile(/)': 'importFile',

			'station(/):id': 'station',
			'*route(/:page)': 'home',
		},

		execute: function(callback, args){
			$.ajax({
				context: this,
				url: config.coreUrl + 'security/has_access'
			}).done( function() {
				callback.apply(this, args);
			}).fail( function(msg) {
				document.location.href='http://127.0.0.1/NsPortal/Front'; 
			});
		},

	});
});
