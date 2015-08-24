define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'ns_stepper/lyt-newStepper',
	'./lyt-station-new',
	'modules/stations/manager/lyt-station-manager'
], function($, _, Backbone, Marionette, NewStepper, Step0, Step1
){

	'use strict';

	return NewStepper.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/
		//dedicated to be overloaded
		initSteps: function(){
			this.steps = [Step0, Step1];
		},

		testAdd: function(){
			this.addStep(Step0, 2);
		},

		testRemove: function(){
			this.removeStep(2);
		}



	});
});
