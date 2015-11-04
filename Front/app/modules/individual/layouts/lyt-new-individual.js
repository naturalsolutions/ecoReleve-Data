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

], function($, _, Backbone, Marionette, Swal, Translater, config, Com,  NsForm){

	'use strict';
		return Marionette.ItemView.extend({
			template: 'app/modules/individual/templates/tpl-individual-new.html',
			className: 'white full-height',


			ui : {
				'form': '#form',
				'btnform' : '#btnform'
			},
			events : {
				'click button.back' : 'removeThis',
				'click #btnCreate' : 'saveForm'
			},

			initialize: function(options){
				this.model = new Backbone.Model();
				this.model.set('type', options.type);
				switch(options.type){
					case 'individual':
						this.type = 1;
						break;
					case 'group':
						this.type = 2;
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
				name: 'IndivForm',
				modelurl: config.coreUrl+'individuals',
				buttonRegion: [],
				formRegion: this.ui.form,
				displayMode: 'edit',
				objectType: this.type,
				id: 0,
				reloadAfterSave : false,
				afterSaveSuccess : function(){
					console.log('plouf');
				}
			});
		},

	});
});
