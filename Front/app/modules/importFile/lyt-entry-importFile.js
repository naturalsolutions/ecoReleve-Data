define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'ns_stepper/lyt-newStepper',
	'./lyt-step0',

	'./gpx/lyt-step1-gpx',
	'./gpx/lyt-step2-gpx',

	'./rfid/lyt-step1-rfid',
	'./rfid/lyt-step2-rfid',

	'./gsm/lyt-step1-gsm',
	'./gsm/lyt-step2-gsm',

	'./argos/lyt-step1-argos',

], function($, _, Backbone, Marionette, NewStepper, Step0,
	Step1GPX,
	Step2GPX,

	Step1RFID,
	Step2RFID,

	Step1GSM,
	Step2GSM,

	Step1ARGOS
){

	'use strict';

	return NewStepper.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/
		//dedicated to be overloaded

		initSteps: function(){
			this.steps = [Step0];
		},

		testAdd: function(){
			this.addStep(Step0, 2);
		},

		testRemove: function(){
			this.removeStep(2);
		},

		beforeNext: function(type, index){
			if(index == 0){
				switch(type){
					case 'gpx':
						var gpxSteps = [ Step1GPX, Step2GPX ];
						this.addSteps(gpxSteps, 1);
						break;
					case 'rfid':
						var rfidSteps = [ Step1RFID, Step2RFID ];
						this.addSteps(rfidSteps, 1);
						break;
					case 'gsm':
						var gsmSteps = [ Step1GSM ];
						this.addSteps(gsmSteps, 1);
						break;
					case 'argos':
						var argosSteps = [ Step1ARGOS ];
						this.addSteps(argosSteps, 1);
						//this.addSteps();
						break;
					default:
						//not in step0
						return false;
						break;
				}
			}
		},

		beforePrev: function(index){
			if((index-1) == 0){
				this.removeSteps(1);
			}
			
		},

	});
});
