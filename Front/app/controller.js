define(['marionette', 'config',

  './base/home/lyt-home',

  /*==========  modules  ==========*/

  './modules/stations/layouts/lyt-stations',
  './modules/stations/layouts/lyt-station-new',

  './modules/importFile/lyt-entry-importFile',

<<<<<<< HEAD
	'./modules/sensor/layouts/lyt-sensor',
	'./modules/sensor/layouts/lyt-sensor-new',

	'./modules/monitoredSite/layouts/lyt-ms',
	'./modules/monitoredSite/layouts/lyt-new-site',
	'./modules/validate/lyt-sensorValidate',
	'./modules/validate/lyt-sensorValidateType',
	'./modules/validate/lyt-sensorValidateDetail',
	'./modules/release/layouts/lyt-release-station',

	'./modules/export/lyt-export-stepper',

],function(Marionette, config,
	LytHome,

	/*==========  modules  ==========*/

	LytStations,
	LytStationsNew,

	LytImportFile,
	LytIndividual,
	LytIndividualNew,
	LytIndivDetails,

	LytSensor,
	LytSensorNew,

	LytMonitoredSite,
	LytMonitoredNew,
	LytSensorValidate,
	LytSensorValidateType,
	LytSensorValidateDetail,

	LytReleaseStation,

	LytExport
=======
  './modules/individuals/layouts/lyt-individuals',
  './modules/individuals/layouts/lyt-individuals-new',
  './modules/individuals/layouts/lyt-individuals-detail',

  './modules/sensors/layouts/lyt-sensors',
  './modules/sensors/layouts/lyt-sensors-new',

  './modules/monitoredSites/layouts/lyt-ms',
  './modules/monitoredSites/layouts/lyt-ms-new',

  './modules/validate/lyt-sensorValidate',
  './modules/validate/lyt-sensorValidateType',
  './modules/validate/lyt-sensorValidateDetail',
  './modules/release/layouts/lyt-release-station',

  './modules/export/lyt-export-stepper',

],function(Marionette, config,
  LytHome,

  /*==========  modules  ==========*/

  LytStations,
  LytStationsNew,

  LytImportFile,

  LytIndividuals,
  LytIndividualsNew,
  LytIndivDetails,

  LytSensors,
  LytSensorsNew,

  LytMonitoredSites,
  LytMonitoredSitesNew,

  LytSensorValidate,
  LytSensorValidateType,
  LytSensorValidateDetail,

  LytReleaseStation,

  LytExport
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca

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

    stations: function(id) {
      this.rgMain.show(new LytStations({id: id}));
    },
<<<<<<< HEAD

    newStation: function() {
      this.rgMain.show(new LytStationsNew());
    },

    individual: function(id) {
      this.rgMain.show(new LytIndividual({id: id}));
    },

    newIndividual: function(type) {
      this.rgMain.show(new LytIndividualNew({type: type}));
    },

    sensor: function(id) {
      this.rgMain.show(new LytSensor({id: id}));
    },

    newSensor: function(type) {
      this.rgMain.show(new LytSensorNew({type: type}));
    },

    monitoredSite: function(id) {
      this.rgMain.show(new LytMonitoredSite({id: id}));
    },
    newMonitoredSite: function(type) {
      this.rgMain.show(new LytMonitoredNew());
=======
    newStation: function(from) {
      this.rgMain.show(new LytStationsNew({from: from}));
    },

    individuals: function(id) {
      this.rgMain.show(new LytIndividuals({id: id}));
    },
    newIndividual: function(type) {
      this.rgMain.show(new LytIndividualsNew({type: type}));
    },

    sensors: function(id) {
      this.rgMain.show(new LytSensors({id: id}));
    },
    newSensor: function(type) {
      this.rgMain.show(new LytSensorsNew({type: type}));
    },

    monitoredSites: function(id) {
      this.rgMain.show(new LytMonitoredSites({id: id}));
    },
    newMonitoredSite: function(type) {
      this.rgMain.show(new LytMonitoredSitesNew());
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
    },

    validate: function() {
      this.rgMain.show(new LytSensorValidate());
    },
<<<<<<< HEAD

=======
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
    validateType: function(type) {
      this.rgMain.show(new LytSensorValidateType({
        type: type
      }));
    },

<<<<<<< HEAD
    release: function() {
      this.rgMain.show(new LytReleaseStation());
=======
    release: function(id) {
      console.log(id);
      // (id of the station..)
      this.rgMain.show(new LytReleaseStation({id : id}));
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
    },

    export: function() {
      this.rgMain.show(new LytExport());
    },

  });
});
