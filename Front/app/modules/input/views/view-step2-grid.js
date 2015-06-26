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
		events :{
			'click tbody > tr': 'setStation',
			'dblclick tbody > tr' : 'navigate'
		},
		initialize: function(options) {
			this.com = options.parent.com;
			if ( options.urlParams) {
				this.urlParams = options.urlParams; 
				console.log(this.urlParams);
			}

			this.parent = options.parent;
			var myCell = Backgrid.NumberCell.extend({
				decimals: 5
			});
			
			/*var columns = [{
				name: 'ID',
				label: 'ID',
				editable: false,
				cell: 'integer',
				renderable: false
			}, {
				name: 'Name',
				label: 'Name',
				editable: false,
				cell:'string',
			}, {
				name: 'StationDate',
				label: 'date',
				editable: false,
				cell: 'date',
			}, {
				name: 'LAT',
				label: 'Lat',
				editable: false,
				cell: myCell,
			}, {
				name: 'LON',
				label: 'Lon',
				editable: false,
				cell: myCell,
			}, {
				name: 'FieldActivity_Name',
				label: 'field activity',
				editable: false,
				cell: 'string',
			}, {
				name: 'FieldWorker1',
				label: 'field worker 1',
				editable: false,
				cell: 'string',
			},{
				name: 'FieldWorker2',
				label: 'field worker 2',
				editable: false,
				cell: 'string',
			}

			];*/



			this.grid = new NsGrid({
				pageSize: 20,
				pagingServerSide: true,
				com: this.com,
				//columns: columns,
				url: config.coreUrl+'stations/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'stations-count'
			});
		},


		onShow: function() { 
			var _this= this;
			this.$el.find('#stationsGridContainer').html(_this.grid.displayGrid());
			this.$el.find('#stationsGridContainer').after(_this.grid.displayPaginator());
			console.log(_this.grid.displayPaginator());
		},

		setStation: function(e) {
			var row = $(e.target);
			console.log(this.com.currentModel)
			this.parent.model.set('station', id);
			var currentStation = this.grid.collection.where({ ID: id })[0];
			this.parent.model.set('start_stationtype', currentStation.get('FK_StationType'));
			$('table.backgrid tr').removeClass('active');
			$(row).addClass('active');
			
		},

		navigate : function(e){
			this.setStation(e);
			this.parent.parent.nextStepWithoutCheck();
		}
	});
});
