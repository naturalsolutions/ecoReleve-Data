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
    template: 'app/modules/importFile/gsm/templates/tpl-step2-camtrap.html',

    name: 'step2 CamTrap',

    initialize: function() {
		},

    check: function() {
		},

    onShow: function() {
		},

    onDestroy: function() {
		},

    validate: function() {
		},

  });
});
