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

		},

    onShow: function() {
      //this.$el.i18n();
      this.$el.modal();
    },

		changeImage:function (model) {
			this.model = model;
			this.render();
		},

		hide: function(){
			this.$el.modal('hide');
		}
  });
});
