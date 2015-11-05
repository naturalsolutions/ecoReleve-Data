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
	'SensorPicker',
	'requirejs-text!modules/release/templates/tpl-sensor-picker.html',

], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter, SensorPicker,tplSensorPicker
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/release/templates/tpl-release-individual.html',
		className: 'full-height animated white rel',

		events : {
			'click #btnFilter' : 'filter',
			'click #back' : 'hideDetails',
			'click button#clear' : 'clearFilter',
			'click #release' : 'toolTipShow',
			'click #addSensor' : 'addSensor',
		},

		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'filters': '#indiv_filters',
			'detail': '#detail',
			'totalEntries': '#totalEntries',
			'nbSelected': '#nbSelected'
		},

		regions: {
			modal : '#modal',
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.com = new Com();
			this.station = options.station;
			this.releaseMethod = null;

			var _this = this;
			var mySensorPicker = SensorPicker.extend({
				initialize: function(options) {
					var template =  _.template(tplSensorPicker);
					this.$el.html(template);
					this.com = new Com();
					this.displayGrid();
					this.displayFilter();
					this.translater = Translater.getTranslater();
				},
				rowClicked: function(row){
					var id = row.model.get('ID');
					var unicName = row.model.get('UnicIdentifier');
					_this.currentRow.model.set({unicSensorName:unicName});
					this.setValue(id);
				},
				getValue: function() {
				},
				setValue: function(value) {
					_this.currentRow.model.set({FK_Sensor:value});
					console.log(_this.currentRow.model)
					this.hidePicker();
				},
			});
			this.sensorPicker = new mySensorPicker();
			this.sensorPicker.render();

			this.initGrid();
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			this.displayFilter();
			this.displayGrid(); 
			Backbone.history.navigate('release/individuals',{trigger:false});
		},

		initGrid:function(){
			var myGrid = NsGrid.extend({
			});

			var _this = this;
			this.grid = new myGrid({
				pageSize: 1400,
				pagingServerSide: false,
				com: this.com,
				url: config.coreUrl+'release/individuals/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'totalEntries',
				onceFetched: function(params){
					_this.totalEntries(this.grid);
				}
			});
			this.grid.rowClicked = function(args){
				_this.rowClicked(args.row);
			};
			this.grid.rowDbClicked = function(args){
				_this.rowDbClicked(args.row);
			};

			this.grid.collection.on('backgrid:selected', function(model, selected) { 
				_this.updateSelectedRow();
			});
		},

		displayGrid: function(){
			
			this.ui.grid.html(this.grid.displayGrid());
/*			this.ui.paginator.html(this.grid.displayPaginator());*/
		},

		displayFilter: function(){
			this.filters = new NsFilter({
				url: config.coreUrl + 'release/individuals/',
				com: this.com,
				filterContainer: this.ui.filters,
			});
		},

		rowClicked: function(row){
			if(this.currentRow){
				this.currentRow.$el.removeClass('active');
			}
			row.$el.addClass('active');
			this.currentRow = row;
		},

		rowDbClicked:function(row){
			this.currentRow = row;
			var curModel = row.model;
			curModel.trigger("backgrid:select", curModel, true);

		},
		updateSelectedRow:function(){
			var mds = this.grid.grid.getSelectedModels();
			var nbSelected = mds.length;
			this.$el.find(this.ui.nbSelected).html(nbSelected);
		},

		filter: function(){
			this.filters.update();
		},

		clearFilter : function(){
			this.filters.reset();
		},

		totalEntries: function(grid){
			this.total = grid.collection.state.totalRecords;
			$(this.ui.totalEntries).html(this.total);
		},
		release:function(){
			var mds = this.grid.grid.getSelectedModels();
			if(!mds.length){
				return;
			}
			var _this = this;
			var col = new Backbone.Collection(mds);
			$.ajax({
				url: config.coreUrl + 'release/individuals/',
				method: 'POST',
				data : { IndividualList : JSON.stringify(col),StationID:this.station.get('ID'),releaseMethod: _this.releaseMethod },
				context: this,
			}).done(function(resp) {
				if(resp.errors){
					resp.title = 'An error occured';
					resp.type = 'error';
				}else{
					resp.title = 'Success';
					resp.type = 'success';
					
				}
				resp.text = 'release: ' + resp.release;

				//remove the model from the coll once this one is validated
				var callback = function(){
					Backbone.history.navigate('station/'+_this.station.get('ID'), {trigger: true});
					//$('#back').click();
				};
				this.swal(resp, resp.type, callback);

			}).fail(function(resp) {
				this.swal(resp, 'error');
			});
		},

		addSensor:function(){
			this.modal.show(this.sensorPicker);
			this.sensorPicker.showPicker();
		},

		hidePicker:function(){
			this.sensorPicker.hidePicker();
		},

		swal: function(opt, type, callback){
			var btnColor;
			switch(type){
				case 'success':
					btnColor = 'green';
					break;
				case 'error':
					btnColor = 'rgb(147, 14, 14)';
					break;
				case 'warning':
					btnColor = 'orange';
					break;
				default:
					return;
					break;
			}
			
			Swal({
				title: opt.title || opt.responseText || 'error',
				text: opt.text || '',
				type: type,
				showCancelButton: true,
				confirmButtonColor: btnColor,
				confirmButtonText: 'See Station',
				cancelButtonColor: 'grey',
				cancelButtonText: 'New Release',
				closeOnConfirm: true,
			},
			function(isConfirm){
				//could be better
				if(isConfirm && callback){
					callback();
				}else{
					Backbone.history.navigate('release', {trigger: true});
				}
			});
		},

		toolTipShow:function(e){
			var _this = this;
			$(e.target).tooltipList({

                position: 'top',
                //  pass avalaible options
                availableOptions: [{'label':'direct release','val':1},{'label':'direct release grid 5x5','val':2},],
                //  li click event
                liClickEvent: $.proxy(function (liClickValue, origin, tooltip) {
                console.log(liClickValue);
                _this.releaseMethod = liClickValue;
                _this.release();
                //console.log(origin);
                }, this),
            });
            $(e.target).tooltipster('show');
		}
	});
});
