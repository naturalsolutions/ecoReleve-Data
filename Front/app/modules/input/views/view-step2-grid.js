/**

	TODO:
	- DbClick

**/

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
		template: 'app/modules/input/templates/stations-list.html',
		className: 'ns-full-height col-xs-12',
		events :{
			'click tbody > tr': 'detail',
			'dblclick tbody > tr' : 'navigate'
		},
		initialize: function(options) {

			var myHeaderCell = Backgrid.HeaderCell.extend({
				onClick: function (e) {
					e.preventDefault();
					var that=this;
					var column = this.column;
					var collection = this.collection;
					var sortCriteria = (collection.sortCriteria && typeof collection.sortCriteria.PK === 'undefined') ? collection.sortCriteria : {};
					switch(column.get('direction')){
						case null:
							column.set('direction', 'ascending');
							sortCriteria[column.get('name')] = 'asc';
							break;
						case 'ascending':
							column.set('direction', 'descending');
							sortCriteria[column.get('name')] = 'desc';
							break;
						case 'descending':
							column.set('direction', null);
							delete sortCriteria[column.get('name')];
							break;
						default:
							break;
					}
					collection.sortCriteria = (Object.keys(sortCriteria).length > 0) ? sortCriteria : {'PK': 'desc'};
					collection.fetch({reset: true, success : function(resp){ 
						}});
				},
			});
			var myCell = Backgrid.NumberCell.extend({
				decimals: 5
			});
			
			var columns = [{
				name: 'PK',
				label: 'ID',
				editable: false,
				cell: Backgrid.IntegerCell.extend({
				  orderSeparator: ''
				}),
				headerCell: myHeaderCell,
				renderable: false
			}, {
				name: 'Name',
				label: 'Name',
				editable: false,
				cell:'string',
				headerCell: myHeaderCell
			}, {
				name: 'Date_',
				label: 'date',
				editable: false,
				cell: 'string',
				headerCell: myHeaderCell
			}, {
				name: 'LAT',
				label: 'Lat',
				editable: false,
				cell: myCell,
				headerCell: myHeaderCell
			}, {
				name: 'LON',
				label: 'Lon',
				editable: false,
				cell: myCell,
				headerCell: myHeaderCell
			}, {
				name: 'FieldActivity_Name',
				label: 'field activity',
				editable: false,
				cell: 'string',
				headerCell: myHeaderCell
			}, {
				name: 'FieldWorker1',
				label: 'field worker 1',
				editable: false,
				cell: 'string',
				headerCell: myHeaderCell
			},{
				name: 'FieldWorker2',
				label: 'field worker 2',
				editable: false,
				cell: 'string',
				headerCell: myHeaderCell
			}

			];

			this.grid = new NsGrid({
				pageSize: 20,
				pagingServerSide: false,
				com: this.com,
				columns: columns,
				url: config.coreUrl + 'stations/?lastImported=true',
			});


		},


		onShow: function() { 
			var _this= this;
			this.$el.find('#stationsGridContainer').html(_this.grid.displayGrid());
			//this.$el.append(this.paginator.render().el);
		},
		onDestroy: function(){
			$('#main-panel').css('padding-top', '20');
			this.grid.remove();
			this.grid.stopListening();
			this.grid.collection.reset();
			this.grid.columns.reset();
			delete this.grid.collection;
			delete this.grid.columns;
			delete this.grid;
		},
		detail: function(evt) {
			var row = $(evt.currentTarget);
			var id = parseInt($(row).find(':first-child').text());
			var currentStation = this.grid.collection.where({ PK: id})[0];
			this.radio.command('generateStation', currentStation);
			$('table.backgrid tr').removeClass('active');
			$(row).addClass('active');
		},




		
		navigate : function(evt){
			this.detail(evt);
			this.radio.command('navigateNextStep');
		}
	});
});
