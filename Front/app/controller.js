define(['marionette', 'config', 

	'./base/home/lyt-home',

	/*==========  modules  ==========*/
	'./modules/export/layouts/export-layout',

	'./modules/import/layouts/lyt-import-gpx',
	'./modules/input/layouts/lyt-input',
	'./modules/stations/layouts/lyt-stations',

	'./Demo/lyt-Obs',
	'./Demo/lyt-Sta',

	'./modules/newStation/lyt-entry-new-station',
	'./modules/editStations/lyt-entry-edit-stations',
	'./modules/newStation/layouts/lyt-step1',
	
	'./modules/importFile/lyt-entry-importFile',
	'./modules/individual/layouts/lyt-individual',
	



],function( Marionette, config, 
	LytHome,

	/*==========  modules  ==========*/
	LytExport,
	LytImport,
	LytInput,
	LytStations,

	LytObs,
	LytSta,

	LytNewStation,
	LytEditStations,
	LytStationManager,

	LytImportFile,
	LytIndividual

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
		input: function(){
			this.rgMain.show(new LytInput());
		},
		export: function(){
			this.rgMain.show(new LytExport());
		},
		obs: function(options){
			this.rgMain.show(new LytObs({id:options}));
		},
		sta: function(options){
			this.rgMain.show(new LytSta({id:options}));
		},
		import: function(){
			this.rgMain.show(new LytImport());
		},
		stations: function(){
			this.rgMain.show(new LytStations());
		},



		newStation: function(){
			this.rgMain.show(new LytNewStation());
		},

		editStations: function(){
			this.rgMain.show(new LytEditStations());
		},

		importFile: function(){
			this.rgMain.show(new LytImportFile());
		},

		station: function(options){
			this.rgMain.show(new LytStationManager({id: options}));
		},
		individual : function(){
			this.rgMain.show(new LytIndividual());
		}



	});
});
