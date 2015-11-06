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
		template: 'app/modules/export/templates/tpl-export-step1.html',

		name : 'Step one name',

		initialize: function(options){
			this.coll = new Backbone.Collection();
			console.log(options);
		},

		onShow : function(){

		},


		validate: function(){
			return true;
		},

		//check if the current step requirements are fielded
		//this function is based on the .required class (no comming back 4 the moment sry)
		check: function(){
			return true;
		},

	});
});
