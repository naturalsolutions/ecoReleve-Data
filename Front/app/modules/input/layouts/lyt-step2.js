define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'sweetAlert',
	'dateTimePicker',
	'radio',

	'ns_stepper/lyt-step',

	'ns_modules/ns_com',

	
	'../views/view-step2-new',
	'../views/input-grid',


	'collections/monitoredsites',
	'models/position',
	'models/station',
	'translater',

	'../views/view-step2-filter',
	'../views/view-step2-grid',

], function($, _, Backbone, Marionette, config, Swal, dateTimePicker, Radio,
	Step, Com,
	StationView, Grid, 
	MonitoredSites, Position, Station, Translater,
	FilterView, GridView
){

	'use strict';
	return Step.extend({
		className: 'ns-full-height',

		regions: {
			leftRegion : '#inputStLeft',
			rightRegion : '#inputStRight'
		},

		template: 'app/modules/input/templates/tpl-step2.html',

		onShow: function(){
			this.translater = Translater.getTranslater();
			this.parent.disableNext();
			var stationType = this.model.get('start_stationtype');
			this.loadStationView(stationType);
		},

		loadStationView: function(type){
			var _this = this; 
			if(type <= 3){
				var stationForm = new StationView({
					type: type,
					parent: this
				});
				this.leftRegion.show(stationForm);
			}else{

				var urlParams;
				switch(type){
					case 'last':
						urlParams = [{'lastImported':true}];
						break;
					case 'old':
						break;
					case 'monitored':
						urlParams = [{'monitored':true}];


						break;
					default: 
						break;
				}


				this.com = new Com();
				var firlterView = new FilterView({
					parent: this
				});
				this.leftRegion.show(firlterView);

				var gridView = new GridView({
					type: type,
					parent: this,
					urlParams : urlParams
				});
				this.rightRegion.show(gridView);
			}
		},





	});
});
