define([
  'marionette', 'config',

  './base/home/lyt-home',

  './modules/importFile/lyt-entry-importFile',
  './modules/export/lyt-export-stepper',

  './modules/validate/lyt-sensorValidate',
  './modules/validate/lyt-sensorValidateType',
  './modules/validate/lyt-sensorValidateDetail',

  './modules/release/release.view',
  './modules/release/layouts/lyt-release-individual',

  './modules/stations/station.view',
  './modules/stations/stations.view',
  './modules/stations/lyt-station-new',

  './modules/individuals/individual.view',
  './modules/individuals/individuals.view',
  './modules/individuals/lyt-individuals-new',

  './modules/sensors/sensor.view',
  './modules/sensors/sensors.view',
  './modules/sensors/lyt-sensors-new',

  './modules/monitoredSites/monitored_site.view',
  './modules/monitoredSites/monitored_sites.view',
  './modules/monitoredSites/lyt-ms-new',

],function(
  Marionette, config,

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
      this.rgMain = window.app.rootView.rgMain;
      this.rgHeader = window.app.rootView.rgHeader;
      this.rgFooter = window.app.rootView.rgFooter;
    },

    home: function() {
      Backbone.history.navigate('');
      this.rgMain.show(new LytHome());
    },

    importFile: function() {
      this.rgMain.show(new LytImportFile());
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

    observations: function(id) {
     $.ajax({
          context: this,
          url: config.coreUrl + 'protocols/' + id,
        }).done(function (data) {
        window.location.href = window.location.origin + window.location.pathname + '#stations/' + data['FK_Station'] + '?observation=' + id ;
      }) ;
      //this.rgMain.show(new LytStations({id: id}));
    },

    individual: function(id) {
      this.rgMain.show(new LytIndividual({id: id}));
    },
    individuals: function() {
      this.rgMain.show(new LytIndividuals());
    },
    newIndividual: function(type) {
      this.rgMain.show(new LytIndividualsNew({type: type}));
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
    newSensor: function(type) {
      this.rgMain.show(new LytSensorsNew({type: type}));
    },


    validate: function() {
      this.rgMain.show(new LytSensorValidate());
    },
    validateType: function(type) {
      this.rgMain.show(new LytSensorValidateType({
        type: type
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
