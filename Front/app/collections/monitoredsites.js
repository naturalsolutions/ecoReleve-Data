define([
	'backbone',
	'models/monitoredsite'
], function(Backbone, MonitoredSite){
	'use strict';
	return Backbone.Collection.extend({
		model: MonitoredSite,
		//url: config.coreUrl + 'monitoredSite'
	});
});
