define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'radio',

	'backgrid',
	'ns_grid/model-grid',


], function(
	$, _, Backbone , Marionette, config, Radio,
	Backgrid, NSGrid
){

	'use strict';

	return Marionette.ItemView.extend({
		events: {

		},
		initialize: function() {
			this.display();
		},

		display: function(){

			this.cols = [{
				editable: false,
				name: 'id',
				label: 'id',
				cell: 'string',
				renderable: false,
			},{
				editable: false,
				name: 'nbFieldWorker',
				label: 'nbFieldWorker',
				cell: 'integer',
			},{
				editable: false,
				name: 'FieldActivity_Name',
				label: 'FieldActivity_Name',
				cell: 'string',
			},{
				editable: false,
				name: 'Region',
				label: 'Region',
				cell: 'string',
			},{
				editable: false,
				name: 'Place',
				label: 'Place',
				cell: 'string',
			},{
				editable: false,
				name: 'LAT',
				label: 'LAT',
				cell: 'string',
			},{
				editable: false,
				name: 'LON',
				label: 'LON',
				cell: 'string',
			},{
				editable: false,
				name: 'Creation_date',
				label: 'Creation_date',
				cell: 'string',
			}
			];

			this.grid= new NSGrid({
				columns: this.cols,
				channel: 'modules',
				url: config.coreUrl + 'stations/',
				pageSize : 24,
				pagingServerSide : true,
			});
			
			$('#grid').html(this.grid.displayGrid());
			$('#paginator').append(this.grid.displayPaginator());

		},

		getGrid: function(){
			return this.grid;
		},



	});
});
