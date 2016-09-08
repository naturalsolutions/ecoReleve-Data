define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'radio',
  'sweetAlert',
  'config',
  'ns_form/NSFormsModuleGit',
  'ns_navbar/navbar.view',
  './layouts/lyt-protocols-editor',

  'i18n'

], function($, _, Backbone, Marionette, Radio,
  Swal, config, NsForm, NavbarView, LytProtoEditor
) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/station.tpl.html',
    className: 'full-height white',

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

    model: new Backbone.Model({
      type: 'stations',
    }),

    initialize: function(options) {
      this.model.set('id', options.id);
    },

    reloadFromNavbar: function(id) {
      this.model.set('id', id);
      this.displayStation();
    },

    onDestroy: function() {
    },
    
    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      this.displayNavbar();
      this.displayStation();
    },

    displayNavbar: function(){
      this.rgNavbar.show(this.navbarView = new NavbarView({
        parent: this
      }));
    },

    displayStation: function() {
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
        id: this.model.get('id'),
        reloadAfterSave: true,
        });

        this.nsForm.BeforeShow = function(){
          
        };

        this.nsForm.afterShow = function(){
          $(".datetime").attr('placeholder','DD/MM/YYYY');
          $("#dateTimePicker").on("dp.change", function (e) {
            $('#dateTimePicker').data("DateTimePicker").format('DD/MM/YYYY').maxDate(new Date());
           });
          _this.filedAcitivityId = this.model.get('fieldActivityId');
        };

      this.nsForm.afterDelete = function() {
        var jqxhr = $.ajax({
          url: config.coreUrl + 'stations/' + _this.model.get('id'),
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

      _this.displayProtos();
    },

    displayProtos: function() {
      this.lytProtoEditor = new LytProtoEditor({stationId: this.model.get('id')});

      this.rgProtoEditor.show(this.lytProtoEditor);
    },

  });
});
