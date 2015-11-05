define(['marionette', 'config', 

	'./base/home/lyt-home',

	/*==========  modules  ==========*/

	'./modules/stations/layouts/lyt-stations',
	'./modules/stations/layouts/lyt-station-new',

	'./modules/importFile/lyt-entry-importFile',
	'./modules/individual/layouts/lyt-individual',
	'./modules/individual/layouts/lyt-new-individual',
	'./modules/individual/layouts/lyt-indiv-details',

	'./modules/sensor/layouts/lyt-sensor',
	'./modules/sensor/layouts/lyt-sensor-new',
	
	'./modules/monitoredSite/layouts/lyt-ms',
	'./modules/monitoredSite/layouts/lyt-new-site',
	'./modules/validate/lyt-sensorValidate',
	'./modules/validate/lyt-sensorValidateType',
	'./modules/validate/lyt-sensorValidateDetail',
	'./modules/release/layouts/lyt-release-station',

	'./modules/export/lyt-export-stepper',

],function( Marionette, config, 
	LytHome,

	/*==========  modules  ==========*/

	LytStations,
	LytStationsNew,

	LytImportFile,
	LytIndividual,
	LytIndividualNew,
	LytIndivDetails,
	
	LytSensor,
	LytSensorNew,

	LytMonitoredSite,
	LytMonitoredNew,
	LytSensorValidate,
	LytSensorValidateType,
	LytSensorValidateDetail,

	LytReleaseStation,

	LytExport

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

		importFile: function(){
			this.rgMain.show(new LytImportFile());
		},

		stations: function(id){
			this.rgMain.show(new LytStations({id : id}));
		},

		newStation: function(){
			this.rgMain.show(new LytStationsNew());
		},

		individual : function(id){
			this.rgMain.show(new LytIndividual({id : id}));
		},

		newIndividual : function(type){
			this.rgMain.show(new LytIndividualNew({type : type}));
		},

		sensor : function(id){
			this.rgMain.show(new LytSensor({id: id}));
		},

		newSensor: function(type){
			this.rgMain.show(new LytSensorNew({type : type}));
		},

		monitoredSite: function(id){
			this.rgMain.show(new LytMonitoredSite({id: id}));
		},
		newMonitoredSite : function(type){
			this.rgMain.show(new LytMonitoredNew());
		},

		validate: function(){
			this.rgMain.show(new LytSensorValidate());
		},

		validateType: function(type){
			this.rgMain.show(new LytSensorValidateType({
				type : type
			}));
		},

		release: function(){
			this.rgMain.show(new LytReleaseStation());
		},
		
		export: function(){
			this.rgMain.show(new LytExport());
		},

	});
});
