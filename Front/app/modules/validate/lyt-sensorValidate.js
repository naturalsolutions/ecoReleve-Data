//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',

], function($, _, Backbone, Marionette, Swal, Translater) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/validate/templates/tpl-sensorValidate.html',
    className: 'full-height animated layer',

    initialize: function(options) {
		},

    onRender: function() {
      this.$el.i18n();
    },

  });
});
