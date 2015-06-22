//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',

	'./lyt-stepOrchestrator',
	'./individual-list',

	'./lyt-step1',
	'./lyt-step2',
	'./lyt-step3',
	
	'translater'

], function($, _, Backbone, Marionette, Swal,
	StepperOrchestrator, IndivFilter,
	Step1, Step2, Step3, Translater
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/input/templates/tpl-entry.html',
		className: 'ns-full-height animated',

		regions: {
			stepperRegion : '#stepper',
			indivFilterRegion : '#indivFilter'
		},
		events : {
			'click span.picker': 'filterIndivShow',
			'click button.filterClose' : 'filterMask',
			'click button.filterCancel' :'filterCancel',
			'click .closeStepper' : 'closeStepper'
		},

		initialize: function(){
			this.model = new Backbone.Model();
			this.translater = Translater.getTranslater();
		},

		animateIn: function() {
			this.$el.find('#btnPrev').animate(
				{ left : '0'},
				500 
			);
			this.$el.find('#btnNext').animate(
				{ right : '0' },
				500
			);
			this.$el.find('#wizard').addClass('slideInDown');
			
			this.$el.animate(
				{ opacity: 1 },
				500,
				_.bind(this.trigger, this, 'animateIn')
			);
		},
		animateOut: function() {
			this.$el.find('#btnPrev').animate(
				{ left : '-100%'},
				500
			);
			this.$el.find('#btnNext').animate(
				{ right : '-100%' },
				500
			);
			this.$el.find('#wizard').addClass('zoomOutDown');
			this.$el.animate(
				{ opacity : 0 },
				500,
				_.bind(this.trigger, this, 'animateOut')
			);
		},

		onRender: function(){
			var step1Label = this.translater.getValueFromKey('input.stepper.step1inputLabel'),
			step2Label = this.translater.getValueFromKey('input.stepper.step2inputLabel'),
			step3Label = this.translater.getValueFromKey('input.stepper.step3inputLabel');

			this.steps=[];
			this.steps[0]= Step1;
			this.steps[1]= Step2;
			this.steps[2]= Step3;

			this.stepper = new StepperOrchestrator({
				model: this.model,
				steps: this.steps
			});

			this.stepperRegion.show( this.stepper );
			this.$el.i18n();
		},


		onShow : function(){

		},

	});
});
