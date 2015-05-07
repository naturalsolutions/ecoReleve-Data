define([
	'config',
	'radio',
	'ns_map/ns_map',

	//'text!ns_modules_map/tpl-legend.html',

], function(config, Radio, NsMap) {

	'use strict';

	return Marionette.ItemView.extend({
		template:'app/modules/import/templates/import-gpx-map.html',
		className: 'full-height',

		initialize: function(options) {
			this.com = options.com;
			this.coll = options.collection;
			this.toGeoJson(this.collection);
		},

		toGeoJson: function(coll){
			var features = {
				'features': [],
				'type': 'FeatureCollection'
			};

			var feature, attr;
			coll.each(function(m){
				attr = m.attributes;
				feature = {
					'type': 'Feature',
					'id': attr.id,
					'geometry': {
						'type': 'Point',
						'coordinates': [attr.longitude, attr.latitude],
					},
					'properties': {
						'date': '2014-10-23 12:39:29'
					},
				};
				features.features.push(feature);
			});
			this.features = features;
		},

		onShow: function(){
			this.map = new NsMap({
				cluster: true,
				popup: false,
				geoJson: this.features,
				com : this.com,
				//legend : true,
				bbox: true,
				selection : true,
				element: 'map',
			});
			this.map.init();
		},

		onRender: function(){
			//$('#map').parent().html(legend);
		},






	});
});
