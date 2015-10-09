//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',
	'config',
	'ns_grid/model-grid',
	'ns_modules/ns_com',

], function($, _, Backbone, Marionette, Swal, Translater, config, NsGrid, Com){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/validate/templates/tpl-sensorValidate.html',
		className: 'full-height animated white',

		events : {
			'click button#autoValidate' : 'autoValidate',
			'change select#frequency' : 'setFrequency'
		},

		ui: {
			'grid': '#grid',
			'totalEntries': '#totalEntries',
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.type_ = options.type;
			this.com = new Com();
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			this.displayGrid();
		},

		setFrequency: function(e){
			this.frequency = $(e.target).val();
		},

		displayGrid: function(){
			var cols = [{
				name: 'FK_Individual',
				label: 'Individual ID',
				editable: false,
				cell : 'string'
			}, {
				name: 'nb',
				label: 'NB',
				editable: false,
				cell: 'string'
			}, {
				name: 'StartDate',
				label: 'Start equipment',
				editable: false,
				cell: 'string',
			}, {
				name: 'EndDate',
				label: 'End equipment',
				editable: false,
				cell: 'string',
			}, {
				name: 'min_date',
				label: 'Data from',
				editable: false,
				cell: 'string',
			}, {
				name: 'min_date',
				label: 'Data To',
				editable: false,
				cell: 'string',
			}, {
				editable: true,
				name: 'import',
				label: 'IMPORT',
				cell: 'select-row',
				headerCell: 'select-all'
			}];

			var _this = this;
			this.grid = new NsGrid({
				pagingServerSide: false,
				columns : cols,
				pageSize: 20,
				com: this.com,
				url: config.coreUrl+'sensors/'+this.type_+'/uncheckedDatas',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'totalEntries',
			});

			this.grid.rowClicked = function(row){
				_this.rowClicked(row);
			};
			this.ui.grid.html(this.grid.displayGrid());
		},

		rowClicked: function(row){
			var id = row.model.get('FK_Individual');
			Backbone.history.navigate('validate/'+this.type_+'/'+id, {trigger: true});
		},

		autoValidate: function(){
			var tmp = [];
			_.each(this.grid.grid.getSelectedModels(), function(model){
				tmp.push(model.get('FK_Individual'));
			});

			//ajax
			/*$.ajax({
				url: config.coreUrl + '/',
				data : { 'toValidate' : tmp, 'frequency' : this.frequency },
			});*/
		},

	});
});
