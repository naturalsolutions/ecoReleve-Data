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
    template: 'app/modules/objects/templates/tpl-objects-new.html',
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

    initialize: function(options) {
      this.model = new Backbone.Model();
      this.type = options.type;
      if (options.ojectName) {
        this.ojectName = options.ojectName;
      } else {
        //get the parentType from url
      }
      this.model.set('ojectName', this.ojectName);
      this.picker = options.picker;

      this.data = options.data;
      var curURL = window.location.href.split('stations/')[1];
      var stationID = curURL.split('/')[0];
      if (this.data){
        this.data['stationID'] = stationID;
      } else {
        this.data = {'stationID':stationID};
      }

      if (this.data){
        for(var i in this.data){
          if(this.data[i] == 'null'){
            this.data[i] = '';
          }
        }
        
      }
    },

    onShow: function() {
      this.displayForm(this.type);
    },

    displayForm: function(type) {
      var _this = this;

      this.nsForm = new NsForm({
        name: 'name',
        data: this.data,
        modelurl: config.coreUrl + this.ojectName,
        buttonRegion: [],
        formRegion: this.ui.form,
        displayMode: 'edit',
        objectType: type,
        id: 0,
        reloadAfterSave: false,
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
      this.nsForm.savingSuccess = function(model, resp) {
        _this.afterSave(model, resp);
      };
    },

    afterSave: function(model, resp) {
      if (this.picker) {
        swal({
              title: 'Success',
              text: 'ID: ' + resp.ID,
              type: 'success',
              confirmButtonColor: 'green',
              closeOnConfirm: true,
            },
            function(isConfirm) {
              if (!isConfirm) {
                _this.cancel();
              }
            }
        );
        this.picker.setValue(resp.ID);
        this.picker.$el.find('#creation').addClass('hidden');
        this.picker.hidePicker();
      } else {
        //redirect
      }
    },

    save: function() {
      this.nsForm.butClickSave();
    },
    cancel: function() {
      console.log(this.picker);
      if(this.picker){
        this.picker.$el.find('#creation').addClass('hidden');
      }
      //Backbone.history.navigate({trigger: true});

    }

  });
});
