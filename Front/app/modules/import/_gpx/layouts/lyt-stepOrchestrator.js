define([
	'ns_stepper/lyt-stepperOrchestrator',
	'radio',
	'i18n'
], function(StepperOrchestrator, Radio) {

	'use strict';

	return StepperOrchestrator.extend({

		initialize :function () {
			StepperOrchestrator.prototype.initialize.apply(this, arguments);

		},
		onShow: function(){
			StepperOrchestrator.prototype.onShow.apply(this, arguments);
			Backbone.history.navigate('#import/gpx');
			$('#stepper-header span').html('Import > Gpx');
			Radio.channel('route').command('route:header', {route:'Manual import',child_route: 'GPX', route_url:'import'});

			/**
				TODO:
				- Remove those 2 lines when refactored			
			**/
			
			this.$el.find('#btnPrev').css('left', '0');
			this.$el.find('#btnNext').css('right', '0');
			this.$el.i18n();
		},

		displayPrev: function() {
			$('#btnPrev').show();
		},

		prevStep: function(){
			if(this.currentStep ==0){
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
