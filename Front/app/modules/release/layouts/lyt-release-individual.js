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
	'ns_modules/ns_toolbar/lyt-toolbar'
], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter,Toolbar
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/release/templates/tpl-release-individual.html',
		className: 'full-height animated white rel',

		events : {
			'click #btnFilter' : 'filter',
			'click #back' : 'hideDetails',
			'click button#clear' : 'clearFilter',
			//'click #createNew' : 'showModal'
		},

		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'filters': '#filters',
			'detail': '#detail',
			'totalEntries': '#totalEntries',
		},

		regions: {
			detail : '#detail',
			toolbar : '#toolbar'
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.com = new Com();
			this.station = options.station;

		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			this.displayFilter();
			this.displayGrid(); 
		},

		displayGrid: function(){
			var _this = this;
			this.grid = new NsGrid({
				pageSize: 13,
				pagingServerSide: false,
				com: this.com,
				url: config.coreUrl+'release/individuals/',
				urlParams : this.urlParams,
				rowClicked : false,
				totalElement : 'totalEntries',
				onceFetched: function(params){
					console.log('fetched')
					_this.totalEntries(this.grid);
				}
			});

			this.grid.rowClicked = function(args){
				_this.rowClicked(args.row);
			};
			this.grid.rowDbClicked = function(args){
				/*_this.rowDbClicked(args.row);*/
			};
			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
		},

		displayFilter: function(){
			this.filters = new NsFilter({
				url: config.coreUrl + 'release/individuals/',
				com: this.com,
				filterContainer: 'filters',
			});
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
		hideDetails : function(){
			this.ui.detail.addClass('hidden');
		},
		totalEntries: function(grid){
			this.total = grid.collection.state.totalRecords;
			console.log(this.total)
			this.ui.totalEntries.html(this.total);
		},
		/*showModal : function(){
			this.newIndiv.show(new LytNewIndiv({rg : this.newIndiv}));
		}*/
	});
});
