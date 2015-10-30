
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',
], function($, _, Backbone, Marionette, Swal, Translater
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/ns_modules/ns_stepper/tpl-newStepper.html',
		className: 'full-height animated',

		regions: {
			stepContent : '#step-content',
		},

		ui: {
			wizard : '#wizard',
			stepNav : '#stepNav',
			btnNext : '#btnNext',
			btnPrev :'#btnPrev',
		},

		events: {
			'click @ui.btnPrev' : 'prev',
			'click @ui.btnNext' : 'next',

			'click #testAdd' : 'testAdd',
			'click #testRemove' : 'testRemove',
		},

		animateIn: function() {
			this.ui.wizard.addClass('slideInDown');
			this.ui.btnPrev.animate({left : '0'}, 500);
			this.ui.btnNext.animate({right : '0'}, 500);
			this.$el.animate(
				{ opacity: 1 },
				500,
				_.bind(this.trigger, this, 'animateIn')
			);
		},
		animateOut: function(){
			this.ui.wizard.addClass('zoomOutDown');
			this.ui.btnPrev.animate({left : '-100%'}, 500);
			this.ui.btnNext.animate({right : '-100%'}, 500);
			this.$el.animate(
				{ opacity : 0 },
				200,
				_.bind(this.trigger, this, 'animateOut')
			);
		},

		initialize: function(){
			this.translater = Translater.getTranslater();
			this.currentStepIndex = 0;
			this.models = [];
			this.initSteps();
		},

		onDestroy: function(){
			this.unbindRequiredFields();
		},

		//dedicated to be overloaded
		initSteps: function(){
			
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			this.displayStepNav();
			this.displayStep(0);
		},

		//clean the stored datas from current Step
		cleanStepModel : function(){
		},

		beforeNext: function(){
		},
		beforePrev: function(){
		},

		prev: function(){
			//no check assumed
			//clear stored datas for the past steps
			this.beforePrev(this.currentStepIndex);

			this.cleanStepModel();
			this.currentStepIndex--;
			if(this.currentStepIndex == -1){
				this.quit();
				return;
			}else{
				this.displayStep(this.currentStepIndex);
			}
		},
		next: function(){
			//check if the current step validates
			var _this = this;
			var x = this.currentStep.validate();

			if(x){
				this.beforeNext(x, _this.currentStepIndex);
				$.when( x ).then( this.increment.bind(this) );
			}else{
				console.warn('verify the current step requirements');
			}
		},

		increment: function(){
			//stores datas
			this.models[this.currentStepIndex] = this.currentStep.model;
			//then increments
			this.currentStepIndex++;
			if(this.currentStepIndex >= this.steps.length){
				this.finished();
				this.currentStepIndex = this.steps.length-1;
				return;
			}else if(this.currentStepIndex > this.steps.length){
				this.currentStepIndex = this.steps.length;
				return;
			}else{
				this.displayStep(this.currentStepIndex);
			}
		},

		errors: function(){
		},

		//display a step by index
		displayStep: function(index){

			var _this = this;
			this.disableNextBtn();
			if(this.currentStep){
				this.unbindRequiredFields();
			}
			//get the options stored from the previous step;
			if(index > 0){
				var model = this.models[index - 1];
			}


			//display the step
			this.currentStep = new this.steps[index]({model : model, parent : this});
			this.stepContent.show(this.currentStep);

			if(this.currentStep.lastStep){
				this.ui.btnNext.html('<span class="ctrl" data-i18n="stepper.btnNext"></span><i class="icon small reneco reneco-validate white action-picto"></i>');
			}else{
				this.ui.btnNext.html('<span class="ctrl" data-i18n="stepper.btnNext">Next</span><i class="icon small reneco reneco-rightarrow white action-picto"></i>');
			}

			this.updateStepNav();
			//check if we have to wait to parse the template (bind evts)

			$.when( this.currentStep.rdy ).then( this.bindRequiredFields.bind(this));
		},

		displayStepNav: function(){
			//dipslay the list of step headers
			var name = '';
			for (var i = 0; i < this.steps.length ; i++) {

				name = this.steps[i].prototype.name;
				//template
				if(i == this.currentStepIndex){
					this.ui.stepNav.append('<li class="active"><span class="badge">'+ (i+1) +'</span>'+ name +'<span class="chevron"></span></li>');
				}else{
					this.ui.stepNav.append('<li><span class="badge">'+ (i+1) +'</span>'+ name +'<span class="chevron"></span></li>');
				}
			};
		},

		updateStepNav: function(){
			var _this = this;
			this.ui.stepNav.find('li').each(function(index){
				if(index == _this.currentStepIndex){
					$(this).addClass('active');
				}else{
					$(this).removeClass('active');
				}
			});
		},

		checkNextBtn: function(){
			var x = this.currentStep.check();
			if( x ){
				$.when( x ).then( this.enableNextBtn.bind(this), this.disableNextBtn.bind(this) );
			}else{
				this.disableNextBtn();
			}
		},

		bindRequiredFields: function(){
			var _this = this;

			//test with _this as context
			this.onEditEvt = $.proxy(function(e){
				this.checkNextBtn(e);
			}, this);
			var required = this.$el.find('.required').each(function(){
				$(this).on('change', _this.onEditEvt);
				$(this).parent().parent().on('dp.change', _this.onEditEvt);
			});
			if(!required.length){
				//if no .required found, enable nextBtn
				this.enableNextBtn();
			}
			
		},

		unbindRequiredFields: function(){
			var _this = this;
			this.$el.find('.required').each(function(){
				$(this).off('change', _this.onEditEvt);
			});
		},

		enableNextBtn: function(){
			this.ui.btnNext.removeAttr('disabled');
		},
		disableNextBtn: function(){
			this.ui.btnNext.attr('disabled', 'disabled');
		},

		finished: function(){
		},

		quit: function(){
			Backbone.history.navigate('', {trigger: true});
		},

		addStep: function(Step, index) {
			if(index < this.currentIndex){
				this.currentIndex ++;
			}
			this.steps.splice(index, 0, Step);
			name = Step.prototype.name;
			this.ui.stepNav.children(':eq('+(index - 1)+')').after('<li><span class="badge">'+ (index+1) +'</span>'+ name +'<span class="chevron"></span></li>');
		},

		addSteps: function(steps, index){
			for (var i = 0; i < steps.length; i++) {
				this.addStep(steps[i], index+i);
			}
		},

		removeStep: function(index){
			var step;

			var name = this.steps[index].prototype.name;
			this.ui.stepNav.children(':eq('+ index +')').remove();

			if(index < this.currentIndex){
				this.currentIndex --;
			}
			if (index > -1) {
				step = this.steps.splice(index, 1);
				this.models.splice(index, 1);
			}

			return step;
		},

		removeSteps: function(index){
			//the tab is spliced so the index doesn't change ;)
			for (var i = index; index < this.steps.length; i++) {
				this.removeStep(index);
			}
		},


	});
});
