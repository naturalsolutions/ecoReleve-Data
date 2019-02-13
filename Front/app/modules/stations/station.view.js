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
  'requirejs-text!./geometry-info.tpl.html'
], function(
  $, _, Backbone, Marionette, Swal,
  Com, NsForm, NavbarView, LytProtocols,
  DetailView, StationModel, NsMap, gemoInfoTpl
) {

  'use strict';

  return DetailView.extend({
    template: 'app/modules/stations/station.tpl.html',
    className: 'full-height station',

    ModelPrototype: StationModel,
    
    events: {
      'click .tab-link': 'handlerClickTab',
      'click .js-btn-add-protocols': 'modalProtocols'
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

   modalProtocols: function(event) {
      event.preventDefault()
      var elemNext = event.currentTarget.nextElementSibling;
      this.displayTab(elemNext);
      this.rgProtocols.currentView.openModal()
    },

    getRegion: function(val){
      var _this = this;
      if(!val){
        return;
      }
      $.ajax({
        url:'regions/'+val+'/geoJSON'
      }).done(function(geoJSON){
        if(_this.RegionLayer){
          _this.map.map.removeLayer(_this.RegionLayer);
        }
        
        var regionStyle = {
          "color": "#00cc00",
          "weight": 3,
          "opacity": 0.5
        };
        _this.RegionLayer = new L.GeoJSON(geoJSON, {style : regionStyle});
        var prop = geoJSON.properties;

        var infos = _.template(gemoInfoTpl, prop);

        _this.RegionLayer.bindPopup(infos);
        _this.RegionLayer.addTo(_this.map.map);
        _this.map.map.fitBounds(_this.RegionLayer.getBounds());
        _this.map.map.on("overlayadd", function (event) {
        _this.RegionLayer.bringToFront();
        });
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
          _this.updateMap();
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
      var _this = this;
      var map = this.map = new NsMap({
        zoom: 3,
        popup: true,
        preventSetView:true
      });
      $.when(this.nsForm.jqxhr).then(function(){
        _this.updateMap();
      });
    },
    updateMap: function(){
      if(this.nsForm.model.get('LAT') && this.nsForm.model.get('LON')){
        this.map.addMarker(null, this.nsForm.model.get('LAT'), this.nsForm.model.get('LON'));
      }
      this.getRegion(this.nsForm.model.get('FK_FieldworkArea'));
    
    },
    handlerClickTab: function(e) {
      e.preventDefault();
      var elemClicked = e.currentTarget;
      this.displayTab(elemClicked);
    },
    displayTab: function(elem) {
      this.$el.find('.nav-tabs>li').each(function(){
        $(this).removeClass('active in');
      });
      $(elem).parent().addClass('active in');

      this.$el.find('.tab-content>.tab-pane').each(function(){
        $(this).removeClass('active in');
      });
      var id = $(elem).attr('href');
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
          _this.$el[0].children[0].className = _this.$el[0].children[0].className + ' editionMode';
          this.bindChanges(_this.ui.formStation);
          $(".datetime").attr('placeholder','DD/MM/YYYY');
          $("#dateTimePicker").on("dp.change", function (e) {
          $('#dateTimePicker').data("DateTimePicker").format('DD/MM/YYYY').maxDate(new Date());
          });
        }
        else {
          if(_this.$el[0].children[0].className.indexOf(' editionMode') > -1 ) {
            _this.$el[0].children[0].className = _this.$el[0].children[0].className.replace(' editionMode','')
          }
        }
      };

      this.nsForm.afterSaveSuccess = function() {
        // if(_this.map){
        //   _this.map.addMarker(null, this.model.get('LAT'), this.model.get('LON'));
        // }

        if(this.model.get('fieldActivityId') != _this.fieldActivityId){
          _this.displayProtos();
          _this.fieldActivityId = _this.model.get('fieldActivityId');
        }
        $.when(this.jqxhr).then(function(){
          _this.updateMap();
        });
        
      };
      
      $.when(this.nsForm.jqxhr).then(function(){
        _this.fieldActivityId = this.model.get('fieldActivityId');
        _this.displayProtos();
      });

    },

  });
});
