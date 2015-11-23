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
      'change input': 'changeValue',
    },

    name: 'File type selection',

    initialize: function() {
		},

    onShow: function() {
      this.$el.find('.tile-inside:first input').prop('checked', true).change();
      this.$el.find('.tile-inside:first').addClass('active');
		},

    validate: function() {
      return this.$el.find('.tile-inside input[type="radio"]:checked').val();
    },

    changeValue: function(e) {
      this.$el.find('label.tile-inside').each(function() {
        $(this).removeClass('active');
      });
      $(e.target).parent().addClass('active');
    },
  });
});
