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
    template: 'app/modules/sensors/templates/tpl-sensors-new.html',
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

    rootUrl: '#sensors/',

    initialize: function(options) {
      this.getSensorLabel(options);
      this.type = parseInt(options.type);
    },

    onShow: function() {
      if (this.type)
      this.displayForm(this.type);
    },
    getSensorLabel : function(options){
      var _this = this;
      var url = config.coreUrl + 'sensors/getType';
      $.ajax({
        url: url,
        context: this,
      success : function(data) {
        // data is an array of objets { label: , val}
        for(var i=0;i<data.length; i++) {
          if (data[i].val == parseInt(options.type) ) {
            $('.sensorLabel').text(data[i].label);
            break;
          }
        }

      }
      });
    },
    displayForm: function(type) {
      var self = this;
      this.nsForm = new NsForm({
        name: 'SensorForm',
        modelurl: config.coreUrl + 'sensors',
        buttonRegion: [],
        formRegion: this.ui.form,
        displayMode: 'edit',
        objectType: this.type,
        id: 0,
        reloadAfterSave: false, 
        loadingError : function() { 
          Backbone.history.navigate('#', {trigger: true});
        },
        afterSaveSuccess: function() {
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
          console.log(response)
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
    },
  });
});
