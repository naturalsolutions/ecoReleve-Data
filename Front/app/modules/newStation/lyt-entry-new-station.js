/**

	TODO:
	- header steps
	----> mini orchestrator?

**/

define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',

	'translater',

	'./layouts/lyt-step1'

], function($, _, Backbone, Marionette, Swal, Translater, 
	Step1
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/newStation/templates/tpl-entry-new-station.html',
		className: 'ns-full-height animated',

		regions: {
			stepperRegion : '#step-content',
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
			this.$el.i18n();
		},


		onShow : function(){
			this.stepperRegion.show(new Step1());
		},

	});
});
