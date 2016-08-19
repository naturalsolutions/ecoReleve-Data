//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',

], function($, _, Backbone, Marionette, Translater, config) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/validate/templates/tpl-camTrapModal.html',
    className: 'modal fade modal-cam-trap',
    id: 'camTrapModal',

    initialize: function(options) {
			this.parent = options.parent;
			console.log("on initialise");
		this.$elementPopover = $(options.parent.$el.find('.reneco-image_file'));
			var _this = this;
			this.$elementPopover.popover({
				container: '#gallery',
				placement : 'bottom',
				template : '<div class="popover" role="tooltip"></h3><div class="popover-content"></div></div>',
				html: true,
				content: function(){
					return '<img src='+_this.model.get('path')+''+_this.model.get('name')+'  />';
				},
				/*content:function () {
				return '<img src="'+_this.tabView[_this.currentPosition]+ '" />';
			}*/
		});

		},
		onBeforeShow: function(){

		},
		render: function(){
			console.log("la on render");


		},

    onShow: function() {
      //this.$el.i18n();
			console.log("on affiche le popover");
			this.$elementPopover.popover('show');


    },

		changeImage:function (model) {
			this.model = model;
			console.log("on change d'image la ");
			console.log(this.$elementPopover);
			this.parent.$el.find('.popover-content img').attr("src", this.model.get('path')+''+this.model.get('name') );
			this.render();
		},

		hide: function(){
			this.$elementPopover.popover('hide');
		},

  });
});
