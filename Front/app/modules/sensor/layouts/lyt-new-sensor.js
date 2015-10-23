//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',
	'config',
	'ns_modules/ns_com',
	'ns_grid/model-grid',
	'ns_filter/model-filter',
	'./view-newSensorData',

], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter, SensorDetails
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/sensor/templates/tpl-newSensorDetails.html',
		className: 'full-height animated white rel',

		events : {
			'click .cancel' : 'hideModal',
			'click button.sensor' : 'showDetails',
		},

		ui: {
			'sensors' : '#sensorType'
		},

		regions: {
			"details" : "#elemDetails"
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.com = new Com();
			this.rg = options.rg;
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
		},

		filter: function(){
			this.filters.update();
		},
		clearFilter : function(){
			this.filters.reset();
		},
		rowClicked: function(row){
		},

		rowDbClicked: function(row){

		},
		hideModal : function(){
			this.rg.hideModal();
		},
		showDetails : function(e){
			var sensorType = $(e.target).attr('type');
			this.details.show(new SensorDetails({type : sensorType, parent : this}));
			this.ui.sensors.addClass('hidden');
		},
		hideDetails : function(){
			this.details.empty();
			this.ui.sensors.removeClass('hidden');
		}
	});
});
