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
			"change": "changeValid"
		},
		events:{
		},
		//template : 'app/modules/validate/templates/tpl-image.html',
		template : 'app/modules/validate/templates/tpl-camTrapToolsBar.html',
		//template : $('#itemview-image-template').html(),

		initialize : function(options) {
			this.parent = options.parent;
		},
		onRender: function(){
      this.$el.find('#tagsInput').tagsinput()
    }

	});

});
