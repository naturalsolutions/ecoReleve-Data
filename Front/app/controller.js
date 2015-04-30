define(['marionette', 'config', 


	'./base/home/lyt-home',


	/*==========  modules  ==========*/
	'./modules/input/layouts/lyt-input',
	'./modules/export/layouts/export-layout',
	'./Demo/lyt-Obs',
	'./Demo/lyt-Sta',

],function( Marionette, config, 

	LytHome,

	/*==========  modules  ==========*/
	LytInput,
	LytExport,
	LytObs,
	LytSta

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
		obs: function(options){
			this.rgMain.show(new LytObs({id:options}));
		},

		sta: function(options){
			this.rgMain.show(new LytSta({id:options}));
		},


	});

});
