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
      'form': '.js-obs-form',
      'formBtns': '.js-form-btns' 
    },

    initialize: function(options){
      this.parentModel = options.parentModel;
    },

    onShow: function(){
      var _this = this;
      if(this.model.get('id') == 0){
        this.displayMode = 'edit';
      } else {
        this.displayMode = 'display';
      }
      this.model.fetch({
        data: { FormName: 1, ObjectType: _this.model.get('ID')},
        success: _this.displayForm.bind(_this)
      });


    },

    displayForm: function(){
      var _this = this;

      this.model.schema = this.model.get('schema');
      this.model.fieldsets = this.model.get('fieldsets');
      this.model.attributes = this.model.get('data');
      
      this.form = new NsForm({
        modelurl: this.model.urlRoot,
        model: this.model,
        buttonRegion: [this.ui.formBtns],
        displayMode: this.displayMode,
        formRegion: this.ui.form,
        reloadAfterSave: false,
        savingError: this.handleErrors,
        afterSaveSuccess: function(response){
          _this.updateAfterSave(response, _this);
        },
      });
    },

    updateAfterSave: function(response, _this){
      if(this.model.changed.id){
        _this.parentModel.get('obs').push(response.id);
      }

      _this.parentModel.trigger('change:obs', _this.parentModel);

      var hash = window.location.hash.split('?');
      var url = hash[0] + '?proto=' + _this.parentModel.get('ID') + '&obs=' + response.id;
      Backbone.history.navigate(url, {trigger: true});
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

