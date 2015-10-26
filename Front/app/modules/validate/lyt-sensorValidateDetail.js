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
	'moment',
	'ns_navbar/ns_navbar'

], function($, _, Backbone, Marionette, Swal, Translater,
 config, NsGrid, Com, NsMap, NsForm, moment, Navbar){

	'use strict';

	return Marionette.LayoutView.extend({
		template: 'app/modules/validate/templates/tpl-sensorValidateDetail.html',
		
		className: 'full-height animated white',
		
		events: {
			'click button#autoValidate' : 'autoValidate',
			'click table.backgrid td.select-row-cell input[type=checkbox]' : 'checkSelect',
			'click table.backgrid th input' : 'checkSelectAll',
			'click button#validate' : 'validate',
			'change select#frequency' : 'updateFrequency'
		},

		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'totalEntries': '#totalEntries',
			'map':'#map',
			'indForm': '#indForm',
			'sensorForm': '#sensorForm',
			'frequency': 'select#frequency',

			'dataSetIndex': '#dataSetIndex',
			'dataSetTotal': '#dataSetTotal',
		},
		
		regions: {
			'rgNavbar': '#navbar'
		},
		
		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.type = options.type;


			this.com = new Com();
			this.model = options.model;

			this.indId = this.model.get('FK_Individual');
			this.pttId = this.model.get('FK_ptt');
			this.sensorId = this.model.get('FK_Sensor');

			this.frequency = options.frequency;



			this.navbar = new Navbar({
				parent: this,
				globalGrid: options.globalGrid,
				model: this.model,
			});
		},

		onRender: function(){
			this.$el.i18n();
		},

		reloadFromNavbar: function(model){
			this.model = model;
			this.pttId = model.get('FK_ptt');
			this.indId = model.get('FK_Individual');
			this.com = new Com();
			this.map.destroy();
			this.ui.map.html('');
			this.display();
		},

		onShow : function(){
			this.rgNavbar.show(this.navbar);
			this.display();
		},

		display: function(){
			var _this = this;
			if(this.indId == 'null' || !this.indId) this.indId = 'none';
			if(this.indId == 'none'){
				this.swal({ title : 'No individual attached'}, 'warning');
				this.ui.indForm.html('<span class="bull-warn">●</span>No individual is attached');
			}else{
				this.displayIndForm();
			}
			this.displayGrid();
			this.displayMap();
			this.displaySensorForm();

			$.when( this.map.deffered, this.grid.deffered ).done( function() {
				setTimeout(function(){
					_this.initFrequency();
				},100)
			});
		},


		//initialize the frequency
		initFrequency: function(){
			if(this.frequency && this.frequency != 'all'){
				this.ui.frequency.find('option[value="' + this.frequency + '"]').prop('selected', true);
			}else{
				this.frequency = this.ui.frequency.val();
			}


			this.perHour(this.frequency);

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
							else{
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
			+ '/uncheckedDatas/' + this.indId + '/' + this.pttId;
			this.grid = new NsGrid({
				pagingServerSide: false,
				columns : cols,
				com: this.com,
				pageSize: 1000,
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
					mod.trigger("backgrid:select", mod, true);
					mod.set('import', true);
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
			+ '/uncheckedDatas/' + this.indId + '/' + this.pttId + '?geo=true';
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
			var _this = this;
			var url = config.coreUrl + 'sensors/' + this.type
			+ '/uncheckedDatas/' + this.indId + '/' + this.pttId;
			var mds = this.grid.grid.getSelectedModels();
			if(!mds.length){
				return;
			}

			var col = new Backbone.Collection(mds);
			var params = col.pluck('PK_id');
			$.ajax({
				url: url,
				method: 'POST',
				data : { data : JSON.stringify(params) },
				context: this,
			}).done(function(resp) {
				if(resp.errors){
					resp.title = 'An error occured';
					resp.type = 'error';
				}else{
					resp.title = 'Success';
					resp.type = 'success';
					
				}
				resp.text = 'existing: ' + resp.existing + ', inserted: ' + resp.inserted + ', errors:' + resp.errors;

				//remove the model from the coll once this one is validated
				var md = this.coll.at(this.dataSetIndex);
				this.coll.remove(md);
				
				this.dataSetIndex--;

				var callback = function(){
					//prevent successive event handler
					setTimeout(function(){
						_this.nextDataSet();
					}, 500);
				};
				this.swal(resp, resp.type, callback);


			}).fail(function(resp) {
				this.swal(resp, 'error');
			});
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
				showCancelButton: false,
				confirmButtonColor: btnColor,
				confirmButtonText: 'OK',
				closeOnConfirm: true,
			},
			function(isConfirm){
				//could be better
				if(callback){
					callback();
				}
			});
		},
	
	});
});
