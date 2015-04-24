define(['marionette', 'config', 


	'./base/home/lyt-home',


	/*==========  modules  ==========*/
	'./modules/input/layouts/lyt-input',
	'./modules/export/layouts/export-layout',
	'./modules/import/layouts/lyt-import-gpx',


],function( Marionette, config, 

	LytHome,

	/*==========  modules  ==========*/
	LytInput,
	LytExport,
	LytImport

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

	});

});
