define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'translater',
	'sweetAlert',

	//import GPX
	'../_gpx/layouts/lyt-stepOrchestrator',
	'../_gpx/layouts/lyt-step2',

	'../_gpx/layouts/lyt-step3',
	'../_gpx/layouts/lyt-step4',

	//import RFID
	'../_rfid/layouts/lyt-stepOrchestrator', 
	'../_rfid/layouts/lyt-step1',
	'../_rfid/layouts/lyt-step2',

	//import GSM

	'../_gsm/layouts/lyt-stepOrchestrator', 
	'../_gsm/layouts/lyt-step1',


], function($, _, Backbone, Marionette, Radio, Translater,Swal,

	//GPX
	GPX_StepperOrchestrator, GPX_Step2, GPX_Step3, GPX_Step4,

	//RFID
	RFID_StepperOrchestrator, RFID_Step2, RFID_Step3,

	//GSM
	GSM_StepperOrchestrator, GSM_Step2

){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/
		className:'full-height',
		template:'app/modules/import/templates/tpl-step1.html',
		regions: {
			stepperRegion : '#stepper',
		},

		events: {
			'click #radio-tile': 'checkRadio',
			'click #nextStepper': 'nextStepper',
			'click .closeStepper' : 'closeStepper'
		},

		initialize : function(options){
			if (options.type) {
				this.type = options.type;
			}
			else
			this.type = 'gpx';
			this.model = new Backbone.Model(); 
			this.translater = Translater.getTranslater();
		},

		animateIn: function() {
			this.$el.find('#btnPrev').animate(
				{ left : '0'},
				1000
			);
			this.$el.find('#nextStepper').animate(
				{ right : '0' },
				1000
			);
			this.$el.find('#importWizard').addClass('slideInDown');
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
			this.$el.find('#nextStepper').animate(
				{ right : '-100%' },
				1000
			);
			this.$el.find('#importWizard').addClass('zoomOutDown');
			this.$el.animate(
				{ opacity : 0 },
				500,
				_.bind(this.trigger, this, 'animateOut')
			);
		},

		init_GSM_stepper : function() {
			var stepLabel = this.translater.getValueFromKey('import.stepper.step1GPXLabel');
			var SecondStep = new GSM_Step2({
				model : this.model,
				name : stepLabel,
				tpl : 'app/modules/import/_gsm/templates/tpl-step1.html',
			});

			this.GSM_steps=[];
			this.GSM_steps[0]= SecondStep;
			this.GSM_stepper = new GSM_StepperOrchestrator({
				model: this.model,
				steps: this.GSM_steps
			});
		},

		init_RFID_stepper : function() {
			var stepLabel = this.translater.getValueFromKey('import.stepper.step1GPXLabel');
			var SecondStep = new RFID_Step2({
				model: this.model,
				name: 'RFID-decoder',
				tpl: 'app/modules/import/_rfid/templates/tpl-step1.html',
			});

			var ThirdStep = new RFID_Step3({
				model: this.model,
				name: stepLabel,
				tpl: 'app/modules/import/_rfid/templates/tpl-step2.html',

			});

			this.RFID_steps=[];
			this.RFID_steps[0]= SecondStep;
			this.RFID_steps[1]= ThirdStep;

			this.RFID_stepper = new RFID_StepperOrchestrator({
				model: this.model,
				steps: this.RFID_steps
			});

			
		},

		init_GPX_stepper : function() {
			var step1Label = this.translater.getValueFromKey('import.stepper.step1GPXLabel'),
			step2Label = this.translater.getValueFromKey('import.stepper.step2GPXLabel'),
			step3Label = this.translater.getValueFromKey('import.stepper.step3GPXLabel');
			
			var SecondStep = new GPX_Step2({
				model: this.model,
				name: step1Label,
				tpl: 'app/modules/import/_gpx/templates/tpl-step2.html',

			});

			var ThirdStep = new GPX_Step3({
				model: this.model,
				name: step2Label,
				tpl: 'app/modules/import/_gpx/templates/tpl-step3.html',
			});

			
			var FourthStep = new GPX_Step4({
				model: this.model,
				name: step3Label,
				tpl: 'app/modules/import/_gpx/templates/tpl-step4.html',
			});

			this.GPX_steps=[];
			this.GPX_steps[0]= SecondStep;
			this.GPX_steps[1]= ThirdStep;
			this.GPX_steps[2]= FourthStep;

			this.GPX_stepper = new GPX_StepperOrchestrator({
				model: this.model,
				steps: this.GPX_steps
			});
		},

		onShow : function (){
			$('body').addClass('home-page full-height');
			$('#stepper-header span').html('Import');
			$('#main-region').addClass('full-height obscur');
			 this.$el.i18n();
		 },
		onDestroy : function () {
			$('#main-region').removeClass('obscur');
		},

		onRender : function(){
		},

		checkRadio : function(e) {

			this.$el.find('input').each(function(){
				$(this).prop('checked', false).removeAttr('checked');
		 
			});
			var tile = $(e.currentTarget);
			var radio = tile.find('input');
			radio.prop('checked',true).attr('checked','checked');
			this.type = radio.val();

			if (radio.val() == 'gpx')  
				$('#info-GPX').show();
			else 
				$('#info-GPX').hide(); 
		},

		nextStepper : function(){

			switch(this.type) {
				case 'gpx':
					this.init_GPX_stepper();
					this.stepperRegion.show( this.GPX_stepper );
					break;
				case 'rfid':
					this.init_RFID_stepper();
					
					this.stepperRegion.show( this.RFID_stepper );
					break;
				case 'gsm':
					this.init_GSM_stepper();
					this.stepperRegion.show( this.GSM_stepper );
				
					break;
			};
		},
		closeStepper : function(){
			Swal({
					title: "Are you sure to exit?",
					text: "",
					type: "warning",
					showCancelButton: true,
					confirmButtonColor: "#DD6B55",
					confirmButtonText: "Yes",
					cancelButtonText: "No, cancel !",
					closeOnConfirm: true,
					closeOnCancel: true
				},
				function(isConfirm){
				if (isConfirm) {
					Radio.channel('route').command('home');
				}
			});
		}
	});
});
