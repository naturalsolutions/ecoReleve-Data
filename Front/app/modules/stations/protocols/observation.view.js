define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'ns_form/NSFormsModuleGit',

  'i18n'
], function($, _, Backbone, Marionette, NsForm) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/protocols/observation.tpl.html',
    className: 'observation full-height',

    ui: {
      'form': '.js-obs-form'
    },

    initialize: function(options){
      this.model.schema = this.model.get('schema');
      this.model.fieldsets = this.model.get('fieldsets');
      this.model.attributes = this.model.get('data');
      this.model.urlRoot =  'stations/' + this.stationId + '/protocols' + '/'
    },

    onShow: function(){
      this.displayForm();
    },

    displayForm: function(){
      this.form = new NsForm({
        model: this.model,
        modelurl: 'stations/' + this.stationId + '/protocols',
        buttonRegion: [],
        displayMode: this.model.attributes.state,
        formRegion: this.ui.form,
        reloadAfterSave: true,
        objectType: this.objectType,
        savingError: this.handleErrors
      });
    },

    handleErrors: function(response){
      // individual equipment sensor is not available
      if(response.responseJSON.sensor_available == false){
      _this.sweetAlert('Data saving error', 'error', 'Selected sensor is not available');
      }
      else if(response.responseJSON.already_unequip == true ){
      _this.sweetAlert('Data saving error', 'error', 'Selected sensor is already unequiped');
      }
      else if(response.responseJSON.existing_equipment == false ){
      _this.sweetAlert('Data saving error', 'error', 'Selected sensor is not equiped with this individual');
      }
      else if(response.responseJSON.errorSite == true ){
      _this.sweetAlert('Data saving error', 'error', 'No monitored site is attached');
      }
    }



  });
});

