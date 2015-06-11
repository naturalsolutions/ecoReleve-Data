define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',

	'ns_stepper/lyt-step',
	'i18n'
], function($, _, Backbone, Marionette, Step) {

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

	});
});
