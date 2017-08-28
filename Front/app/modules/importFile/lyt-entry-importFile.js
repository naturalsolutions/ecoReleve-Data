define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'ns_stepper/lyt-newStepper',
	'./lyt-step0',

	'./lyt-select-importFile',
	'./gpx/lyt-step1-gpx',
	'./gpx/lyt-step2-gpx',

	'./rfid/lyt-step1-rfid',
	'./rfid/lyt-step2-rfid',

	'./gsm/lyt-step1-gsm',
	'./gsm/lyt-step2-gsm',

	'./argos/lyt-step1-argos',

], function($, _, Backbone, Marionette, config, NewStepper, Step0,
	StepSelectFile,
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

		initialize: function (options) {
			this.urlToHold = options.type;
			this.steps = [Step0];
			NewStepper.prototype.initialize.call(this,options);

		},

    initSteps: function() {
			if ( this.urlToHold !== null ) {
				this.goToStepByType();
			}
		},

		onShow : function(){
			var _this = this;
			this.displayStepNav();
			this.displayStep(this.currentStepIndex);
			this.$el.find('.import-step0').on('click', function(event){
				Backbone.history.navigate('#', {trigger: false});
				Backbone.history.navigate('importFile',{trigger: true});

			});
		},

		goToStepByType:function (){
			var type = this.urlToHold;
			var steps = this.getNextStepsByType(type);
			this.steps = $.merge(this.steps, steps);
			this.currentStepIndex = 1;
		},

		getNextStepsByType: function(type){
			switch (type){
				case 'gpx':
					var Step0GPX = StepSelectFile.extend({
						name : 'GPX file selection',
						url:'an Useless url',
						acronymType: 'GPX',
						extension:'.gpx',
						maxFiles:8
					});
					var steps = [Step0GPX, Step1GPX, Step2GPX];
					break;
				case 'rfid':
					var Step0RFID = StepSelectFile.extend({
						name : 'RFID file selection',
						acronymType: 'RFID',
						url:config.coreUrl+'sensors/rfid/datas',
						extension:'.txt',
						maxFiles:1
					});
					var steps = [Step0RFID, Step1RFID];
					break;
				case 'gsm':
					var Step0GSM = StepSelectFile.extend({
						name : 'GSM file selection',
						url:config.coreUrl+'sensors/gsm/datas',
						acronymType: 'GSM',
						extension:'.txt',
						uploadOnly:true,
						maxFiles:8
					});
					var steps = [Step0GSM];
					break;
				case 'argos':
					var Step0Argos = StepSelectFile.extend({
						name : 'Argos file selection',
						url:config.coreUrl+'sensors/argos/datas',
						acronymType: 'Argos',
						extension:'.txt',
						uploadOnly:true,
						maxFiles:8
					});
					var steps = [Step0Argos];
					break;
				default:
					//not in step0
					return false;
					break;
			}
			return steps;
		},

    beforeNext: function(type, index) {
	      if (index == 0) {
					var steps = this.getNextStepsByType(type);
					this.addSteps(steps, 1);
					Backbone.history.navigate('/importFile/'+type,{trigger:false, replace: false});
	      }
    },

	beforePrev: function(index) {
		this.models[index] = null;
      if ((index - 1) == 0) {
        this.removeSteps(1);
				Backbone.history.navigate('/importFile',{trigger:false, replace: false});
      }
    },

  });
});
