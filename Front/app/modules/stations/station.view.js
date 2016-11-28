define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',

  'ns_modules/ns_com',
  'ns_form/NSFormsModuleGit',
  'ns_navbar/navbar.view',
  './protocols/protocols.view',

  'modules/objects/detail.view',
  './station.model',

], function(
  $, _, Backbone, Marionette, Swal,
  Com, NsForm, NavbarView, LytProtocols,
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
      'rgProtocols': '.js-rg-protocols',
      'rgProtocol': '.js-rg-protocol',
      'rgNavbar': '.js-navbar'
    },

    initialize: function(options) {
      this.com = new Com();
      this.model.set('id', options.id);

      this.model.set('stationId', options.id);

      this.model.set('urlParams', {
        proto: options.proto,
        obs: options.obs
      });
    },

    reload: function(options){
      if(options.id == this.model.get('id')){
        this.LytProtocols.protocolsItems.getViewFromUrlParams(options);
      } else {
        this.model.set('id', options.id);
        this.model.set('stationId', options.id);
        this.displayStation();
      }
    },

    displayProtos: function() {
      this.rgProtocols.show(this.LytProtocols = new LytProtocols({
        model: this.model,
        parent: this,
      }));
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
      formConfig.afterDelete = function(response, model){
        Backbone.history.navigate('#' + _this.model.get('type'), {trigger: true});
      };

      this.nsForm = new NsForm(formConfig);
      this.nsForm.BeforeShow = function(){

      };

      this.nsForm.afterShow = function(){
        $(".datetime").attr('placeholder','DD/MM/YYYY');
        $("#dateTimePicker").on("dp.change", function (e) {
          $('#dateTimePicker').data("DateTimePicker").format('DD/MM/YYYY').maxDate(new Date());
         });
        _this.filedAcitivityId = this.model.get('fieldActivityId');
        _this.displayProtos();
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
      };


    },

  });
});
