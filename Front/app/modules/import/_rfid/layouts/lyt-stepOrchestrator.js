define([
	'jquery',
	'underscore',
	'backbone',
	'radio',
	'ns_stepper/lyt-stepperOrchestrator',

], function(
	$, _, Backbone, Radio,
	StepperOrchestrator
){

	'use strict';

	return StepperOrchestrator.extend({

		onShow: function(){
			StepperOrchestrator.prototype.onShow.apply(this, arguments);
			Backbone.history.navigate('#import/rfid');
			$('#stepper-header span').html('Import > RFID');
			Radio.channel('route').command('route:header', {route:'Manual import',child_route: 'RFID', route_url:'import'});
			$('#btnPrev').show();

			/**
				TODO:
				- Remove those 2 lines when refactored			
			**/
			
			this.$el.find('#btnPrev').css('left', '0');
			this.$el.find('#btnNext').css('right', '0');
		},

		displayPrev: function() {
			$('#btnPrev').show();
		},

		prevStep: function(){
			if(this.currentStep ==0){
				//app.router.navigate('#import', {trigger: true});
				
			Radio.channel('route').trigger('import');
			} else {
				this.currentStep === 0 ? this.currentStep : this.currentStep--;
				this.toStep(this.currentStep);
			}
		},

		finish: function() {
			var currentStep = this.steps[this.currentStep];
			currentStep.importFile();
		}


	});

});
