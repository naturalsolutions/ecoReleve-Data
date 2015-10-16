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
	'moment'
], function($, _, Backbone, Marionette, Swal, Translater, config, NsGrid, Com, NsMap, NsForm, moment){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/validate/templates/tpl-sensorValidateDetail.html',
		className: 'full-height animated white',

		events : {
			'click button#autoValidate' : 'autoValidate',
			'change select#frequency' : 'setFrequency',
			'click table.backgrid td.select-row-cell input[type=checkbox]' : 'checkSelect',
			'click table.backgrid th input' : 'checkSelectAll',
			'click button#validate' : 'validate',
			'click button#back' : 'back',
			'change select#frequency' : 'updateFrequency'
		},

		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'totalEntries': '#totalEntries',
			'map':'#map',
			'indForm': '#indForm',
			'sensorForm': '#sensorForm',
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.type = options.type;
			this.indId = parseInt(options.indId);
			this.sensorId = parseInt(options.sensorId);
			this.com = new Com();
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			this.displayGrid();
			this.displayMap();
			this.displayIndForm();
			//this.displaySensorForm();
		},

		setFrequency: function(e){
			this.frequency = $(e.target).val();
		},

		displayGrid: function(){
			var myCell = Backgrid.NumberCell.extend({
				decimals: 5,
				orderSeparator: ' ',
			});

			var cols = [{
				name: 'PK_id',
				label: 'PK_id',
				editable: false,
				renderable: false,
				cell: 'string',
			}, {
				name: 'date',
				label: 'DATE',
				editable: false,
				cell: 'string'
			}, {
				editable: false,
				name: 'lat',
				label: 'LAT',
				cell: myCell,
			}, {
				editable: false,
				name: 'lon',
				label: 'LON',
				cell: myCell,
			}, {
				editable: false,
				name: 'ele',
				label: 'ELE (m)',
				cell: Backgrid.IntegerCell.extend({
					orderSeparator: ''
				}),
			}, {
				editable: false,
				name: 'dist',
				label: 'DIST (km)',
				cell: myCell,
			}, {
				editable: false,
				name: 'speed',
				label: 'SPEED (km/h)',
				cell: myCell,
				formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
					fromRaw: function (rawValue, model) {
							if (rawValue=='NaN') {
								rawValue=0;
							}
						return rawValue;
					}
				}),
			},{
				name: 'type_',
				label: 'Type',
				renderable : this.showTypeCol,
				editable: false,
				formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
					fromRaw: function (rawValue, model) {
							if (rawValue=='arg') {
								rawValue='Argos';
							}
							else {
								rawValue = 'GPS'
							}
						 return rawValue;
					}
				}),
				cell: 'string'
			}, {
				editable: true,
				name: 'import',
				label: 'IMPORT',
				cell: 'select-row',
				headerCell: 'select-all'
			}];

			var url = config.coreUrl + 'sensors/' + this.type
			+ '/uncheckedDatas/' + this.indId + '/' + this.sensorId;
			this.grid = new NsGrid({
				pagingServerSide: false,
				columns : cols,
				com: this.com,
				pageSize: 20,
				url: url,
				urlParams : this.urlParams,
				rowClicked : false,
				totalElement : 'totalEntries',
			});

			this.grid.selectOne = function (id) {
				var model_id = id;
				var coll = new Backbone.Collection();
				coll.reset(this.grid.collection.models);

				model_id = parseInt(model_id);
				var mod = coll.findWhere({ PK_id: model_id });

				if (mod.get('import')) {
					mod.set('import', false);
					mod.trigger("backgrid:select", mod, false);
				} else {
					mod.set('import', true);
					mod.trigger("backgrid:select", mod, true);
				}
			};

			this.grid.selectMultiple = function (ids) {
				var model_ids = ids, self = this, mod;
				for (var i = 0; i < model_ids.length; i++) {
					mod = this.grid.collection.findWhere({ PK_id: model_ids[i] });
					mod.set('import', true);
					mod.trigger("backgrid:select", mod, true);
				};
			};

			
			this.grid.rowClicked = function(row){
				_this.rowClicked(row);
			};
			this.grid.rowDbClicked = function(row){
				_this.rowDbClicked(row);
			};


			this.grid.clearAll = function () {
				var coll = new Backbone.Collection();
				coll.reset(this.grid.collection.models);
				for (var i = coll.models.length - 1; i >= 0; i--) {
					coll.models[i].attributes.import = false;
				};

				var collection = this.grid.collection;
				collection.each(function (model) {

					model.trigger("backgrid:select", model, false);
				});
			},


			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
		},


		//should be in the grid module
		checkSelect: function (e) {
			var id = $(e.target).parent().parent().find('td').html();
			this.grid.interaction('selection', id);
		},

		checkSelectAll: function (e) {
			var ids = _.pluck(this.grid.collection.models, 'PK_id');
			var ids = this.grid.collection.pluck('PK_id');
			if (!$(e.target).is(':checked')) {
				this.grid.interaction('resetAll', ids);
			} else {
				this.grid.interaction('selectionMultiple', ids);
			}
		},

		displayMap: function(){
			var url = config.coreUrl + 'sensors/' + this.type
			+ '/uncheckedDatas/' + this.indId + '/' + this.sensorId + '?geo=true';
			this.map = new NsMap({
				url: url,
				selection: true,
				cluster: true,
				com: this.com,
				zoom: 3,
				element : 'map',
				bbox: true
			});
		},

		displayIndForm : function(){
			this.nsform = new NsForm({
				name: 'IndivForm',
				buttonRegion: [this.ui.btn],
				modelurl: config.coreUrl +'individuals',
				formRegion: this.ui.indForm,
				displayMode: 'display',
				id: this.indId,
				reloadAfterSave : false,
			});
		},

		displaySensorForm: function() {
			this.nsform = new NsForm({
				name: 'sensorForm',
				buttonRegion: [this.ui.btn],
				modelurl: config.coreUrl + 'sensors',
				formRegion: this.ui.sensorForm,
				displayMode: 'display',
				id: this.sensorId,
				reloadAfterSave : false,
			});
		},


		roundDate : function (date, duration) { 
			return moment(Math.floor((+date)/(+duration)) * (+duration));
		},

		perHour: function(frequency) {
			this.grid.interaction('resetAll');
			var _this = this;
			var origin = this.grid.grid.collection.fullCollection.clone();
			frequency = parseInt(frequency);


			if (frequency !='all'){
				var col0 = origin.at(0);
				var date = new moment(col0.get('date'));
				var groups = origin.groupBy(function(model){
					var curr = new moment(model.get('date'));
					return _this.roundDate( curr, moment.duration(frequency, 'minutes') );
				});

				var ids =[];
				var i =0;

				for (var rangeDate in groups) {
					var tmp = groups[rangeDate][0].get('PK_id');
					ids.push(tmp);
				}
					this.grid.interaction('selectionMultiple', ids);
				} else {

				}
		},

		updateFrequency: function(e){
			var frequency = $(e.target).val();
			if(!isNaN(frequency))
			this.perHour(frequency);
		},

		validate: function(){
			var url = config.coreUrl + 'sensors/' + this.type
			+ '/uncheckedDatas/' + this.indId + '/' + this.sensorId;
			var mds = this.grid.grid.getSelectedModels();
			var col = new Backbone.Collection(mds);
			var params = col.pluck('PK_id');

			$.ajax({
				url: url,
				method: 'POST',
				data : { data : JSON.stringify(params) }
			});
		},

		back: function(){
			Backbone.history.history.back();
		}

	});
});
