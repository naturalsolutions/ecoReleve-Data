define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'config',
	'ns_modules/ns_com',
	'ns_grid/model-grid',
	'ns_filter/model-filter',


	'i18n'

], function($, _, Backbone, Marionette, Swal, config, Com, NSGrid, NSFilter
){

	'use strict';

	return Marionette.LayoutView.extend({

		className: 'full-height', 

		template: 'app/modules/editStations/templates/tpl-step0.html',
		events: {
			'click button#submit' : 'filter',
		},

		ui: {
			'stationId': '#stationId',
		},

		name: 'Sation selection',


		onDestroy: function(){
			
		},

		validate: function(){
			this.model = this.currentRow.model;
			return true;
		},

		/*==========  2 DO : Set the first station id  ==========*/
		
		check: function(){
			if(this.currentRow){
				return true;
			}else{
				return false;
			}
		},

		initialize: function(options){
			this.com = new Com();
			this.initGrid();
		},

		initGrid: function(){
			var _this = this;

			this.urlParams = 'params';

			var myCell = Backgrid.NumberCell.extend({
				decimals: 5
			});

			this.grid = new NSGrid({
				pageSize: 20,
				pagingServerSide: true,
				com: this.com,
				url: config.coreUrl+'stations/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'stations-count',
				onceFetched: function(){
					var row = this.grid.body.rows[0];
					_this.currentRow = row;
					row.$el.addClass('active');
				},
			});

			this.grid.rowClicked = function(row){
				_this.rowClicked(row);
			};
			this.grid.rowDbClicked = function(row){
				_this.rowDbClicked(row);
			};


		},

		onShow : function(){
			this.displayGrid();
			this.displayFilters();
		},

		displayGrid: function(){
			var _this= this;
			//could be in the module
			this.$el.find('#grid').html(_this.grid.displayGrid());
			this.$el.find('#paginator').html(_this.grid.displayPaginator());


		},

		displayFilters: function(){
			this.filters = new NSFilter({
				url: config.coreUrl + 'stations/',
				com: this.com,
				filterContainer: 'filters'
			});
		},

		rowClicked: function(row){
			//set station id
			if(this.currentRow){
				this.currentRow.$el.removeClass('active');
			}
			row.$el.addClass('active');
			this.currentRow = row;
		},

		rowDbClicked : function(row){
			this.rowClicked(row);
		},

		filter: function(){
			this.filters.update();
		},
		
	});
});
