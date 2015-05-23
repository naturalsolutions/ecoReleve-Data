define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'ns_stepper/lyt-step',
	'translater',
	'transition-region',
], function($, _, Backbone, Marionette, swal, LS,Translater,TransitionRegion) {
	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/
		template: 'app/ns_modules/ns_stepper/tpl-stepperOrchestrator.html',
		className : 'ns-full-height orchestrator',

		events: {
			'click #infos' : 'infos',
			'click #btnNext' : 'nextStep',
			'click #btnPrev' : 'prevStep',
			'click #reset' : 'reset',
			'keyup input:not(:checkbox,:radio)' : 'datachanged_text',
			'change input:not(:checkbox,:radio)' : 'datachanged_text',
			'change input:checkbox' : 'datachanged_checkbox',
			'change input:radio' : 'datachanged_radio',
			'change input:file' : 'datachanged_file',
			'change select' : 'datachanged_select',
			'click #step-nav li' : 'changeStep',
			//'click .finished': 'finish'
		},

		regions: {
			StepManager: '#StepManager',
			/*step_content: new Marionette.TransitionRegion({
				el: '#step-content'
			}),*/
			step_content: '#step-content',
			actions: '#actions',
		},

		currentStep:0,

		onDestroy: function(){

		},

		initialize: function(options){

			this.steps=options.steps;
			var current;
			for(var i=0; i < this.steps.length; i++){
				current=this.steps[i];
				current.parent = this;
			}
			this.model=options.model;
			this.listenTo(this.model,'change', this.modelChanged);
			//this.keyboard();
		},


		onShow: function(){
			this.initNavSteps();
			this.toStep(0);
			this.$el.i18n();
		},

		onRender: function(){

		},

		initNavSteps: function(){
			for (var i = 0; i < this.steps.length; i++) {
				var id = this.steps[i].name;
				// delete space
				id = id.replace(/ /g,"");
				this.$el.find('#step-nav').append('<li class="step-item" id="'+ id +'"  disabled=disabled><span class="badge">'+(i+1)+'</span><span class="hidden-xs">'+this.steps[i].name+'</span><span class="chevron"></span></li>');
			};
		},

		modelChanged:function(){
			this.check();
			this.resetFromStep();
		},

		resetFromStep:function(){
			for (var i=this.currentStep+1; i < this.steps.length; i++){
				this.steps[i].reset();
			}
		},

		keyboard: function(){
			var ctx=this;
			$(document).keydown(function(e) {

				switch(e.which) {
					case 37: // left
						if(e.ctrlKey)
						ctx.prevStep();
					break;
					case 38: // up
					break;
					case 39: // right
						if(e.ctrlKey)
						ctx.nextStep();
					break;
					case 40: // down
					break;
					default: return; // exit this handler for other keys
				}
				//e.preventDefault(); // prevent the default action (scroll / move caret)
			});
		},

		/*==========  Next / Prev  ==========*/

		nextStep: function(){

			if(this.steps[this.currentStep].nextOK()) {
				if (this.currentStep >= this.steps.length-1) {
				this.finish();

				} else {
					this.currentStep++;
					this.toStep(this.currentStep);
				}
			}
			//for ajaxcall 
			this.disableNext();
		},

		nextStepWithoutCheck: function(){
				if (this.currentStep >= this.steps.length-1) {
				this.finish();

				} else {
					this.currentStep++;
					this.toStep(this.currentStep);
				}
				
		},

		prevStep: function(){
			this.currentStep === 0 ? this.currentStep : this.currentStep--;
			this.toStep(this.currentStep);
		},
		

		toStep: function(numstep){
			var translater = Translater.getTranslater();
			var nextBtnLabel = translater.getValueFromKey('stepper.btnNext');
			var finishBtnLabel = translater.getValueFromKey('stepper.btnFinish');
			this.currentStep = numstep;
			this.step_content.show( this.steps[this.currentStep], {preventDestroy: true} );
			this.check();
			this.styleNav();


			if (this.currentStep==this.steps.length-1){
				//this.$el.find('#btnNext').attr( 'disabled', 'disabled');
				this.$el.find('#btnNext').addClass('finished').find( 'span'
					).html(finishBtnLabel).parent().find('.icon').removeClass('rightarrow').addClass('validate');
			}
			else {
				 this.$el.find('#btnNext').removeClass('finished').find( 'span'
					).html(nextBtnLabel).parent().find('.icon').removeClass('validate').addClass('rightarrow');
			}
			this.displayPrev(this.currentStep);
		},

		check: function(){
			if(this.steps[this.currentStep].validate()) {
				this.$el.find('#btnNext').prop("disabled", false);
			}
			else{
				this.$el.find('#btnNext').prop("disabled", true);
			}
		},

		disableNext: function(){
			this.$el.find('#btnNext').prop("disabled", true);
		},


		/*==========  Style Nav Steps  ==========*/
		displayPrev: function() {
			if (this.currentStep==0){
				/* this.$el.find('#btnPrev').attr( 'disabled', 'disabled');*/
				this.$el.find('#btnPrev').hide();

			}
			else {
				/*  this.$el.find('#btnPrev').removeAttr('disabled'); */

				this.$el.find('#btnPrev').show();
			}

		},

		styleNav: function(){
			var id = this.steps[this.currentStep].name;
			var idCompleteStep ;
			// delete space
			id = id.replace(/ /g,"");
			this.$el.find('#step-nav li.step-item.active').removeClass('active');
			this.$el.find('#step-nav li#'+ id).addClass('active');
			for (var i = 0; i < this.currentStep; i++) {
				idCompleteStep = this.steps[i].name;
				idCompleteStep = idCompleteStep.replace(/ /g,"");
				this.$el.find('#step-nav li#'+idCompleteStep).addClass('complete');
			};
			for (var i = this.currentStep; i < this.steps.length; i++) {
				idCompleteStep = this.steps[i].name;
				idCompleteStep = idCompleteStep.replace(/ /g,"");
				this.$el.find('#step-nav li#'+idCompleteStep).removeClass('complete');
			};
		},


		GetStepByName: function(StepName){
			for (var i=0; i < this.steps.length; i++){
				if (this.steps[i].name == StepName ) return this.steps[i].Name ;
			}
			return null;
		},

		
		datachanged_text: function(e){
			this.steps[this.currentStep].datachanged_text(e);
		},

		datachanged_checkbox: function(e){
			this.steps[this.currentStep].datachanged_checkbox(e);
		},


		datachanged_radio: function(e){
			this.steps[this.currentStep].datachanged_radio(e);
		},

		datachanged_file : function(e){
			this.steps[this.currentStep].datachanged_file(e);
		},
		datachanged_select: function(e){
			this.steps[this.currentStep].datachanged_select(e);
		},
		infos: function(){
			console.info(this.model);
		},

		changeStep : function(e){

			var element = $(e.target);
			var idStep ;
			if ( element.is( "li" )) {
				idStep = parseInt($(e.target).find('span.badge').text())-1 ;
			} else {
				idStep = parseInt($(e.target).parent().find('span.badge').text())-1 ;
			}
			
			if (this.currentStep >= idStep)
				this.toStep(idStep);
		},

		alert_end: function() {
			var finishMsg = translater.getValueFromKey('shared.alertMsg.finishMsg'),
			redoMsg = translater.getValueFromKey('shared.alertMsg.redoMsg'),
			finishTitleMsg = translater.getValueFromKey('shared.alertMsg.finishTitleMsg');

			var self = this;
			swal({
				title: finishTitleMsg,
				text: "",
				type: "success",
				showCancelButton: true,
				confirmButtonColor: "green",
				confirmButtonText: redoMsg,
				cancelButtonText: finishMsg,
				closeOnConfirm: true,
				closeOnCancel: true
				},
				function(isConfirm){
					if (isConfirm) {
						 self.toStep(0);
					} else {
						
					}
			});
		},

		finish: function() {
			this.alert_end();
		}

	});

});
