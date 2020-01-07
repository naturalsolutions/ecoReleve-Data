define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',

	'i18n',

], function($, _, Backbone, Marionette
) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/importFile/gsm/templates/tpl-step1-gsm.html',

    events: {
      'change input': 'changeValue',
    },

    name : '<span class="import-step1"></span>',

    initialize: function() {
        this.model = new Backbone.Model();
	},

    onShow: function() {
      this.$el.find('.tile-inside:first input').prop('checked', true).change();
      this.$el.find('.tile-inside:first').addClass('active');
      this.$el.i18n();
      var stepName = i18n.translate('import.stepper.step1-label');
      $('.import-step1').html('Provider selection');
		},

    validate: function() {
      var val = this.$el.find('.tile-inside input[type="radio"]:checked').val()
      this.model.set('constructor', val)
      $('.import-step1').html(val);
      return this.model;
    },

    changeValue: function(e) {
      this.$el.find('label.tile-inside').each(function() {
        $(this).removeClass('active');
      });
      $(e.target).parent().addClass('active');
    },

  });

});