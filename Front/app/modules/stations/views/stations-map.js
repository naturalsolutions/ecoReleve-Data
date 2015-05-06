define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'radio',

	'ns_map/ns_map',


], function($, _, Backbone , Marionette, config, Radio, NsMap
	) {

	'use strict';

	return Marionette.ItemView.extend({
		
		onBeforeDestroy: function(){
			this.map.destroy();
		},

		initialize: function(options) {
			this.channel='modules';
			this.radio = Radio.channel(this.channel);
			this.radio.comply(this.channel+':map:update', this.updateGeoJson, this);
			this.initMap();
		},

		initMap: function(){
			this.map = new NsMap({
				zoom: 3,
				element : 'map',
				popup: true,
			});
			var ctx = this;
			this.map.init();
			this.map.initErrorWarning('<i>There is too much datas to display on the map. <br /> Please be more specific in your filters.</i>');

		},

		updateGeoJson: function(args){
			
			var url = config.coreUrl + '/station/search_geoJSON/';
			$('#header-loader').removeClass('hidden');
			this.xhr;

			if(this.xhr && this.xhr.readyState != 4){
				this.xhr.abort();
			}
			this.xhr=$.ajax({
				url: url,
				contentType:'application/json',
				type:'GET',
				context: this,
				data: args.params,
			}).done(function(datas){
				this.map.updateLayers(datas);
				$('#header-loader').addClass('hidden');
			}).fail(function(msg){
				$('#header-loader').addClass('hidden');
				console.warn(msg);
			});
		},
	});
});
