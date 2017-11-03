define([
  'marionette',

  './base/home/lyt-home',

  './modules/importFile/lyt-entry-importFile',
  './modules/export/lyt-export-stepper',

  './modules/validate/validate.st.view',
  './modules/validate/validate.nd.view',
  './modules/validate/validate.rd.view',

  './modules/release/release.view',
  './modules/release/release.individual.view',

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

  './modules/projects/project.view',
  './modules/projects/projects.view',
  './modules/projects/projects.new.view',

  './modules/clients/client.view',
  './modules/clients/clients.view',
  './modules/clients/clients.new.view',
  './modules/importHistory/history.view',

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
  LytMonitoredSite, LytMonitoredSites, LytMonitoredSitesNew,
  LytProject, LytProjects, LytProjectsNew,
  LytClient, LytClients, LytClientsNew,
  LytImportHistory

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
        'projects': {
          'entity': LytProject,
          'entities': LytProjects,
          'newEntity': LytProjectsNew
        },
        'clients': {
          'entity': LytClient,
          'entities': LytClients,
          'newEntity': LytClientsNew
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

    importHistory: function(type) {
      this.rgMain.show(new LytImportHistory());
    },

    station: function(id, proto, obs) {
      if(this.rgMain.currentView instanceof LytStation){
        this.rgMain.currentView.reload({
          id: id,
          proto: proto,
          obs: obs
        });
      } else {
        this.rgMain.show(new LytStation({
          id: id,
          proto: proto,
          obs: obs
        }));
      }
    },

    stations: function(params) {
      this.rgMain.show(new LytStations({
        params: params
      }));
    },

    newStation: function(from) {
      this.rgMain.show(new LytStationsNew({from: from}));
    },

    project: function(id) {
      if(this.rgMain.currentView instanceof LytProject){
        this.rgMain.currentView.reload({
          id: id
        });
      } else {
        this.rgMain.show(new LytProject({
          id: id
        }));
      }
    },

    projects: function(params) {
      this.rgMain.show(new LytProjects({
        params: params
      }));
    },

    newProject: function(from) {
      this.rgMain.show(new LytProjectsNew({from: from}));
    },

    client: function(id) {
      if(this.rgMain.currentView instanceof LytClient){
        this.rgMain.currentView.reload({
          id: id
        });
      } else {
        this.rgMain.show(new LytClient({
          id: id
        }));
      }
    },

    clients: function(params) {
      this.rgMain.show(new LytClients({
        params: params
      }));
    },

    newClient: function(from) {
      this.rgMain.show(new LytClientsNew({from: from}));
    },

    individual: function(id) {
      if(this.rgMain.currentView instanceof LytIndividual){
        this.rgMain.currentView.reload({
          id: id
        });
      } else {
        this.rgMain.show(new LytIndividual({
          id: id
        }));
      }
    },

    individuals: function() {
      this.rgMain.show(new LytIndividuals());
    },

    newIndividual: function(objectType) {
      this.rgMain.show(new LytIndividualsNew({objectType: objectType}));
    },

    monitoredSite: function(id) {
      if(this.rgMain.currentView instanceof LytMonitoredSite){
        this.rgMain.currentView.reload({
          id: id
        });
      } else {
        this.rgMain.show(new LytMonitoredSite({
          id: id
        }));
      }
    },

    monitoredSites: function() {
      this.rgMain.show(new LytMonitoredSites());
    },

    newMonitoredSite: function(type) {
      this.rgMain.show(new LytMonitoredSitesNew());
    },

    sensor: function(id) {
      if(this.rgMain.currentView instanceof LytSensor){
        this.rgMain.currentView.reload({
          id: id
        });
      } else {
        this.rgMain.show(new LytSensor({
          id: id
        }));
      }
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

    validateDetail: function(type, index){
      if(this.rgMain.currentView instanceof LytSensorValidateDetail){
        this.rgMain.currentView.reload({
          type: type,
          index: index
        });
      } else {
        this.rgMain.show(new LytSensorValidateDetail({
          type: type,
          index: index
        }));
      }
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

  });
});
