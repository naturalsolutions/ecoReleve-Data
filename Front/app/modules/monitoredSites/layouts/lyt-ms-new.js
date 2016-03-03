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
    template: 'app/modules/monitoredSites/templates/tpl-ms-new.html',
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

    rootUrl: '#monitoredSites/',

    onShow: function() {
      this.displayForm();
    },
    displayForm: function(type) {
      var self = this;
      this.nsForm = new NsForm({
        name: 'MonitoredSiteForm',
        modelurl: config.coreUrl + 'monitoredSites',
        buttonRegion: [],
        formRegion: this.ui.form,
        displayMode: 'edit',
        objectType: 1,
        id: 0,
        reloadAfterSave: false,
        afterSaveSuccess: function() {
          swal({
                title: 'Succes',
                text: 'creating new site',
                type: 'success',
                showCancelButton: true,
                confirmButtonColor: 'green',
                confirmButtonText: 'create another site',
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
          var type;
          var msg;
          var color;
          if (response.status == 520) {
            type = 'warning';
            msg = 'This name is already used for another monitored site';
            color = 'rgb(218, 146, 15)';
          } else {
            type = 'error';
            msg = 'an unknow error ooccured';
            color = 'rgb(147, 14, 14)';
          }
          Swal({
            title: 'Error',
            text: msg,
            type: type,
            showCancelButton: false,
            confirmButtonColor: color,
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
