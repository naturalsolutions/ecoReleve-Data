define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',

	'ns_grid/model-grid',
], function(
	$, _, Backbone, Marionette, NsGrid
){
	'use strict';
	return Marionette.ItemView.extend({
		template: 'app/modules/import/templates/import-grid.html',
		className:'detailsImportPanel',
		events: {
			'click .backgrid-container tbody tr': 'focus',
			'click #btnSelectionGrid' : 'clearSelectedRows',
			'click table.backgrid td.editor' : 'cellToEdit',
			'click table.backgrid td.select-row-cell input[type=checkbox]' : 'checkSelect',
			'click table.backgrid th input' : 'checkSelectAll',
		},

		all : false,

		initialize: function(options) {

			this.collection = options.collections; 
			this.com = options.com;

			this.locations = new Backbone.Collection();
			this.locations = this.collection;
		},

		onShow: function() {
			var myCell = Backgrid.NumberCell.extend({
				decimals: 5
			});


			var html = Marionette.Renderer.render('app/modules/import/_gpx/templates/options-list.html');
			var optionsList = $.parseHTML(html);



			var option=[];
			for (var i = 0; i < optionsList.length; i++) {
				option[0]=$(optionsList[i]).attr('value');
				option[1]=$(optionsList[i]).attr('value');
				optionsList[i] = option;
				option=[];
			};

			var columns = [
				{
					name: "id",
					label: "ID",
					editable: false,
					renderable: false,
					cell: "integer"
				},
				{
					editable: true,
					name: "import",
					label: "Import",
					cell: 'select-row',
					headerCell: 'select-all'
				},{
					name: "name",
					label: "Name",
					editable: false,
					cell: "string"
				}, {
					name: "waypointTime",
					label: "Date",
					editable: false,
					cell: Backgrid.DatetimeCell
				}, {
					editable: false,
					name: "latitude",
					label: "LAT",
					cell: myCell
				}, {
					editable: false,
					name: "longitude",
					label: "LON",
					cell: myCell
				},{
					editable: true,
					name: "fieldActivity",
					label: "Field Activity",
					cell: Backgrid.SelectCell.extend({
						optionValues: optionsList
					})
				},
			];


			this.grid = new NsGrid({
				channel: 'modules',
				pageSize: this.PageSize,
				pagingServerSide: false,
				com: this.com,
				columns: columns,
				collection: this.locations
			 });


			var Grid = this.grid.displayGrid();

			this.$el.find('#locations').html(this.grid.displayGrid());
		},



		checkSelect: function (e) {
			console.log(e);
			var id = $(e.target).parent().parent().find('td').html();
			this.grid.interaction('selection', id);
		},

		checkSelectAll: function (e) {
			var ids = _.pluck(this.grid.collection.models, 'id');
			if (!$(e.target).is(':checked')) {
				this.grid.interaction('resetAll', ids);
			} else {
				this.grid.interaction('selectionMultiple', ids);
			}
		},

		focus: function (e) {
			console.log(e);
			if ($(e.target).is('td')) {
				var tr = $(e.target).parent();
				var id = tr.find('td').first().text();
				this.grid.interaction('focus', id);
			}
		},

	});
});
