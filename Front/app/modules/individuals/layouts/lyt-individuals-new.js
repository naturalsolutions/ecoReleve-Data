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

], function($, _, Backbone, Marionette, Swal, Translater, config, Com, NsForm, swal) {

  'use strict';
  return Marionette.ItemView.extend({
    template: 'app/modules/individuals/templates/tpl-individuals-new.html',
    className: 'white full-height',

    ui: {
      'form': '#form',
      'btnform': '#btnform'
    },
    events: {
      'click button.back': 'removeThis',
      'click #btnCreate': 'save',
      'click #btnCancel': 'cancel'
    },

    rootUrl : '#individuals/',

    initialize: function(options) {
      this.type = 1;
    },

    onShow: function() {
      if (this.type)
      this.displayForm(this.type);
    },

    displayForm: function(type) {
      var self = this;
      this.nsForm = new NsForm({
        name: 'IndivForm',
        modelurl: config.coreUrl + 'individuals',
        buttonRegion: [],
        formRegion: this.ui.form,
        displayMode: 'edit',
        objectType: type,
        id: 0,
        reloadAfterSave: false,
        afterSaveSuccess: function() {
          var type = 'individual';
          if (self.type != 1) {
            type = 'group' ;
          }
          swal({
                title: 'Succes',
                text: 'creating new ' + type,
                type: 'success',
                showCancelButton: true,
                confirmButtonColor: 'green',
                confirmButtonText: 'create another ' + type,
                cancelButtonText: 'cancel',
                closeOnConfirm: true,
              },
              function(isConfirm) {
                if (!isConfirm) {
                  self.cancel();
                }
              }
          );
        },
        savingError: function(response) {
          Swal({
            title: 'Error',
            text: 'creating a new ' + type,
            type: 'error',
            showCancelButton: false,
            confirmButtonColor: 'rgb(147, 14, 14)',
            confirmButtonText: 'OK',
            closeOnConfirm: true,
          }
          );
        }
      });
    },
    save: function() {
      this.nsForm.butClickSave();
    },
    cancel: function() {
      Backbone.history.navigate(this.rootUrl,{trigger: true});
    }

  });
});
