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
			"change": "changeValid",

		},
		events:{
			'beforeItemAdd' : 'verifTag',
			"focusout input": "saveTags",
		},
		//template : 'app/modules/validate/templates/tpl-image.html',
		template : 'app/modules/validate/templates/tpl-camTrapToolsBar.html',
		className : 'toolsBarCamTrap',
		//template : $('#itemview-image-template').html(),

		initialize : function(options) {
			this.parent = options.parent;
		},

		onRender: function(){
      this.$el.find('#tagsInput').tagsinput({
				 	maxTags: 5,
					trimValue: true,
			});
    },

		addTag: function(tag){
			this.$el.find('#tagsInput').tagsinput('add',tag);
			//console.log(e);
		},

		verifTag: function(e){//avant d'ajouter un tag
			var capitalise = e.item.substr(0, 1);
			if(e.item.length > 1 ) {
				 capitalise = capitalise.toUpperCase() + e.item.substr(1).toLowerCase();
			}
			else {
				capitalise = capitalise.toUpperCase();
			}
			if ( e.item !== capitalise) {
				e.cancel = true;
				this.$el.find('#tagsInput').tagsinput('add',capitalise);
			}
		},

		saveTags : function(e){
			var tabTags = this.$el.find('#tagsInput').val();
				if(this.parent.currentPosition !== null ){
					if (tabTags.length > 0) {
					this.parent.tabView[this.parent.currentPosition].setModelTags(tabTags);
					}
					else {
						//TODO effacer les tags 
						this.parent.tabView[this.parent.currentPosition].setModelTags("");
					}
			}
		},
		removeAll : function() {
			this.$el.find('#tagsInput').tagsinput('removeAll');
		}


	});

});
