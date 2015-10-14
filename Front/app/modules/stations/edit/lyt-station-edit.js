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

		template: 'app/modules/stations/edit/templates/tpl-station-edit.html',
		events: {
			'click button#submit' : 'filter',
			'click .tab-link' : 'displayTab'
		},

		ui: {
			'stationId': '#stationId',
			'totalEntries': '#totalEntries',
			'filters' : '#filters'
		},
		regions: {
			gridRegion: '#grid',
			paginatorRegion : '#paginator'
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
			var url = config.coreUrl+'stations/';
			this.initGrid(url);
			this.parent = options.parent;
		},

		initGrid: function(url,params){
			var _this = this;
			this.urlParams = params ||{};
			var myCell = Backgrid.NumberCell.extend({
				decimals: 5
			});
			if(this.grid){

			}
			this.grid = new NSGrid({
				pageSize: 20,
				pagingServerSide: true,
				com: this.com,
				name : 'StationGrid',
				url: url,
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'stations-count',
				onceFetched: function(){
					window.app.temp = this;

					_this.totalEntries(this.grid);
					var rows = this.grid.body.rows;
					if(_this.currentRow){
						for (var i = 0; i < rows.length; i++) {
							if(rows[i].model.attributes.ID == _this.currentRow.model.attributes.ID){
								_this.currentRow = rows[i];
								rows[i].$el.addClass('active');
								return rows[i];
							}
						}
					}else{
						var row = this.grid.body.rows[0];
						if(row){
							_this.currentRow = row;
							row.$el.addClass('active');
						}
					}
				},
			});
			this.grid.rowClicked = function(args){
				_this.rowClicked(args.row);
			};
			this.grid.rowDbClicked = function(args){
				_this.rowDbClicked(args.row);
			};
		},

		totalEntries: function(grid){
			this.total = grid.collection.state.totalRecords;
			this.ui.totalEntries.html(this.total);
		},

		onShow : function(){
			this.displayGrid();
			this.displayFilters();
			window.app.filter = this.filters.model;
		},

		displayGrid: function(){
			var _this= this;
			//could be in the module
			/*this.$el.find('#grid').html(_this.grid.displayGrid());*/
			this.gridRegion.show(this.grid.getGridView());
			this.$el.find('#paginator').html(_this.grid.displayPaginator());
		},

		displayFilters: function(typeObj){
			this.filters = new NSFilter({
				url: config.coreUrl + 'stations/',
				com: this.com,
				name:'StationGrid',
				typeObj: typeObj,
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
			this.parent.next();
		},

		filter: function(e){
			this.filters.update();
		},

		displayTab : function(e){
			var _this =this;
			var type = $(e.target).attr('title');
			$('.tab-ele').removeClass('active');
			var typeObj;
			$(e.target).parent().addClass('active');

			var url =config.coreUrl+'stations/';
			var params = null;

			if( type == 'allSt' ){
				type = false;
				typeObj=1;
			}else{
				type = true;
				typeObj= 2;
			}
			//this.initGrid(url, params);
			// this.grid.fetchCollection(url, params);
			$('#filters').empty();

			_this.displayFilters(typeObj);
			console.log(this.com);
			var callback = function(){
				_this.filter();
			};
			console.log('**********com');
			console.log(this.com);
			
			this.grid.lastImportedUpdate(type, callback);
			

		},
	});
});
