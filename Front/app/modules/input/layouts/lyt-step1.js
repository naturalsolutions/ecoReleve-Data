define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',

	'ns_stepper/lyt-step',
	'translater',
	'i18n',

], function($, _, Backbone, Marionette, Step,Translater) {

	'use strict';

	 return Step.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/input/templates/tpl-step1.html',

		datachanged_radio: function(e){
			var target= $(e.target);
			var val=$(target).attr('value');
			this.model.set('start_stationtype' , val);
		},

		onShow: function(){
			this.model.set('start_stationtype' , 1);
			this.$el.i18n();
		},
		initialize : function(){
			this.translater = Translater.getTranslater();
			var step1Label = this.translater.getValueFromKey('input.stepper.step1inputLabel');
			this.name = step1Label;
		}

	});
});
