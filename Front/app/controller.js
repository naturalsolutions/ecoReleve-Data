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
	LytIndivDetails

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

		station: function(option){
			this.rgMain.show(new LytStationEdit({id: option}));
		},
		
		individual : function(option){
			this.rgMain.show(new LytIndividual({id : option}));
		},
		indiv : function(option){
			this.rgMain.show(new LytIndivDetails({id: option}));
		},

	});
});
