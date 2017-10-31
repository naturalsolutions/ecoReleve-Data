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

  'ns_map/ns_map',
], function(
  $, _, Backbone, Marionette, Swal,
  Com, NsForm, NavbarView, LytProtocols,
  DetailView, StationModel, NsMap
) {

  'use strict';

  return DetailView.extend({
    template: 'app/modules/stations/station.tpl.html',
    className: 'full-height white station',

    ModelPrototype: StationModel,
    
    events: {
      'click .tab-link': 'displayTab',
    },

    ui: {
      formStation: '.js-from-station',
      formStationBtns: '.js-from-btns',
      'map': '.js-map',
    },

    regions: {
      'rgStation': '.js-rg-station',
      'rgProtocols': '.js-rg-protocols',
      'rgProtocol': '.js-rg-protocol',
      'rgNavbar': '.js-navbar'
    },

    initialize: function(options) {
      this.model = new this.ModelPrototype();
      this.com = new Com();
      this.model.set('id', options.id);

      this.model.set('stationId', options.id);

      this.model.set('urlParams', {
        proto: options.proto,
        obs: options.obs
      });
    },

    reload: function(options){
      var _this = this;
      if(options.id == this.model.get('id')){
        this.LytProtocols.protocolsItems.getViewFromUrlParams(options);
      } else {
        this.model.set('id', options.id);
        this.model.set('stationId', options.id);
        this.model.set('urlParams', {
          proto: options.proto,
          obs: options.obs
        });
        this.displayStation();
      }
      if(this.map){
        $.when(this.nsForm.jqxhr).then(function(){
          _this.map.addMarker(null, this.model.get('LAT'), this.model.get('LON'));
        });
      }
    },

    displayProtos: function() {
      this.rgProtocols.show(this.LytProtocols = new LytProtocols({
        model: this.model,
        parent: this,
      }));
    },

    displayMap: function() {
      var map = this.map = new NsMap({
        zoom: 3,
        popup: true,
      });
      $.when(this.nsForm.jqxhr).then(function(){
        map.addMarker(null, this.model.get('LAT'), this.model.get('LON'));
      });
    },


    displayTab: function(e) {
      e.preventDefault();
      this.$el.find('.nav-tabs>li').each(function(){
        $(this).removeClass('active in');
      });
      $(e.currentTarget).parent().addClass('active in');

      this.$el.find('.tab-content>.tab-pane').each(function(){
        $(this).removeClass('active in');
      });
      var id = $(e.currentTarget).attr('href');
      this.$el.find('.tab-content>.tab-pane' + id).addClass('active in');

      if(id === '#mapTab' && !this.map){
        this.displayMap();
      }
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
      var detailsFormRegion = this.$el.find('.js-rg-details');
      var formConfig = this.model.get('formConfig');

      formConfig.id = this.model.get('id');
      formConfig.formRegion = detailsFormRegion;
      formConfig.buttonRegion = [this.ui.formStationBtns];
      formConfig.afterDelete = function(response, model){
        Backbone.history.navigate('#' + _this.model.get('type'), {trigger: true});
      };

      this.nsForm = new NsForm(formConfig);
      this.nsForm.BeforeShow = function(){

      };

      this.nsForm.afterShow = function(){
        var globalEl = $(this.BBForm.el).find('fieldset').first().detach();
        _this.ui.formStation.html(globalEl);

        if(this.displayMode.toLowerCase() == 'edit'){
          this.bindChanges(_this.ui.formStation);
          $(".datetime").attr('placeholder','DD/MM/YYYY');
          $("#dateTimePicker").on("dp.change", function (e) {
          $('#dateTimePicker').data("DateTimePicker").format('DD/MM/YYYY').maxDate(new Date());
          });
        }

      };

      this.nsForm.afterSaveSuccess = function() {
        if(_this.map){
          _this.map.addMarker(null, this.model.get('LAT'), this.model.get('LON'));
        }

        if(this.model.get('fieldActivityId') != _this.fieldActivityId){
          _this.displayProtos();
          _this.fieldActivityId = _this.model.get('fieldActivityId');

        }
      };
      
      $.when(this.nsForm.jqxhr).then(function(){
        _this.fieldActivityId = this.model.get('fieldActivityId');
        _this.displayProtos();
      })

    },

  });
});
