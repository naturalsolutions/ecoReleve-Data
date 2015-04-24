define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'config',

	'backbone_forms',
	'ns_map/ns_map',
], function($, _, Backbone , Marionette, Radio, config, 
	BbForms, NsMap
){

	'use strict';


	return Marionette.ItemView.extend({
		template: 'app/modules/export/templates/export-step2-map.html',
		className: 'full-height',

		events: {
				'click button#validateBox' : 'validateBox',
		},

		initialize: function(options) {
			this.radio = Radio.channel('exp');
			this.radio.comply('filters2map', this.updateMap, this);

			this.viewName= options.viewName;
			this.filterInfosList= {
				viewName: this.viewName,
				filters: []
			}
			
			this.columnForm;

			this.boxCriteria=[-180, -90, 180, 90];
			this.validateBox();
			this.columnCriteria;

			this.getGeoJson();
		},

		/*
		onBeforeDestroy: function() {
				this.radio.reset();
		},*/

		updateMap: function(args){
			this.filterInfosList=args.filters;
			var url = config.coreUrl + "/views/filter/" + this.viewName + "/geo?"+"&format=geojson&limit=0";

			$.ajax({
				url: url,
				data: JSON.stringify({criteria:this.filterInfosList}),
				contentType:'application/json',
				type:'POST',
				context: this,
			}).done(function(data){
					this.map.updateLayers(data);
			}).fail(function(msg){
					console.error(msg);
			});
			
		},

		getGeoJson: function(){
			var url = config.coreUrl + "/views/filter/" + this.viewName + "/geo?"+"&format=geojson&limit=0";

			$.ajax({
				url: url,
				data: JSON.stringify({criteria:this.filterInfosList}),
				contentType:'application/json',
				type:'POST',
				context: this,
			}).done(function(data){
					this.initMap(data);
			}).fail(function(msg){
					console.error(msg);
			});
		},

		initMap: function(geoJson){
			
			this.map = new NsMap({
				cluster: true,
				zoom: 3,
				area: true,
				geoJson: geoJson,
				element: 'map',
			});
			this.map.init();
		},


		validateStep: function(){
			$('.btn-next').removeAttr('disabled');
		},

		validateBox: function(){
			this.radio.command('box', { box: this.boxCriteria });
		},

	});
});
