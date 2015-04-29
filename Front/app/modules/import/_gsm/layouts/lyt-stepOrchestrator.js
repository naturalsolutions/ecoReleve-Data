define([
	'ns_stepper/lyt-stepperOrchestrator',
	'radio',
	'sweetAlert'
], function(StepperOrchestrator, Radio, swal) {

	'use strict';

	return StepperOrchestrator.extend({

		onShow: function(){
			StepperOrchestrator.prototype.onShow.apply(this, arguments);

			Backbone.history.navigate('#import/gsm');
			$('#stepper-header span').html('Import > GSM');
			Radio.channel('route').command('route:header', {route:'Manual import',child_route: 'GSM', route_url:'import'});
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
		/*finish: function() {
			var currentStep = this.steps[this.currentStep-1];

			
		}*/

	});
});
