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

    name : '<span class="import-step0"></span>',

    initialize: function() {
		},

    onShow: function() {
      this.$el.find('.tile-inside:first input').prop('checked', true).change();
      this.$el.find('.tile-inside:first').addClass('active');
      this.$el.i18n();
      var stepName = i18n.translate('import.stepper.step0-label');
      $('.import-step0').html(stepName);
		},

    validate: function() {
      var title = this.$el.find('.tile-inside input[type="radio"]:checked').val();
      $('.import-step0').html(title);
      return title;
    },

    changeValue: function(e) {
      this.$el.find('label.tile-inside').each(function() {
        $(this).removeClass('active');
      });
      $(e.target).parent().addClass('active');
    },
  });
});
