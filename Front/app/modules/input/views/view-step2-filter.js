//radio

define([
	'jquery',
	'marionette',
	'sweetAlert',
	'config',

	'ns_filter/model-filter',
	

	'i18n'

], function($, Marionette, Swal, config, NSFilter
){
	"use strict";

	return Marionette.ItemView.extend({
		template: 'app/modules/input/templates/tpl-step2-filter.html',

		events: {
			'click button#submit' : 'filter',
		},



		initialize: function(options){
			this.stationType = options.type;
			this.com = options.parent.com;
		},

		onShow: function(){

			var filtersList={
				1 : {
					name : "name",
					type : "String",
					label : "Name"
				},
				2 : {
					name : "LAT",
					type : "Number",
					label : "Latitude"
				},
				3 : {
					name : "LON",
					type : "Number",
					label : "Longitude"
				},
				4 : {
					name : "StationDate",
					type : "DateTimePicker",
					label : "Date"
				}
			};
			this.filters = new NSFilter({
				//filters: filtersList,
				url: config.coreUrl + 'stations/',
				com: this.com,
				filterContainer: 'filters',
				channel: 'modules',
			});
		},

		filter: function(){
			this.filters.update();
		},


	});
});
