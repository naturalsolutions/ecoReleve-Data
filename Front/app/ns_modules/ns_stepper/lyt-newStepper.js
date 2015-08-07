/**

	TODO:
	- toStep
	- global model to children?

**/

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
		className: 'ns-full-height animated',

		regions: {
			stepContent : '#step-content',
		},

		ui: {
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
		animateOut: function(){
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

		initialize: function(){
			this.translater = Translater.getTranslater();
			this.currentStepIndex = 0;
			this.models = [];

			this.initSteps();
			//this.initModels();
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

		prev: function(){
			//no check assumed
			//clear stored datas for the past steps
			this.cleanStepModel();
			this.currentStepIndex--;
			this.navigate();
		},
		next: function(){
			//check if the current step validates
			var _this = this;
			var temp = this.currentStep.validate();
			//temp can be a boolean or a jqxhr
			if(temp){
				if(/*temp.readyState*/ false){ //2change
					temp.done(function() {
						//stores the required infos for the next step;
						_this.models[_this.currentStepIndex] = _this.currentStep.model;
						_this.currentStepIndex++;
						_this.navigate();
					});
				}else{
					_this.models[_this.currentStepIndex] = _this.currentStep.model;

					_this.currentStepIndex++;
					_this.navigate();

				}
			}else{
				console.warn('verify the current step requirements');
			}

		},

		navigate: function(){
			if(this.currentStepIndex == -1){
				this.quit();
				return;
			}
			if(this.currentStepIndex == this.steps.length){
				this.finished();
				return;
			}
			this.displayStep(this.currentStepIndex);
			this.updateStepNav();
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
			this.currentStep = new this.steps[index]({model : model});
			this.stepContent.show(this.currentStep);

			//check if we have to wait to parse the template
			if(this.currentStep.jqxhr){
				this.currentStep.jqxhr.done(function(){
					_this.bindRequiredFields();
				});
			}else{
				this.bindRequiredFields();
			}
		},

/*		initModels : function(){
			for (var i = 0; i < this.steps.length ; i++) {
				this.models[i] = new Backbone.Model();
			};
		},*/

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
			var errors = this.currentStep.check();
			if(!errors){
				this.enableNextBtn();
			}else{
				this.disableNextBtn();
			}
		},

		bindRequiredFields: function(){
			var _this = this;
			this.onEditEvt = $.proxy(function(e){
				this.checkNextBtn(e);
			}, this);
			var required = this.$el.find('.required').each(function(){
				$(this).on('keyup', _this.onEditEvt);
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
			console.log('finished');
		}
,
		quit: function(){
			Backbone.history.navigate('', {trigger: true});
		},

		addStep: function(Step, index) {
			console.log('test');
			if(index < this.currentIndex){
				this.currentIndex ++;
			}
			this.steps.splice(index, 0, Step);
			name = Step.prototype.name;
			this.ui.stepNav.children(':eq('+(index - 1)+')').after('<li><span class="badge">'+ (index+1) +'</span>'+ name +'<span class="chevron"></span></li>');
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


	});
});
