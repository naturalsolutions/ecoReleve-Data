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
) {

  'use strict';

  return NewStepper.extend({
    /*===================================================
    		=            Layout Stepper Orchestrator            =
    		===================================================*/
    //dedicated to be overloaded

		initialize: function (options) {
			this.urlToHold = options.type;
			NewStepper.prototype.initialize.call(this,options);
			console.log(this.urlToHold);

		},

    initSteps: function() {
      this.steps = [Step0];
			if ( this.urlToHold !== null ) {
				this.goToThisUrl();
			}
    },
		onShow : function(){
			this.displayStepNav();
			this.displayStep(this.currentStepIndex);
		},

    // testAdd: function() {
    //   this.addStep(Step0, 2);
    // },
		// onShow : function(){
		// 	this.displayStepNav();
		// 	// console.log(this.steps)
		// 	this.displayStep(0);
		// },
    // testRemove: function() {
    //   this.removeStep(2);
    // },

		goToThisUrl:function (){
			console.log("dans go to url");
			console.log('goToThisUrl',this.urlToHold);
			switch ( this.urlToHold ) {
				case 'gpx': {
					console.log("GPX");
					this.steps = [Step0,Step1GPX, Step2GPX];
					this.currentStepIndex = 1;
					break;
				}
				case 'rfid': {
					console.log("RFID");
					this.steps = [Step0, Step1RFID, Step2RFID];
					this.currentStepIndex = 1;
					break;
				}
				case 'gsm': {
					console.log("GSM");
					this.steps = [Step0,Step1GSM];
					this.currentStepIndex = 1;
						break;
				}
				case 'argos': {
					console.log("ARGOS");
					this.steps = [Step0,Step1ARGOS];
					this.currentStepIndex = 1;
						break;
				}
				default: {
					console.log("RIEN DU TOUT");
						this.steps = [Step0];
						break;
				}
			}

			//Backbone.history.navigate('/importFile/'+this.urlToHold+'/'+this.currentStepIndex,{trigger:false, replace: false});

		},

    beforeNext: function(type, index) {
	      if (index == 0) {
	        switch (type){
	          case 'gpx':
	            var gpxSteps = [Step1GPX, Step2GPX];
	            this.addSteps(gpxSteps, 1);
	            break;
	          case 'rfid':
	            var rfidSteps = [Step1RFID, Step2RFID];
	            this.addSteps(rfidSteps, 1);

	            break;
	          case 'gsm':
	            var gsmSteps = [Step1GSM];
	            this.addSteps(gsmSteps, 1);

	            break;
	          case 'argos':
	            var argosSteps = [Step1ARGOS];
	            this.addSteps(argosSteps, 1);

	            //this.addSteps();
	            break;
	          default:
	            //not in step0
	            return false;
	            break;
	        }
					Backbone.history.navigate('/importFile/'+type,{trigger:false, replace: false});
	      }
    },

    beforePrev: function(index) {
      if ((index - 1) == 0) {
        this.removeSteps(1);
				Backbone.history.navigate('/importFile',{trigger:false, replace: false});
      }
    },

  });
});
