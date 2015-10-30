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
		template: 'app/modules/export/templates/tpl-export-step2.html',

		name : 'Step one name',

		initialize: function(){
		},

		onShow : function(){
		},

		validate: function(){
			return true;
		},

	});
});
