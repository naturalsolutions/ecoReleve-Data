define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',
	'./lyt-camTrapImageModel',

], function($, _, Backbone, Marionette, Translater, config , CamTrapImageModel ) {

  'use strict';
  return Marionette.ItemView.extend({
	/*	model: CamTrapImageModel,//ImageModel,
		keyShortcuts :{
			//'space': 'onClickImage',
		},
		events:{

		},*/

		template : 'app/modules/validate/templates/tpl-imagedetails.html',


		initialize : function(options) {
			this.parent = options.parent;
			console.log("init des details");

		},

		onRender: function(){
			var _this = this;

		},

		onDestroy: function() {
			console.log("bim destroy");
		}

	});

});
