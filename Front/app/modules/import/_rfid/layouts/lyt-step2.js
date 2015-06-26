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
	//'modules/rfid/layouts/rfid-deploy',
	//'modules/rfid/views/rfid-map',
	
], function($, _, Backbone, Marionette, config, Radio, swal,
	Step, NSGrid,
	Backgrid
	// DeployRFID, Map
){
	'use strict';

	return Step.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		collection: new Backbone.Collection(),
		className: 'import-container-rfid container',
		template: 'app/modules/import/_rfid/templates/tpl-step2.html',

		events: {
			/*'click .finished': 'importFile',*/
			'click #input-file': 'clear',
		
		},

		ui: {
			progress: '.progress',
			progressBar: '.progress-bar',
			fileHelper: '#help-file',
			fileGroup: '#group-file',
			modHelper: '#help-mod',
			modGroup: '#group-mod',
			modInput: '#input-mod'
		},

		onDestroy: function(){
		   
		},
		initModel: function() {
		   /*this.deploy_rfid = new DeployRFID();*/
 
			this.parseOneTpl(this.template);
			var obj={name : this.name + '_fileName',required : true};
			this.stepAttributes = [obj] ;
			
		},
		onShow : function() {
		
		},
		importFile: function(event) {
		 /*   event.stopPropagation();
			event.preventDefault();*/
			this.clear();

			var module = this.ui.modInput.val();

			if( module !== '') {

				var reader = new FileReader();
				var file = $('#input-file').get(0).files[0] || null;
				var url = config.coreUrl + 'rfid/import';
				var data = new FormData();
				var self = this;

				reader.onprogress = function(data) {
					if (data.lengthComputable) {
						var progress = parseInt(data.loaded / data.total * 100).toString();
						self.ui.progressBar.width(progress + '%');
					   
					}
				};

				reader.onload = function(e, fileName) {
					data.append('data', e.target.result);
					data.append('module', self.model.get(self.parent.steps[self.parent.currentStep-1].name+'_RFID_identifer'));
					$.ajax({
						type: 'POST',
						url: url,
						data: data,
						processData: false,
						contentType: false
					}).done(function(data) {
						$('#btnNext').removeAttr('disabled');
						 
						self.ui.progressBar.css({'background-color':'green'})
						swal(
							{
							  title: "Succes",
							  text: data,
							  type: 'success',
							  showCancelButton: true,
							  confirmButtonColor: 'green',
							  confirmButtonText: "Import new RFID",
							  cancelButtonText: "Go to Validate",
							  closeOnConfirm: true,
							 
							},
							function(isConfirm){
								self.ui.progress.hide();
								if (isConfirm) {
									Radio.channel('route').command('import:rfid',{});
								}
								else {
									Radio.channel('route').command('validate:type','rfid');
								}
							}
						);
						


					}).fail( function(data) {
						
						console.error(data);
						$('#btnNext').attr('disabled');
						if (data.status == 500 || data.status == 510  ) {
							var type = 'warning';
							var title = "Warning !"
							self.ui.progressBar.css({'background-color':'rgb(218, 146, 15)'})
							var color = 'rgb(218, 146, 15)';
						}
						else {
							var type = 'error';
							var title = "Error !"
							self.ui.progressBar.css({'background-color':'rgb(147, 14, 14)'})
							var color = 'rgb(147, 14, 14)';
							

						 }
						 if (data.responseText.length > 100) {
							data.responseText = 'An error occured, please contact an admninstrator';
						 }
						swal(
							{
							  title: title,
							  text: data.responseText,
							  type: type,
							  showCancelButton: false,
							  confirmButtonColor: color,
							  confirmButtonText: "OK",
				
							  closeOnConfirm: true,
							 
							},
							function(isConfirm){
								self.ui.progress.hide();
							}
						);
					});
				};

				if(file) {
					this.clear();
					this.ui.progress.show();
					reader.readAsText(file);
				}
				else {
					this.ui.fileGroup.addClass('has-error');
					this.ui.fileHelper.text('Required');
				}
			}
			else {
				this.ui.modGroup.addClass('has-error');
				this.ui.modHelper.text('Required');
			}
		},

		clear: function() {
			this.ui.progressBar.width('0%');
			this.ui.progress.hide();
			this.ui.fileHelper.text('');
			this.ui.fileGroup.removeClass('has-error');
			this.ui.modHelper.text('');
			this.ui.modGroup.removeClass('has-error');
		},
	 
	});

});
