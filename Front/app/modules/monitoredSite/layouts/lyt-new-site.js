define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',
	'config',
	'ns_modules/ns_com',
	'ns_form/NSFormsModuleGit',
	'sweetAlert',
], function($, _, Backbone, Marionette, Swal, Translater, config, Com,  NsForm,swal){

	'use strict';
		return Marionette.ItemView.extend({
			template: 'app/modules/monitoredSite/templates/tpl-site-new.html',
			className: 'white full-height',

			ui : {
				'form': '#form',
				'btnform' : '#btnform'
			},
			events : {
				'click button.back' : 'removeThis',
				'click #btnCreate' : 'save',
				'click #btnCancel' : 'cancel'

			},
			onShow : function(){
				this.displayForm();
			},
			displayForm : function(type){
				var self = this;
				this.nsForm = new NsForm({
				name: 'MonitoredSiteForm',
				modelurl: config.coreUrl+'monitoredSite',
				buttonRegion: [],
				formRegion: this.ui.form,
				displayMode: 'edit',
				objectType: 1,
				id: 0,
				reloadAfterSave : false,
				afterSaveSuccess : function(){
					swal({
                title: "Succes",
                text: "creating new site",
                type: 'success',
                showCancelButton: true,
                confirmButtonColor: 'green',
                confirmButtonText: "create another site",
                cancelButtonText: "cancel",
                closeOnConfirm: true,
              },
              function(isConfirm){
                  if (!isConfirm) {
                     self.cancel();
                  }
              }
          );
				},
				savingError : function(response){
					Swal({
								title: "Error",
								text: 'creating a new monitored site',
								type: 'error',
								showCancelButton: false,
								confirmButtonColor: 'rgb(147, 14, 14)',
								confirmButtonText: "OK",
								closeOnConfirm: true,
							}
					);
				}
			});
		},
		save: function(){
			this.nsForm.butClickSave();
		},
		cancel : function(){
			Backbone.history.navigate('monitoredSite',{ trigger:true});
		}
	});
});
