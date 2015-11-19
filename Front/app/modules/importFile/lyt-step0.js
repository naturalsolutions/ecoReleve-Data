define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',

	'i18n'

], function($, _, Backbone, Marionette
) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/importFile/tpl-step0.html',

    events: {
      'click .tile-inside': 'selectTile',
    },

    name: 'File type selection',

    initialize: function() {
		},

    onShow: function() {
		},

    validate: function() {
      return this.$el.find('.tile-inside input[type="radio"]:checked').val();
    },

    selectTile: function(e) {
      $(e.currentTarget).find('input').prop('checked', true);
    },
  });
});
