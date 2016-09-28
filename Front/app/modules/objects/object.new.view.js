define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',
	'config',
	'ns_form/NSFormsModuleGit',
], function(
  $, _, Backbone, Marionette, Swal, Translater, config,
  NsForm
){

  'use strict';
  return Marionette.ItemView.extend({
    template: 'app/modules/objects/object.new.tpl.html',
    className: 'white full-height new',

    ui: {
      'form': '.js-form',
      'btnform': '.js-btn-form'
    },
    events: {
      'click .js-back': 'removeThis',
      'click .js-btn-save': 'save',
      'click .js-cancel': 'cancel'
    },

    initialize: function(options) {
      this.model = new Backbone.Model();
      this.model.set('objectType', options.objectType);
    },

    onShow: function() {
      this.displayForm(this.type);
    },

    displayForm: function(type) {
      var self = this;
      this.nsForm = new NsForm({
        name: 'SensorForm',
        modelurl: config.coreUrl + model.get('type'),
        buttonRegion: [],
        formRegion: this.ui.form,
        displayMode: 'edit',
        objectType: this.model.get('objectType'),
        id: 0,
        reloadAfterSave: false,
        afterSaveSuccess: function() {
          console.log(this.model);
          swal({
                title: 'Succes',
                text: 'creating new sensor',
                type: 'success',
                showCancelButton: true,
                confirmButtonColor: 'green',
                confirmButtonText: 'create another sensor',
                cancelButtonText: 'cancel',
                closeOnConfirm: true,
              },
              function(isConfirm) {
                if (!isConfirm) {
                  self.cancel();
                } else {
                  	self.nsForm.butClickClear();
                }
              }
          );
        },
        savingError: function(response) {
          var msg = 'in creating a new sensor';
          if (response.status == 520 && response.responseText){
            msg = response.responseText;
          }
          Swal({
            title: 'Error',
            text: msg ,
            type: 'error',
            showCancelButton: false,
            confirmButtonColor: 'rgb(147, 14, 14)',
            confirmButtonText: 'OK',
            closeOnConfirm: true,
          });
        }
      });
    },
    save: function() {
      this.nsForm.butClickSave();
    },
    cancel: function() {
      Backbone.history.navigate('#' + this.model.get('type'),{trigger: true});
    },
  });
});
