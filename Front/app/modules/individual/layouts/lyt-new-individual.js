//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',
	'config',
	'ns_modules/ns_com',
	'ns_grid/model-grid',
	'ns_filter/model-filter',
	//'./view-indivDetails'
], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter//,IndivDetails
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/individual/templates/tpl-newIndiv.html',
		className: 'full-height animated white rel',

		events : {
			'click .cancel' : 'hideModal',
			'click .newIndivTile' : 'showDetails',
		},

		ui: {
			'indivs' : '#elemType'
		},

		regions: {
			"details" : "#elemDetails"
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.com = new Com();
			this.rg = options.rg;
			//this.detailsView = options.detailsView;
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			//this.details.show(this.detailsView({type : 1, parent : this}));
		},

		filter: function(){
			this.filters.update();
		},
		clearFilter : function(){
			this.filters.reset();
		},
		rowClicked: function(row){
		},

		rowDbClicked: function(row){

		},
		hideModal : function(){
			this.rg.hideModal();
		},
		showDetails : function(e){
			var indivType = $(e.target).attr('type');
			if(indivType==1){
				this.details.show(new IndivDetails({type : 1, parent : this}));
				this.ui.indivs.addClass('hidden');
			}
		},
		hideDetails : function(){
			this.details.empty();
			this.ui.indivs.removeClass('hidden');
		}
	});
});
