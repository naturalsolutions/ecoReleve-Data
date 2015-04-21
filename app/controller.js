define(['marionette', 'config', 

	'./base/home/lyt-home',
	'./modules/input/layouts/lyt-input',

],function( Marionette, config, 

	LytHome,
	LytInput

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



	});
});
