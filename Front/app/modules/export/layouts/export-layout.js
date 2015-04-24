/**
	TODO:
	- Remove fuelux (wizard)
**/

define([
	'marionette',
	'radio',

	'../views/step1',
	'../views/step2',
	'../views/step2-map',
	'../views/step3-map',
	'../views/step4',
	'../views/step4-preview',
	'../views/step5',

	'fuelux'
], function(
	Marionette, Radio,
	Step1, Step2_Filters, Step2_Map, Step3_Map, Step4_Columns, Step4_Preview, Step5
){
	'use strict';

	return Marionette.LayoutView.extend({
		template: 'app/modules/export/templates/export.html',
		className: 'full-height',

		regions: {
			step_1_Container: '#step1',
			step_2_Filters_Container: '#step2-filters',
			step_2_Map_Container: '#step2-map',
			step_3_Map_Container: '#step3-map',
			step_4_Columns_Container: '#step4-columns',
			step_4_Preview_Container: '#step4-preview',
			step_5_Container: '#step5',
		},

		events: {
			'click .finished' : 'finish',
			'click button.btn-next' : 'nextStep',
			'click button.btn-prev' : 'prevStep',
		},


		initialize: function(){
			this.radio = Radio.channel('exp');

			this.radio.comply('filters', this.initFilters, this);
			this.radio.comply('columns', this.initColumns, this);
			this.radio.comply('box', this.initBox, this);
			this.radio.comply('viewName', this.initViewName, this);

			this.filters_coll;
			this.columns, this.box;

			$('body').addClass('export-layout');
			$('body').addClass('home-page');
			$('#main-region').addClass('full-height obscur');
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

			this.$el.find('#importWizard').addClass('animated');

			this.$el.find('#importWizard').addClass('slideInDown');
			this.$el.find('#importWizard').removeClass('hidden');

			this.$el.animate(
				{ opacity: 1 },
				500,
				_.bind(this.trigger, this, 'animateIn')
			);
		},

		// Same as above, except this time we trigger 'animateOut'
		animateOut: function() {
			this.$el.find('#importWizard').addClass('animated');
			
			this.$el.find('#btnPrev').animate(
				{ left : '-100%'},
				1000
			);

			this.$el.find('#btnNext').animate(
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

		initViewName: function(args){
			this.viewName=args.viewName;
			this.literalName= args.literalName;
		},
		initFilters: function(args){
			this.filters_coll=args.filters;
		},
		initColumns: function(args){
			this.columnCriteria=args.columns;
		},
		initBox: function(args){
			this.boxCriteria=args.box;
		},

		onBeforeDestroy: function() {
			this.radio.reset();
			$('body').removeClass('export-layout');
			$('#main-region').removeClass('obscur');
		},
		
		onShow: function() {
			var self = this;
			$(".steps li").click(function(e){
				var target = $(this).attr('data-step');
				var wiz = $('#importWizard').data('wizard');
				if(target != 5 ){
					self.$el.find('#btnNext').removeClass('finished').find( 'span'
						).html('Next').parent().find('.icon').removeClass('import').addClass('rightarrow');
				}
			});

			$('.btn-next').attr('disabled', 'disabled');
			var step1= new Step1();
			var passed='passed2';
			this.step_1_Container.show( step1 );
			$('body').addClass('home-page');
			$('#main-region').addClass('full-height obscur');
		},

		alerte: function(args){
			alert(args);
		},

		prevStep: function(){
			$('#importWizard').wizard('previous');
			this.$el.find('#btnNext').removeClass('finished').find( 'span').html('Next').parent().find('.icon').removeClass('import').addClass('rightarrow');
			if($('#step1').hasClass('active')){
				$('#name-view').remove();
			}
		},

		nextStep: function(){
			if(this.finished){
				return false;
			}

			$('#importWizard').wizard('next');
			var step = $('#importWizard').wizard('selectedItem').step;
			$('.btn-next').attr('disabled', 'disabled');

			switch(step) {
				case 1:

					break;
				case 2:
					this.step_2_Filters_Container.show( new Step2_Filters(
						{
							viewName:this.viewName,
						}
					));
					this.step_2_Map_Container.show( new  Step2_Map({
						viewName:this.viewName,
						literalName : this.literalName,
					}));
					this.step = 2;
					$('#stepper-header').append('<span id="name-view">: '+this.literalName+'</span>');
					break;
				case 3:
					this.step_3_Map_Container.show( new  Step3_Map({
						viewName:this.viewName,
						filters: this.filters_coll,
					}));

					this.step = 3;

					break;
				case 4:
					this.step_4_Columns_Container.show( new Step4_Columns({
						viewName:this.viewName,
						filters: this.filters_coll,
					}));
					this.step_4_Preview_Container.show( new Step4_Preview({
						viewName:this.viewName,
						filterCriteria: this.filters_coll,
						boxCriteria: this.boxCriteria,
					}));
					this.step = 4;

					break;
				case 5:
					this.lastStep = new Step5({
						viewName:this.viewName,
						filterCriteria: this.filters_coll,
						boxCriteria: this.boxCriteria,
						columnCriteria: this.columnCriteria
					});
					this.step_5_Container.show( this.lastStep);

					this.step = 5;

					this.$el.find('#btnNext').addClass('finished').find( 'span'
						).html('Export').parent().find('.icon').removeClass('rightarrow').addClass('import');
						$('#btnNext').removeAttr('disabled');
					break;q
				default:
					break;
			}
		},

		finish: function() {
			this.finished = true;
			this.lastStep.initFile();
			this.finished = false;
		},


	});

});
