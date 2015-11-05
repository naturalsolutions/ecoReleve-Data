/*1 Argos
2 GSM
3 RFID
4 VHF
*/

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
], function($, _, Backbone, Marionette, Swal, Translater, config, Com,  NsForm, swal){

	'use strict';
		return Marionette.ItemView.extend({
			template: 'app/modules/sensor/templates/tpl-sensor-new.html',
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

			initialize: function(options){
				this.model = new Backbone.Model();
				this.model.set('type', options.type);
				switch(options.type){
					case 'argos':
						this.type = 1;
						break;
					case 'gsm':
						this.type = 2;
						break;
					case 'rfid':
						this.type = 3;
						break;
					case 'vhf':
						this.type = 4;
						break;
					default:
						Backbone.history.navigate('#', {trigger : true});
						break;
				}
			},

			onShow : function(){
				if(this.type)
				this.displayForm(this.type);
			},

			displayForm : function(type){
				var self = this;
				this.nsForm = new NsForm({
				name: 'SensorForm',
				modelurl: config.coreUrl+'sensors',
				buttonRegion: [],
				formRegion: this.ui.form,
				displayMode: 'edit',
				objectType: this.type,
				id: 0,
				reloadAfterSave : false,
				afterSaveSuccess : function(){
					swal({
                title: "Succes",
                text: "creating new sensor",
                type: 'success',
                showCancelButton: true,
                confirmButtonColor: 'green',
                confirmButtonText: "create another sensor",
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
								text: 'in creating a new sensor',
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
			Backbone.history.navigate('sensor',{ trigger:true});
		}
	});
});
