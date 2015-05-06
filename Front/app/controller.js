define(['marionette', 'config', 

	'./base/home/lyt-home',

	/*==========  modules  ==========*/
	'./modules/export/layouts/export-layout',
	'./modules/import/layouts/lyt-import-gpx',
	'./modules/input/layouts/lyt-input',
	'./modules/stations/layouts/lyt-stations'


],function( Marionette, config, 
	LytHome,

	/*==========  modules  ==========*/
	LytExport,
	LytImport,
	LytInput,
	LytStations
){
	'use strict';
	return Marionette.Object.extend({

		initialize: function(){
			this.rgMain=this.options.app.rootView.rgMain;
			this.rgHeader=this.options.app.rootView.rgHeader;
			this.rgFooter=this.options.app.rootView.rgFooter;
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

		import: function(){
			this.rgMain.show(new LytImport());
		},

		stations: function(){
			this.rgMain.show(new LytStations());
		},

	});
});
