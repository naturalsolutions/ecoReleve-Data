define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'moment',

	'models/station',
	'ns_grid/model-grid',


], function($, _, Backbone,  Marionette, config, moment,
	Station, NsGrid
){

	'use strict';

	return Marionette.ItemView.extend({
		template: 'app/modules/input/templates/tpl-step2-grid.html',
		className: 'ns-full-height col-xs-12',

		initialize: function(options) {
			var _this = this;
			this.com = options.parent.com;

			console.log(this.parent);

			if ( options.urlParams) {
				this.urlParams = options.urlParams; 
			}

			this.parent = options.parent;
			var myCell = Backgrid.NumberCell.extend({
				decimals: 5
			});

			console.log(this.urlParams);

			this.grid = new NsGrid({
				pageSize: 20,
				pagingServerSide: true,
				com: this.com,
				url: config.coreUrl+'stations/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'stations-count'
			});

			this.grid.rowClicked = function(row){
				_this.rowClicked(row);
			};
			this.grid.rowDbClicked = function(row){
				_this.rowDbClicked(row);
			};
		},

		onShow: function() {
			var _this= this;
			this.$el.find('#stationsGridContainer').html(_this.grid.displayGrid());
			this.$el.find('#stationsGridPaginator').html(_this.grid.displayPaginator());

		},

		rowClicked: function(row) {
			this.parent.model.set('station', row.model.get('ID'));

			if(this.currentRow){
				this.currentRow.removeClass('active');
			}
			row.$el.addClass('active');
			this.currentRow = row.$el;
		},

		rowDbClicked : function(row){
			this.rowClicked(row);
			this.parent.parent.nextStepWithoutCheck();
		}
	});
});
