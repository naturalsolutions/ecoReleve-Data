define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'radio',
  'sweetAlert',
  'config',
  'ns_form/NSFormsModuleGit',
  'ns_navbar/ns_navbar',

  './lyt-protocols-editor',
  'i18n'

], function($, _, Backbone, Marionette, Radio,
  Swal, config, NsForm, Navbar, LytProtoEditor
) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height white',

    template: 'app/modules/stations/templates/tpl-station-detail.html',

    regions: {
      'rgStation': '#rgStation',
      'rgProtoEditor': '#rgProtoEditor',
      'rgNavbar': '#navbar'
    },

    ui: {
      protoEditor: '#protoEditor',
      total: '#total',
      formStation: '#stationForm',
      formStationBtns: '#stationFormBtns',
    },

    total: 0,

    initialize: function(options) {
      if (options.stationId) {
        this.stationId = options.stationId;
      }else {
        this.model = options.model;
        this.navbar = new Navbar({
          parent: this,
          globalGrid: options.globalGrid,
          model: options.model,
        });
      }
    },

    onDestroy: function() {
    },

    onShow: function() {
      if (this.stationId) {
        this.displayStation(this.stationId);
        //this.feedProtoList();
      }else {
        this.rgNavbar.show(this.navbar);
        this.display(this.model);
        //this.feedProtoList();
      }
      //this.$el.i18n();
      //this.translater = Translater.getTranslater();
    },

    reloadFromNavbar: function(model) {
      this.display(model);
      Backbone.history.navigate('#stations/' + this.stationId, {trigger: false});
    },

    display: function(model) {
      this.model = model;
      this.stationId = this.model.get('ID');
      this.displayStation(this.stationId);
    },

    displayStation: function(stationId) {
      this.total = 0;
      var stationType = 1;
      var _this = this;
      this.nsForm = new NsForm({
        name: 'StaForm',
        modelurl: config.coreUrl + 'stations',
        formRegion: this.ui.formStation,
        buttonRegion: [this.ui.formStationBtns],
        displayMode: 'display',
        objectType: stationType,
        id: stationId,
        reloadAfterSave: true,
        afterShow : function(){
          $(".datetime").attr('placeholder','DD/MM/YYYY');
          $("#dateTimePicker").on("dp.change", function (e) {
            $('#dateTimePicker').data("DateTimePicker").format('DD/MM/YYYY').maxDate(new Date());
           });
          _this.filedAcitivityId = this.model.get('fieldActivityId');
        }
      });
      this.nsForm.afterDelete = function() {
        var jqxhr = $.ajax({
          url: config.coreUrl + 'stations/' + _this.stationId,
          method: 'DELETE',
          contentType: 'application/json'
        }).done(function(resp) {
          Backbone.history.navigate('#stations', {trigger: true});
        }).fail(function(resp) {
        });
      };

      this.nsForm.savingError = function (response) {
        var msg = 'An error occured, please contact an admninstrator';
        var type_ = 'error';
        var title = 'Error saving';
        if (response.status == 510) {
          msg = 'A station already exists with these parameters';
          type_ = 'warning';
          title = 'Error saving';
        }

        Swal({
          title: title,
          text: msg,
          type: type_,
          showCancelButton: false,
          confirmButtonColor: 'rgb(147, 14, 14)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        });
      };



      this.nsForm.afterSaveSuccess = function() {
        if(this.model.get('fieldActivityId') != _this.fieldActivityId){
          _this.displayProtos();
          _this.fieldActivityId = this.model.get('fieldActivityId');
        }
      },

      //then display protocols
      _this.displayProtos();
    },

    displayProtos: function() {
      this.lytProtoEditor = new LytProtoEditor({stationId: this.stationId});

      this.rgProtoEditor.show(this.lytProtoEditor);
    },

  });
});
