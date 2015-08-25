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

], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter 
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/individual/templates/tpl-individual.html',
		className: 'full-height animated white',

		events : {
			'click #btnFilter' : 'filter',
		},

		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'filter': '#filter',
		},

		initialize: function(){
			this.translater = Translater.getTranslater();
			this.com = new Com();
		},

		onRender: function(){

			this.$el.i18n();
		},


		onShow : function(){
			this.displayGrid();
			this.displayFilter();
		},

		displayGrid: function(){
			var _this = this;
			this.grid = new NsGrid({
				pageSize: 20,
				pagingServerSide: true,
				com: this.com,
				url: config.coreUrl+'individuals/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'indiv-count'
			});

			this.grid.rowClicked = function(row){
				_this.rowClicked(row);
			};
			this.grid.rowDbClicked = function(row){
				_this.rowDbClicked(row);
			};
			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
		},

		displayFilter: function(){
			this.filters = new NsFilter({
				url: config.coreUrl + 'individuals/',
				com: this.com,
				filterContainer: 'filter',
			});
		},

		filter: function(){
			this.filters.update();
		},

		rowClicked: function(row){
			var id = row.model.get('ID');
			Backbone.history.navigate('individual/'+id, {trigger: true})
		},

		rowDbClicked: function(row){

		},
	});
});
