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
	'ns_map/ns_map',
	'ns_form/NSFormsModuleGit',
], function($, _, Backbone, Marionette, Swal, Translater, config, NsGrid, Com, NsMap, NsForm){

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
			'paginator': '#paginator',
			'totalEntries': '#totalEntries',
			'map':'#map'
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.ind_id = parseInt(options.id);
			this.type_ = options.type;
			this.com = new Com();
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			this.displayForm(this.ind_id);
			this.displayGrid();
			this.displayMap();
		},

		setFrequency: function(e){
			this.frequency = $(e.target).val();
		},

		displayGrid: function(){

			var cols = [{
				name: 'PK_id',
				label: 'ID',
				editable: false,
				renderable: false,
				cell : 'string'
			}, {
				name: 'date',
				label: 'Date',
				editable: false,
				cell: 'string'
			}, {
				name: 'lat',
				label: 'LAT',
				editable: false,
				cell: 'string',
			}, {
				name: 'lon',
				label: 'LON',
				editable: false,
				cell: 'string',
			}, {
				name: 'ele',
				label: 'ELE',
				editable: false,
				cell: 'string',
			},{
				name: 'speed',
				label: 'SPEED',
				editable: false,
				cell: 'string',
			}, {
				name: 'type',
				label: 'TYPE',
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
				com: this.com,
				pageSize: 20,
				url: config.coreUrl+'sensors/'+this.type_+'/uncheckedDatas/'+this.ind_id,
				urlParams : this.urlParams,
				rowClicked : false,
				totalElement : 'totalEntries',
			});
/*
			this.grid.rowClicked = function(row){
				_this.rowClicked(row);
			};
			this.grid.rowDbClicked = function(row){
				_this.rowDbClicked(row);
			};*/
			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());

		},

		initMap: function(geoJson){
			this.map = new NsMap({
				geoJson: geoJson,
				zoom: 4,
				element : 'map',
				popup: true,
				cluster: true
			});
		},

		displayMap: function(){
			var url  = config.coreUrl+ 'sensors/uncheckedDatas'+this.type_+'/'+this.ind_id+'?geo=true';
			console.log(url);
			$.ajax({
				url: url,
				contentType:'application/json',
				type:'GET',
				context: this,
			}).done(function(datas){
				this.initMap(datas);
			}).fail(function(msg){
				console.error(msg);
			});
		},

		displayForm : function(id){
			this.nsform = new NsForm({
				name: 'IndivForm',
				modelurl: config.coreUrl+'individual',
				buttonRegion: [],
				formRegion: this.ui.form,
				buttonRegion: [this.ui.formBtns],
				displayMode: 'display',
				objectType: 1,
				id: id,
				reloadAfterSave : false,
				parent: this.parent
			});
		},




	});
});
