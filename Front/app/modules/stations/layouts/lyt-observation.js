define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',

	'moment',
	'sweetAlert',
	'config',
	'ns_form/NSFormsModuleGit',
	'i18n',
], function($, _, Backbone, Marionette, Radio,
	moment, Swal, config, NsForm
) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/templates/tpl-observation.html',

    ui: {
      'stationForm': '#stationForm',
      'stationFormBtns': '#stationFormBtns',
    },

    initialize: function(options) {
      this.stationId = options.stationId;
      this.objectType = this.model.attributes.FK_ProtocoleType;
    },

    renderObs: function() {
      var _this = this;

      //could be in the Obs Model

      this.model.schema = this.model.get('schema');
      this.model.fieldsets = this.model.get('fieldsets');
      this.model.attributes = this.model.get('data');
      this.model.urlRoot =  config.coreUrl + 'stations/' + this.stationId + '/protocols' + '/'

      if (this.model.get('id') == 0) {
        this.model.attributes.state = 'edit';
        var mode = 'edit';
      }else {
        this.model.attributes.state = 'display';
        var mode = 'display';
      }
      //need to change NsForm module
      //&& add binders on every states

      var nsform = new NsForm({
        model: this.model,
        modelurl: config.coreUrl + 'stations/' + this.stationId + '/protocols',
        //have 2 change the button region function
        buttonRegion: [this.ui.stationFormBtns],
        displayMode: this.model.attributes.state,
        formRegion: this.ui.stationForm,
        reloadAfterSave: true,
        objectType: this.objectType,
        savingError: function (response) {
          // individual equipment sensor is not available
          if(response.responseJSON.sensor_available == false){
            _this.sweetAlert('Data saving error', 'error', 'Selected sensor is not available');
          }
      
        }
      });

      nsform.updateState = function(state) {
        _this.model.set({'state': state});
      };

      //weird I know...
      nsform.afterDelete = function() {
        //_this.sweetAlert('warning', 'warning', 'warning');
        var jqxhr = $.ajax({
          url: config.coreUrl + 'stations/' + _this.stationId + '/protocols/' + this.model.get('ID'),
          method: 'DELETE',
          contentType: 'application/json'
        }).done(function(resp) {
          _this.deleteObs();
        }).fail(function(resp) {
          if (_this.model.get('id') == 0) {
            _this.deleteObs();
          }else {
            console.warn('delete fail');
          }
        });
      };
    },

    onRender: function() {
      this.renderObs();
    },

    deleteObs: function(form) {
      this.model.destroy();
    },

    changeState: function() {

    },

    onDestroy: function() {
      console.info('destroyObs View');
    },

    sweetAlert: function(title, type, message, callback) {
      var color;
      if (type = 'error') {
        color = 'rgb(147, 14, 14)';
      }else {
        color = 'rgb(147, 14, 14)';
      }
      Swal({
        title: title,
        text: message,
        type: type,
        showCancelButton: false,
        confirmButtonColor: color,
        confirmButtonText: 'OK',
        closeOnConfirm: true,
      });
    },

  });
});
