
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

], function($, _, Backbone, Marionette, Swal, Translater, config, Com,  NsForm){

	'use strict';
		return Marionette.ItemView.extend({
			template: 'app/modules/individual/templates/tpl-newIndivDetails.html',
			ui : {
				'form': '#form',
				'btnform' : '#btnform'
			},
			events : {
				'click button.back' : 'removeThis',
				'click #btnCreate' : 'saveForm'
			},
		  initialize: function(options){
		    this.type = parseInt(options.type),
		    this.parent = options.parent;
		  },
		  onShow : function(){
				this.displayForm();
			},
			displayForm : function(){
				var self = this;
				var type = parseInt(this.type);
				this.nsForm = new NsForm({
				name: 'IndivForm',
				modelurl: config.coreUrl+'individuals',
				buttonRegion: [],
				formRegion: this.ui.form,
				displayMode: 'edit',
				objectType: type,
				id: 0,
				reloadAfterSave : false,
				afterSaveSuccess : function(){
					self.sensorInserted();
				}

			});
			},
			removeThis : function(){
				 this.parent.hideDetails();
			},
			check: function(){
				if(this.nsForm.BBForm.commit()){
					return false;
				}else{
					return true;
				}
		},
		validate: function(){
			this.model = this.nsForm.model;
			return this.nsForm.butClickSave();
		},
		saveForm : function(){
			var checked = this.check();
			if(checked){
				this.validate();
			}
		},
		sensorInserted : function(){
			this.removeThis();
			Swal({
					title: 'New sensor',
					text: 'The sensor is successfully created',
					type: 'success',
					showCancelButton: false,
					confirmButtonColor: '#5cb85c',
					confirmButtonText: 'OK',
					closeOnConfirm: true,
				});
		}
	});
});
