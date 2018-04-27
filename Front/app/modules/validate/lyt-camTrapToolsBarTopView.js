define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',
  'bootstrap-tagsinput',
], function($, _, Backbone, Marionette, Translater, config, TagsInput ) {

  'use strict';

  return Marionette.ItemView.extend({
		modelEvents: {
		},
		events:{
		},
		//template : 'app/modules/validate/templates/tpl-image.html',
		template : 'app/modules/validate/templates/tpl-camTrapToolsBarTop.html',
		className : 'toolsBarCamTrapTop',
		//template : $('#itemview-image-template').html(),

		initialize : function(options) {
			this.parent = options.parent;
		},

		onRender: function(){
    },
	});

});
