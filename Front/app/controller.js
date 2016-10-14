define([
  'marionette',

  './base/home/lyt-home',

  './modules/importFile/lyt-entry-importFile',
  './modules/export/lyt-export-stepper',

  './modules/validate/validate.st.view',
  './modules/validate/validate.nd.view',
  './modules/validate/validate.rd.view',

  './modules/release/release.view',
  './modules/release/layouts/lyt-release-individual',

  './modules/stations/station.view',
  './modules/stations/stations.view',
  './modules/stations/stations.new.view',

  './modules/individuals/individual.view',
  './modules/individuals/individuals.view',
  './modules/individuals/individuals.new.view',

  './modules/sensors/sensor.view',
  './modules/sensors/sensors.view',
  './modules/sensors/sensors.new.view',

  './modules/monitoredSites/monitored_site.view',
  './modules/monitoredSites/monitored_sites.view',
  './modules/monitoredSites/monitored_sites.new.view',

],function(
  Marionette,
  LytHome,
  LytImportFile,
  LytExport,
  LytSensorValidate,
  LytSensorValidateType,
  LytSensorValidateDetail,
  LytRelease,
  LytStationsRelease,
  
  LytStation, LytStations, LytStationsNew,
  LytIndividual, LytIndividuals, LytIndividualsNew,
  LytSensor, LytSensors, LytSensorsNew,
  LytMonitoredSite, LytMonitoredSites, LytMonitoredSitesNew
) {
  'use strict';

  return Marionette.Object.extend({

    initialize: function() {
      var app = window.app;

      this.rgMain = app.rootView.rgMain;
      this.rgHeader = app.rootView.rgHeader;
      this.rgFooter = app.rootView.rgFooter;
      
      app.entityConfs = {
        'stations': {
          'entity': LytStation,
          'entities': LytStations,
          'newEntity': LytStationsNew
        },
        'individuals': {
          'entity': LytIndividual,
          'entities': LytIndividuals,
          'newEntity': LytIndividualsNew
        },
        'sensors': {
          'entity': LytSensor,
          'entities': LytSensors,
          'newEntity': LytSensorsNew
        },
        'monitoredSites': {
          'entity': LytMonitoredSite,
          'entities': LytMonitoredSites,
          'newEntity': LytMonitoredSitesNew
        },
      };
    },

    home: function() {
      Backbone.history.navigate('');
      this.rgMain.show(new LytHome());
    },

    importFile: function(type) {
      this.rgMain.show(new LytImportFile({type : type}));
    },

    station: function(id) {
      this.rgMain.show(new LytStation({id: id}));
    },    
    stations: function() {
      this.rgMain.show(new LytStations());
    },
    newStation: function(from) {
      this.rgMain.show(new LytStationsNew({from: from}));
    },

    individual: function(id) {
      this.rgMain.show(new LytIndividual({id: id}));
    },
    individuals: function() {
      this.rgMain.show(new LytIndividuals());
    },
    newIndividual: function(objectType) {
      this.rgMain.show(new LytIndividualsNew({objectType: objectType}));
    },

    monitoredSite: function(id) {
      this.rgMain.show(new LytMonitoredSite({id: id}));
    },
    monitoredSites: function() {
      this.rgMain.show(new LytMonitoredSites());
    },
    newMonitoredSite: function(type) {
      this.rgMain.show(new LytMonitoredSitesNew());
    },

    sensor: function(id) {
      this.rgMain.show(new LytSensor({id: id}));
    },
    sensors: function() {
      this.rgMain.show(new LytSensors());
    },
    newSensor: function(objectType) {
      this.rgMain.show(new LytSensorsNew({objectType: objectType}));
    },

    validate: function() {
      this.rgMain.show(new LytSensorValidate());
    },
    validateType: function(type) {
      this.rgMain.show(new LytSensorValidateType({
        type: type
      }));
    },

    validateDetail: function(type, dataset){
      this.rgMain.show(new LytSensorValidateDetail({
        type: type,
        dataset: dataset
      }));
    },

    release: function() {
      this.rgMain.show(new LytRelease());
    },

    //detail
    releaseIndividuals: function(id) {
      this.rgMain.show(new LytStationsRelease({id : id}));
    },

    export: function() {
      this.rgMain.show(new LytExport());
    },

    checkAjax : function(){
      var xhrPool = window.xhrPool;

      for(var i=0; i<xhrPool.length; i++){
         xhrPool[i].abort();
      }
       window.xhrPool = [];
    }
  });
});
