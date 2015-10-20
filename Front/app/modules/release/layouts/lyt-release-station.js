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
	'modules/release/layouts/lyt-release-individual',



], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter, LytReleaseIndiv
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/release/templates/tpl-release-station.html',
		className: 'full-height animated white rel',

		events : {
			'click #btnFilter' : 'filter',
			'click #back' : 'hideDetails',
			'click button#clear' : 'clearFilter',
			'change select.FK_SensorType' : 'updateModels',
			'click #useStation' : 'useStation'
		},

		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'filter': '#filter',
			'detail': '#detail',
			'totalEntries': '#totalEntries',
			'toolbar' : '#toolbar'
		},

		regions: {
			detail : '#detail',
			toolbar : '#toolbar'
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.com = new Com();

		},

		onRender: function(){

			this.$el.i18n();
		},

		onShow : function(){
			this.displayFilter();
			this.displayGrid();
			/*if(this.options.id){
				this.detail.show(new LytSensorDetail({id : this.options.id}));
				this.ui.detail.removeClass('hidden');
			}*/
		},

		displayGrid: function(){
			var _this = this;
			this.grid = new NsGrid({
				pageSize: 13,
				pagingServerSide: true,
				com: this.com,
				name : 'StationGrid',
				url: config.coreUrl+'stations/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'stations-count',
				onceFetched: function(params){
					_this.totalEntries(this.grid);
				}
			});

			this.grid.rowClicked = function(args){
				_this.rowClicked(args.row);
			};
			this.grid.rowDbClicked = function(args){
				_this.rowDbClicked(args.row);
			};
			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
		},

		displayFilter: function(){
			this.filters = new NsFilter({
				url: config.coreUrl + 'stations/',
				com: this.com,
				name:'StationGrid',
				filterContainer: 'filter',
			});
		},

		filter: function(){
			this.filters.update();
		},
		clearFilter : function(){
			this.filters.reset();
		},
		rowClicked: function(row){
			if(this.currentRow){
				this.currentRow.$el.removeClass('active');
			}
			row.$el.addClass('active');
			this.currentRow = row;
		},

		rowDbClicked : function(row){
			this.rowClicked(row);
			this.parent.next();
		},

		hideDetails : function(){
			this.ui.detail.addClass('hidden');
		},
		totalEntries: function(grid){
			this.total = grid.collection.state.totalRecords;
			this.ui.totalEntries.html(this.total);
		},

		useStation:function(){
			this.detail.show(new LytReleaseIndiv({station:this.currentRow.model}));
			this.ui.detail.removeClass('hidden');
		}

	});
});
