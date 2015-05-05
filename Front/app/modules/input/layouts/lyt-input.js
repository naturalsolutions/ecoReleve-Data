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


], function($, _, Backbone, Marionette, Swal,
	StepperOrchestrator, IndivFilter,
	Step1, Step2, Step3
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
				
			/*
			this.radio = Radio.channel('individual');
			this.radio.comply('filterMask', this.filterMask, this);
			*/
		},

		onRender: function(){

			var FirstStep = new Step1({
				model: this.model,
				name: 'start',
				tpl: 'app/modules/input/templates/tpl-step1.html'
			});

			var SecondStep = new Step2({
				model: this.model,
				name: 'station',
				tpl: 'app/modules/input/templates/tpl-step2.html'
			});

			
			var ThirdStep = new Step3({
				model: this.model,
				name: 'protocols',
				tpl: 'app/modules/input/templates/tpl-step3.html',
			});

			this.steps=[];
			this.steps[0]= FirstStep;
			this.steps[1]= SecondStep;
			this.steps[2]= ThirdStep;

			this.stepper = new StepperOrchestrator({
				model: this.model,
				steps: this.steps
			});

			this.stepperRegion.show( this.stepper );
		},

		animateIn: function() {
			this.$el.find('#btnPrev').animate(
				{ left : '0'},
				1000
			);
			this.$el.find('#btnNext').animate(
				{ right : '0' },
				1000
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
				1000
			);
			this.$el.find('#btnNext').animate(
				{ right : '-100%' },
				1000
			);
			this.$el.find('#wizard').addClass('zoomOutDown');
			this.$el.animate(
				{ opacity : 0 },
				500,
				_.bind(this.trigger, this, 'animateOut')
			);
		},


		onShow : function(){

			// add indiv window container
			$('#stepper-header span').html('Manual entry');
			
			$('#stepper').append('<div id="indivFilter" class="stepper-modal"></div>');

		},
		filterIndivShow : function(e){

			$(e.target).parent().parent().parent().find('input').addClass('target');
			var modal = new IndivFilter();
			// navigate to the modal by simulating a click
			var element = '<a class="btn" data-toggle="modal" data-target="#myModal" id="indivIdModal">-</a>';
			$('body').append(element);
			this.indivFilterRegion.show(modal);
			$('#indivIdModal').click();

		},
		filterMask : function(){

			var inputIndivId = $('input.pickerInput');
			$(inputIndivId).removeClass('target');
			this.indivFilterRegion.reset();
			$('#indivIdModal').remove();
			$('div.modal-backdrop.fade.in').remove();

		},
		filterCancel : function(){
			
			$('input.pickerInput').val('');
			this.filterMask();
			
		},

	});
});
