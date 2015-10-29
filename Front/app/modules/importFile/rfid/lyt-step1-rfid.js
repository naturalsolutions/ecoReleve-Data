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

		initialize: function(){
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
				self.SensorID = data[0]['val'];
				for (var i = 0; i < len; i++) {
					var label = data[i]['label'];
					var val = data[i]['val'];
					content += '<option value="' + val +'">'+ label +'</option>';
				}
				$('select[name="RFID_identifer"]').append(content);
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
		updateGrid : function(){
						var columns = [{
				name: 'PK_obj',
				label: 'ID',
				editable: false,
				renderable : false,
				cell: Backgrid.IntegerCell.extend({
					orderSeparator: ''
				}),
			},{
				name: 'identifier',
				label: 'Identifier',
				editable: false,
				cell: 'string',
				
			},{
				name: 'begin_date',
				label: 'Begin date',
				editable: false,
				cell: 'String',
			},{
				name: 'end_date',
				label: 'End date',
				editable: false,
				cell: 'String',
			},{
				name: 'Name',
				label: 'Site Name',
				editable: false,
				cell: 'string',
			},{
				name: 'name_Type',
				label: 'Site Type',
				editable: false,
				cell: 'string',
			}];
			this.grid= new NsGrid({
				columns: columns,
				url: config.coreUrl + 'sensors/'+this.SensorID+'/history',
				pageSize : 20,
				pagingServerSide : false,
			});
			this.$el.find('#grid').html(this.grid.displayGrid());
			this.$el.find('#paginator').html('').prepend(this.grid.displayPaginator());
		}



	});
});
