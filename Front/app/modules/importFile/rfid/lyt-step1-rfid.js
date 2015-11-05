define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'backgrid',
	'config',
	'ns_stepper/lyt-step',
	'ns_grid/model-grid',
	'i18n'

], function($, _, Backbone, Marionette, Swal, Backgrid, config,
	Step, NsGrid
){

	'use strict';

	return Marionette.LayoutView.extend({
		className: 'full-height', 
		template: 'app/modules/importFile/rfid/templates/tpl-step1-rfid.html',

		name : 'RFID decoder selection',
		events: {
			'change #rfidId' : 'updateGrid',
		},
		ui : {
			'grid': '#grid',
			'paginator': '#paginator',
		},
		initialize: function(options){
			this.model = new Backbone.Model();
		},

		check: function(){
		},

		onShow : function(){

			//this.parseOneTpl(this.template);
			var obj={name : this.name + '_RFID_identifer',required : true};
			this.stepAttributes = [obj] ;

			var content ='';
			var self = this;
			$.ajax({
				context: this,
				url: config.coreUrl + 'sensors/getUnicIdentifier',
				data: {sensorType : 3},
			}).done( function(data) {
				var len = data.length;
				var firstId = data[0]['val'];
				for (var i = 0; i < len; i++) {
					var label = data[i]['label'];
					var val = data[i]['val'];
					content += '<option value="' + val +'">'+ label +'</option>';
				}
				$('select[name="RFID_identifer"]').append(content);
				this.initGrid(firstId);
				//this.feedTpl() ;
			})
			.fail( function() {
				alert("error loading items, please check connexion to webservice");
			});
		},

		onDestroy: function(){
		},


		validate: function(){

		},
		updateGrid : function(e){
			var id = $(e.target).val();
			this.grid.collection.url = config.coreUrl + 'sensors/'+ id +'/history';
			this.grid.fetchCollection();
			this.model.set('sensorId', id )
			$('#btnNext').removeAttr('disabled');

		},
		initGrid : function(id){
			var _this = this;
			var columns = [{
				name: 'ID',
				label: 'ID',
				editable: false,
				renderable : false,
				cell: Backgrid.IntegerCell.extend({
					orderSeparator: ''
				}),
			},{
				name: 'UnicIdentifier',
				label: 'Identifier',
				editable: false,
				cell: 'string',
				
			},{
				name: 'StartDate',
				label: 'Start date',
				editable: false,
				cell: 'String',
			},{
				name: 'Name',
				label: 'Site Name',
				editable: false,
				cell: 'string',
			},{
				name: 'Deploy',
				label: 'Deploy',
				editable: false,
				cell: 'string',
			}];
			this.grid= new NsGrid({
				columns: columns,
				url: config.coreUrl + 'sensors/'+ id +'/history',
				pageSize : 20,
				pagingServerSide : false,
				rowClicked : true,
			});
			this.grid.rowClicked = function(args){
					//_this.rowClicked(args.row);
			};
			this.grid.rowDbClicked = function(args){
				//_this.rowClicked(args.row);
			};
			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
		},
		rowClicked : function(row){
			//console.log(row.model.get('ID'));
			//this.model.set('sensorId',row.model.get('ID') )
			//this.validate();
			//$('#btnNext').removeAttr('disabled');
			//this.nextOK();
		},
		validate : function(){
			return this.model;
		}
	});
});
