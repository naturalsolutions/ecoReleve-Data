
define(['jquery', 'marionette', 'backbone', 'config', 'controller'],
	function($, Marionette, Backbone, config){

	'use strict';
	return Marionette.AppRouter.extend({

		appRoutes: {
			'export(/)' : 'export',

			'importFile(/)': 'importFile',

			'individual(/)' : 'individual',
			'individual(/):id(/)' : 'individual',
			'individual/new(/):id(/)': 'newIndividual',

			'stations(/)' : 'stations',
			'stations/new(/)': 'newStation',
			'stations(/):id(/)': 'stations',

			'sensor/new(/):id(/)' : 'newSensor',
			'sensor(/)' : 'sensor',

			'monitoredSite(/)' : 'monitoredSite',
			'monitoredSite/new(/)' : 'newMonitoredSite',
			'monitoredSite(/):id(/)' : 'monitoredSite',

			'validate/:type(/)':'validateType',
			'validate(/)':'validate',

			'release(/)':'release',


			'*route(/:page)': 'home',
		},

		execute: function(callback, args){
			$.ajax({
				context: this,
				url: config.coreUrl + 'security/has_access'
			}).done( function() {
				callback.apply(this, args);
			}).fail( function(msg) {
				console.log(msg) ;
				if (msg.status === 403) {
					document.location.href='http://127.0.0.1/NsPortal/Front'; 
                }
				
				//
			});
		},

	});
});
