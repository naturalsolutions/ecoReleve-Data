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
    className: 'observation full-height white',

    ui: {
      'form': '.js-obs-form'
    },

    initialize: function(options){
      
    },

    onShow: function(){
      var _this = this;
      if(this.model.get('id')){
        this.diplsayMode = 'display';
        this.model.fetch({success: _this.displayForm.bind(_this)});
      } else {
        this.diplsayMode = 'edit';
        this.displayForm();
      }

    },

    displayForm: function(){
      this.form = new NsForm({
        model: this.model,
        buttonRegion: [],
        displayMode: this.displayMode,
        displayMode: this.model.attributes.state,
        formRegion: this.ui.form,
        reloadAfterSave: true,
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
    },

    onDestroy: function(){
      //abort xhr & thesaurus calls
    },
  });
});

