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

	'./lyt-sensorValidateDetail'

], function($, _, Backbone, Marionette, Swal, Translater, config, NsGrid, Com, LytSensorValidateDetail){

	'use strict';

	return Marionette.LayoutView.extend({

		template: 'app/modules/validate/templates/tpl-sensorValidateType.html',
		className: 'full-height animated rel',

		events : {
			'click button#autoValidate' : 'autoValidate',
			'change select#frequency' : 'setFrequency',
			'click button#back' : 'back',
			'click button#hideDetail' : 'hideDetail',
		},

		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'frequency': 'select#frequency',
			'detail': '#detail',
		},

		regions: {
			'rgDetail' : '#detail'
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.type_ = options.type;
			this.com = new Com();
		},

		back: function(){
			Backbone.history.navigate('validate', {trigger: true});
		},

		hideDetail: function(){
			this.ui.detail.addClass('hidden');
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			this.ui.frequency.find('option[value="all"]').prop('selected', true);
			switch(this.type_){
				case 'rfid':
					this.ui.frequency.find('option[value="60"]').prop('selected', true);

					this.cols = [
						{
							name: 'UnicIdentifier',
							label: 'Unic Identifier',
							editable: false,
							cell : 'string'
						},{
							name: 'FK_Sensor',
							label: 'FK_Sensor',
							editable: false,
							renderable: false,
							cell : 'string'
						},{
							name: 'equipID',
							label: 'equipID',
							editable: false,
							renderable: false,
							cell : 'string'
						}, {
							name: 'site_name',
							label: 'site_name',
							editable: false,
							cell: 'string'
						}, {
							name: 'site_type',
							label: 'site_type',
							editable: false,
							cell: 'string',
						}, {
							name: 'StartDate',
							label: 'StartDate',
							editable: false,
							cell: 'string',
						}, {
							name: 'EndDate',
							label: 'EndDate',
							editable: false,
							cell: 'string',
						}, {
							name: 'nb_indiv',
							label: 'nb_indiv',
							editable: false,
							cell: 'string',
						},{
							name: 'total_scan',
							label: 'total_scan',
							editable: false,
							cell: 'string',
						},{
							name: 'max_date',
							label: 'max_date',
							editable: false,
							cell: 'string',
						},{
							name: 'min_date',
							label: 'min_date',
							editable: false,
							cell: 'string',
						}, {
							editable: true,
							name: 'import',
							label: 'IMPORT',
							cell: 'select-row',
							headerCell: 'select-all'
						}
					];
					break;
				case 'gsm':
					this.ui.frequency.find('option[value="60"]').prop('selected', true);
					this.cols = [

						{
							name: 'FK_Individual',
							label: 'Individual ID',
							editable: false,
							cell : 'string',
							formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
								fromRaw: function (rawValue, model) {
										if (rawValue==null) {
											rawValue='<span class="bull-warn">&#x25cf;</span> No Individual attached !';
										}
									 return rawValue;
								  }
							}),
						},{
							name: 'FK_Sensor',
							label: 'FK_Sensor',
							editable: false,
							cell : 'string'
						},{
							name: 'FK_ptt',
							label: 'Unic Identifier',
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
						}
					];
					break;
				case 'argos':
					this.ui.frequency.find('option[value="all"]').prop('selected', true);
					this.cols = [
						{
							name: 'FK_Individual',
							label: 'Individual ID',
							editable: false,
							cell : 'string',
							formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
								fromRaw: function (rawValue, model) {
										if (rawValue==null) {
											rawValue='<span class="bull-warn">&#x25cf;</span> No Individual attached !';
										}
									return rawValue;
								}
							}),
						},{
							name: 'FK_Sensor',
							label: 'Sensor',
							editable: false,
							renderable: false,
							cell : 'string'
						},{
							name: 'FK_ptt',
							label: 'Unic Identifier',
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
						}
					];
					break;
				default:
					console.warn('type error');
					break;
			}

			this.displayGrid();
			this.frequency = this.ui.frequency.val();
		},

		setFrequency: function(e){
			this.frequency = $(e.target).val();
		},

		displayGrid: function(){
			var _this = this;
			this.grid = new NsGrid({
				pagingServerSide: false,
				columns : this.cols,
				pageSize: 20,
				com: this.com,
				url: config.coreUrl+'sensors/'+this.type_+'/uncheckedDatas',
				rowClicked : true,
				totalElement : 'totalEntriesType',
				idCell: 'FK_Sensor'
			});

			this.grid.rowClicked = function(args){
				if(_this.type_ != 'rfid')
					_this.rowClicked(args);
			};

			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
		},

		rowClicked: function(args){
			var row = args.row;
			var evt = args.evt;


			if(!$(evt.target).is('input')){
				this.rgDetail.show(new LytSensorValidateDetail({
					type : this.type_,
					frequency: this.frequency,
					parentGrid: this.grid.collection.fullCollection,
					model : row.model,
					globalGrid : this.grid
				}));
				this.grid.currentRow = row;
				this.grid.upRowStyle();

				this.ui.detail.removeClass('hidden');
			}
		},

		autoValidate: function(){
			var params = {
				'frequency': this.frequency,
				'toValidate': []
			};
			var tmp = {};
			if(!this.grid.grid.getSelectedModels().length){
				return;
			}

			if(this.type_ == 'rfid'){
				_.each(this.grid.grid.getSelectedModels(), function(model){
					params.toValidate.push({
						'equipID': model.get('equipID'),
						'FK_Sensor': model.get('FK_Sensor')
					});
				});
			}else{
				_.each(this.grid.grid.getSelectedModels(), function(model){
					params.toValidate.push({
						'FK_Individual': model.get('FK_Individual'),
						'FK_ptt': model.get('FK_ptt')
					});
				});
			}

			params.toValidate = JSON.stringify(params.toValidate);
			var url = config.coreUrl + 'sensors/' + this.type_ + '/uncheckedDatas';
			$.ajax({
				url: url,
				method: 'POST',
				data : params,
				context: this
			}).done(function(resp) {
				resp.title='Succes';
				this.swal(resp, 'success');
				this.displayGrid();
			}).fail(function(resp) {
				this.swal(resp, 'error');
			});
		},

		swal: function(opt, type){
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
				title: opt.title || 'error',
				text: opt.text || '',
				type: type,
				showCancelButton: false,
				confirmButtonColor: btnColor,
				confirmButtonText: 'OK',
				closeOnConfirm: true,
			},
			function(isConfirm){
			});
		},

	});
});
