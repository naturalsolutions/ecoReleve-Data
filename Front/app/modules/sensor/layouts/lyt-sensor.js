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
	'./lyt-sensor-details',

], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter, SensorDetails

){

	'use strict';

	return Marionette.LayoutView.extend({

		template: 'app/modules/sensor/templates/tpl-sensor.html',
		className: 'full-height animated white rel',

		events : {
			'click #btnFilter' : 'filter',
			'click #back' : 'hideDetails',
			'click button#clear' : 'clearFilter',
			'change select.FK_SensorType' : 'updateModels',
			'click #btn-export' : 'exportGrid',
			'click button#btnNew' : 'newSensor'
		},

		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'filter': '#filter',
			'detail': '#detail',
			'btnNew': '#btnNew'
		},

		regions: {
			detail : '#detail',
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
			if(this.options.id){
				this.detail.show(new LytSensorDetail({id : this.options.id}));
				this.ui.detail.removeClass('hidden');
			}

		},

		displayGrid: function(){
			var _this = this;
			this.grid = new NsGrid({
				pageSize: 13,
				pagingServerSide: true,
				com: this.com,
				url: config.coreUrl+'sensors/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'totalEntries',
				onceFetched: function(params){
					var listPro = {};
					var idList  = [];
					this.collection.each(function(model){
						idList.push(model.get('ID'));
					});
					idList.sort();
					listPro.idList = idList;
					listPro.minId = idList[0];
					listPro.maxId = idList [(idList.length - 1)];
					listPro.state = this.collection.state;
					listPro.criteria = $.parseJSON(params.criteria);
					window.app.listProperties = listPro ;
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

		newSensor: function(e){
			this.ui.btnNew.tooltipList({
					availableOptions : [{
							label : 'Argos',
							val : 'argos'
					}, {
							label : 'GSM',
							val : 'gsm'
					},{
						label : 'RFID',
						val : 'rfid'
					},{
						label : 'VHF',
						val : 'vhf'
					}],
					liClickEvent : function(liClickValue) {
							Backbone.history.navigate('#sensor/new/' + liClickValue, {trigger: true});
					},
					position: 'top'
			});
		},

		displayFilter: function(){
			this.filters = new NsFilter({
				url: config.coreUrl + 'sensors/',
				com: this.com,
				filterContainer: this.ui.filter,
			});
		},

		filter: function(){
			this.filters.update();
		},
		clearFilter : function(){
			this.filters.reset();
		},
		rowClicked: function(row){
			this.detail.show(new SensorDetails({
				model : row.model,
				globalGrid: this.grid
			}));
			this.ui.detail.removeClass('hidden');
			this.grid.currentRow = row;
			this.grid.upRowStyle();
			//Backbone.history.navigate('sensor/'+id, {trigger: false})
		},

		rowDbClicked: function(row){
		},

		hideDetails : function(){
			this.ui.detail.addClass('hidden');
		},
		updateModels : function(e){
			// get list of models for selected sensor type
			var selectedType = $(e.target).val();
			var modelField = $('select.Model');
			var url  = config.coreUrl + 'sensors/getModels?sensorType=' + selectedType;
			$.ajax({
				url: url,
				context: this,
				}).done(function(data) {
					this.updateField(data,modelField);
				}
			);
			this.updateCompany(selectedType);
			this.updateSerialNumber(selectedType);
		},
		updateCompany : function(selectedType){
			var companyField = $('select.Compagny');
			var url  = config.coreUrl + 'sensors/getCompany?sensorType=' + selectedType;
			$.ajax({
				url: url,
				context: this,
				}).done(function(data) {
					this.updateField(data,companyField);
				}
			);
		},
		updateSerialNumber : function(selectedType){
			var serialNbField = $('select.SerialNumber');
			var url  = config.coreUrl + 'sensors/getSerialNumber?sensorType=' + selectedType;
			$.ajax({
				url: url,
				context: this,
				}).done(function(data) {
					this.updateField(data,serialNbField);
				}
			);
		},
		updateField : function(data, elem){
			var content = '<option></option>';
			for (var i=0;i<data.length;i++){
				content += '<option>'+ data[i] +'</option>';
			}
			$(elem).html(content);
		},

		exportGrid: function() {
			$.ajax({
					url: config.coreUrl + 'sensors/export',
					data: JSON.stringify({criteria:this.filters.criterias}),
					contentType:'application/json',
					type:'POST'
			}).done(function(data) {
					var url = URL.createObjectURL(new Blob([data], {'type':'text/csv'}));
					var link = document.createElement('a');
					link.href = url;
					link.download = 'sensors_export.csv';
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
			});
		},


	});
});
