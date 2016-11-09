define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',

  'ns_form/NSFormsModuleGit',
  'ns_navbar/navbar.view',
  './layouts/lyt-protocols-editor',

  'modules/objects/detail.view',
  './station.model',

], function(
  $, _, Backbone, Marionette, Swal,
  NsForm, NavbarView, LytProtoEditor, 
  DetailView, StationModel
) {

  'use strict';

  return DetailView.extend({
    template: 'app/modules/stations/station.tpl.html',
    className: 'full-height white station',

    model: new StationModel(),

    ui: {
      formStation: '.js-from-station',
      formStationBtns: '.js-from-btns',
    },

    regions: {
      'rgStation': '.js-rg-station',
      'rgProtoEditor': '.js-rg-proto-editor',
      'rgNavbar': '.js-navbar'
    },

    reload: function(options) {
      this.model.set('id', options.id);
      this.displayStation();
    },

    onShow: function() {
      this.displayStation();
      this.displayNavbar();
    },

    displayNavbar: function(){
      this.rgNavbar.show(this.navbarView = new NavbarView({
        parent: this
      }));
    },

    displayStation: function() {
      this.total = 0;
      var _this = this;
      
      var formConfig = this.model.get('formConfig');

      formConfig.id = this.model.get('id');
      formConfig.formRegion = this.ui.formStation;
      formConfig.buttonRegion = [this.ui.formStationBtns];

      this.nsForm = new NsForm(formConfig);
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
          url: _this.model.get( 'type') + '/' + _this.model.get('id'),
          method: 'DELETE',
          contentType: 'application/json',
        }).done(function(resp) {
          Backbone.history.navigate('#' + _this.model.get( 'type'), {trigger: true});
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
          _this.fieldActivityId = _this.model.get('fieldActivityId');
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
