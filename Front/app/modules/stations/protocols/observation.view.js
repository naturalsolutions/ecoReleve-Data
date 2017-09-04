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
      this.model.set('stationId', this.parentModel.get('stationId'));
      this.model.set('FK_Station', this.parentModel.get('stationId'));

      this.form = new NsForm({
        modelurl: this.model.urlRoot,
        model: this.model,
        buttonRegion: [this.ui.formBtns],
        displayMode: this.displayMode,
        formRegion: this.ui.form,
        reloadAfterSave: true,
        savingError: this.handleErrors,
        afterSaveSuccess: function(response){
          var id;
          if(this.model.changed.id){
            _this.parentModel.get('obs').push(response.id);
            id = response.id;
          } else {
            id = this.model.get('ID');
          }
          _this.parentModel.trigger('change:obs', _this.parentModel);
          var hash = window.location.hash.split('?');
          var url = hash[0] + '?proto=' + _this.parentModel.get('ID') + '&obs=' + id;
          Backbone.history.navigate(url, {trigger: false});
        },
        afterDelete: function(){
          var index = _this.parentModel.get('obs').indexOf(_this.model.get('id'));
          _this.parentModel.get('obs').splice(index, 1);

          var url;
          var hash = window.location.hash.split('?');

          if(!_this.parentModel.get('obs').length){
            _this.parentModel.destroy();
            url = hash[0];
          } else {
            _this.parentModel.trigger('change:obs', _this.parentModel);
            url = hash[0] + '?proto=' + _this.parentModel.get('ID') + '&obs=' + _this.parentModel.get('obs')[index];
          }
          Backbone.history.navigate(url, {trigger: true});
        }
      });
    },

    handleErrors: function(response){
      // individual equipment sensor is not available
      var btnColor = 'rgb(221, 107, 85)';
      if( response.status=== 409) {
            var opts = {
              title : 'Error',
              text : 'You cannot do this modification because data have already been validated with this sensor. Please contact an administrator.',
              allowEscapeKey: false,
              showCancelButton: false,
              type: 'error',
              confirmButtonText: 'OK!',
              confirmButtonColor: '#DD6B55'
            };
            this.swal(opts);
      }
      else if(response.responseJSON.response.equipment_error){
       this.swal({'title':'Data saving error', 'type':'error', 'text':'Selected sensor is not available', 'confirmButtonColor':'rgb(221, 107, 85)'});
      }
      else if(response.responseJSON.response.unequipment_error ){
      this.swal({'title':'Data saving error', 'type':'error', 'text':"Selected sensor can't be unequiped at this date with this "+response.responseJSON.response.unequipment_error, 'confirmButtonColor':'rgb(221, 107, 85)'});
      }
      else if(response.responseJSON.response.errorSite == true ){
      this.swal({'title':'Data saving error', 'type':'error', 'text':'No monitored site is attached', 'confirmButtonColor':'rgb(221, 107, 85)'});
      }
      else {
        this.swal({'title':'Data saving error', 'type':'error', 'text':response.responseJSON.response, 'confirmButtonColor':'rgb(221, 107, 85)'});
      }
    },

    onDestroy: function(){
      //abort xhr & thesaurus calls
    },
  });
});
