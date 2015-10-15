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

		template: 'app/modules/validate/templates/tpl-sensorValidateType.html',
		className: 'full-height animated',

		events : {
			'click button#autoValidate' : 'autoValidate',
			'change select#frequency' : 'setFrequency',
			'click button#back' : 'back',
		},

		ui: {
			'grid': '#grid',
			'totalEntries': '#totalEntries',
			'frequency': 'select#frequency',
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.type_ = options.type;
			this.com = new Com();
		},

		back: function(){
			Backbone.history.history.back();
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			this.displayGrid();
			this.frequency = this.ui.frequency.val();
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
			},{
				name: 'FK_ptt',
				label: 'Unique',
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
				pageSize: 100,
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

		rowClicked: function(args){
			var row = args.row;
			var evt = args.evt;

			var id = row.model.get('FK_Individual');
			var ptt = row.model.get('FK_ptt');


			if(!$(evt.target).is('input')){
				if(id == null) id = 'none';

				Backbone.history.navigate('validate/' + this.type_ + '/' + id + '/' + ptt, {trigger: true});
			}
		},

		autoValidate: function(){
			var params = {
				'frequency': this.frequency,
				'toValidate': []
			};
			var tmp = {};
			_.each(this.grid.grid.getSelectedModels(), function(model){
				params.toValidate.push({
					'FK_Individual': model.get('FK_Individual'),
					'FK_ptt': model.get('FK_ptt')
				});
			});

			params.toValidate = JSON.stringify(params.toValidate);
			var url = config.coreUrl + 'sensors/' + this.type_ + '/uncheckedDatas';
			$.ajax({
				url: url,
				method: 'POST',
				data : params,
				context: this
			}).done(function(resp) {
				this.swal(resp);
				this.displayGrid();
			}).fail(function() {
				this.swal(resp);
			});
		},


		swal: function(opt){
			if(opt.errors){
				opt.title = 'An error occured';
				opt.type = 'error';
				opt.color = 'rgb(147, 14, 14)';
			}else{
				opt.title = 'Success';
				opt.type = 'success';
				opt.color = 'green';
			}
			Swal({
				title: opt.title,
				text: 'existing: ' + opt.existing + ', inserted: ' + opt.inserted + ', errors:' + opt.errors,
				type: opt.type,
				showCancelButton: false,
				confirmButtonColor: opt.color,
				confirmButtonText: 'OK',
				closeOnConfirm: true,
			},
			function(isConfirm){

			});
		},

	});
});
