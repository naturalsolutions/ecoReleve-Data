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
		template: 'app/modules/importFilerfid/templates/tpl-step2-rfid.html',

		name : 'step2 RFID',

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
