define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'radio',
	'text!modules2/import/_rfid/templates/step2.html',
	
], function($, _, Backbone, Marionette, config, Radio, tpl) {
	'use strict';

	return Marionette.ItemView.extend({
		template: tpl,


		events: {
			'click button#validation' : 'redirectValidation',
			'click button#import' : 'redirectimport',
			'click button#home' : 'redirectHome',
		},

		initialize: function() {
			this.radio = Radio.channel('route');
		},

		onShow: function(){
		},

		redirectValidation: function(){
			this.radio.command('validate:type', 'rfid');
		},

		redirectimport: function(){
			this.radio.trigger('import');
		},

		redirectHome: function(){
			this.radio.trigger('home');
		},

	});
});
