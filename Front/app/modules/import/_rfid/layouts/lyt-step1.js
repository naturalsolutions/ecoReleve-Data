define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'radio',
	'sweetAlert',

	'ns_stepper/lyt-step',
	'ns_grid/model-grid',

	'backgrid',

	//'app/modules/rfid/layouts/rfid-deploy',
], function(
	$, _, Backbone, Marionette, config, Radio, swal,
	Step, NSGrid, Backgrid
	//DeployRFID
){
	'use strict';

	return Step.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/
		//className: 'import-container-rfid container',
		regions:{
			modal : '#rfid-Modal'
		},

		template: 'app/modules/import/_rfid/templates/tpl-step1.html',

		events: _.extend({},Step.prototype.events, {
			'change #input-mod' : 'updateGrid',
			'click #deploy_remove' : 'deployRFID',
		}),

		onShow: function(){
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
			this.grid= new NSGrid({
				columns: columns,
				url: config.coreUrl + 'rfid/pose/',
				pageSize : 20,
				pagingServerSide : false,
			});
			//this.parseOneTpl(this.template);
			var obj={name : this.name + '_RFID_identifer',required : true};
			this.stepAttributes = [obj] ;

			var content ='';
			$.ajax({
				context: this,
				url: config.coreUrl + 'rfid',
			}).done( function(data) {
				var len = data.length;
				for (var i = 0; i < len; i++) {
					var label = data[i].identifier;
					content += '<option value="' + label +'">'+ label +'</option>';
				}
				$('select[name="RFID_identifer"]').append(content);
				this.feedTpl() ;
			})
			.fail( function() {
				alert("error loading items, please check connexion to webservice");
			});

			this.$el.find('#rfid-grid').html(this.grid.displayGrid());
			this.$el.find('#paginator').prepend(this.grid.displayPaginator());
		},

		updateGrid: function(){
			var data = new Backbone.Model();
			data.filters = [{'Column':'identifier','Operator':'=','Value':$('#input-mod').val()}];
			this.radio.command('rfid_pose:grid:update',data);
		},

		deployRFID: function(){
			Radio.channel('route').command('site:deploy',{back_module:'import:rfid'});
			Radio.channel('route').command('route:header',{route:'Manual import',child_route: 'RFID', route_url:'import', child_route_url:'rfid'});
		}
	});


});
