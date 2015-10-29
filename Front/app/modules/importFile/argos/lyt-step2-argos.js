define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',

	'i18n'

], function($, _, Backbone, Marionette
){

	'use strict';

	return Marionette.LayoutView.extend({

		className: 'full-height', 
		template: 'app/modules/importFile/argos/templates/tpl-step2-argos.html',

		name : 'step2 Argos',

		initialize: function(){
		},

		check: function(){
		},

		onShow : function(){
		},

		onDestroy: function(){
		},

		validate: function(){
		},


	});
});
