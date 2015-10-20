define(['marionette', 'config', 

	'./base/home/lyt-home',

	/*==========  modules  ==========*/
	'./modules/export/layouts/export-layout',

	'./modules/stations/visu/lyt-stations',
	'./modules/stations/edit/lyt-station-stepper-edit',
	'./modules/stations/new/lyt-station-stepper-new',
	'./modules/stations/manager/lyt-station-manager',

	'./modules/importFile/lyt-entry-importFile',
	'./modules/individual/layouts/lyt-individual',
	'./modules/individual/layouts/lyt-indiv-details',
	'./modules/sensor/layouts/lyt-sensor',
	
	'./modules/monitoredSite/layouts/lyt-ms',
	'./modules/validate/lyt-sensorValidate',
	'./modules/validate/lyt-sensorValidateType',
	'./modules/validate/lyt-sensorValidateDetail',
	'./modules/release/layouts/lyt-release-station',

],function( Marionette, config, 
	LytHome,

	/*==========  modules  ==========*/
	LytExport,
	LytStationVisu,
	LytStationStepperEdit,
	LytStationStepperNew,
	LytStationEdit,
	LytImportFile,
	LytIndividual,
	LytIndivDetails,
	LytSensor,
	LytMonitoredSite,
	LytSensorValidate,
	LytSensorValidateType,
	LytSensorValidateDetail,

	LytReleaseStation

){
	'use strict';

	return Marionette.Object.extend({

		initialize: function(){
			this.rgMain=window.app.rootView.rgMain;
			this.rgHeader=window.app.rootView.rgHeader;
			this.rgFooter=window.app.rootView.rgFooter;
		},


		home: function() {
			Backbone.history.navigate('');
			this.rgMain.show(new LytHome());
		},
		
		export: function(){
			this.rgMain.show(new LytExport());
		},

		importFile: function(){
			this.rgMain.show(new LytImportFile());
		},

		stations: function(){
			this.rgMain.show(new LytStationVisu());
		},

		newStation: function(){
			this.rgMain.show(new LytStationStepperNew());
		},

		editStations: function(){
			this.rgMain.show(new LytStationStepperEdit());
		},

		station: function(id){
			this.rgMain.show(new LytStationEdit({id: id}));
		},

		individual : function(id){
			this.rgMain.show(new LytIndividual({id : id}));
		},

		sensor : function(id){
			this.rgMain.show(new LytSensor({id: id}));
		},

		monitoredSite: function(id){
			this.rgMain.show(new LytMonitoredSite({id: id}));
		},

		validate: function(){
			this.rgMain.show(new LytSensorValidate());
		},

		validateType: function(type){
			this.rgMain.show(new LytSensorValidateType({
				type : type
			}));
		},

		validateDetail: function(type, indId, sensorId){
			this.rgMain.show(new LytSensorValidateDetail({
				type : type,
				indId : indId,
				sensorId : sensorId
			}));
		},

		release: function(){
			this.rgMain.show(new LytReleaseStation());
		},

	});
});
