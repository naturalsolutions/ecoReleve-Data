define(['marionette', 'config',

  './base/home/lyt-home',

  /*==========  modules  ==========*/

  './modules/stations/layouts/lyt-stations',
  './modules/stations/layouts/lyt-station-new',

  './modules/importFile/lyt-entry-importFile',

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
  './modules/validate/lyt-camTrapValidateDetail',
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
  LytCamTrapValidateDetail,

  LytReleaseStation,

  LytExport

) {
  'use strict';

  return Marionette.Object.extend({

    initialize: function() {
      this.rgMain = window.app.rootView.rgMain;
      this.rgHeader = window.app.rootView.rgHeader;
      this.rgFooter = window.app.rootView.rgFooter;
    },

    home: function() {
      this.checkAjax();
      Backbone.history.navigate('');
      this.rgMain.show(new LytHome());
    },

    importFile: function() {
      this.checkAjax();
      this.rgMain.show(new LytImportFile());
    },

    stations: function(id) {
      this.checkAjax();
      this.rgMain.show(new LytStations({id: id}));
    },
	observations: function(id) {
		console.log('************** OBSERVATIONS ************************');
		 $.ajax({
                context: this,
                url: config.coreUrl + 'protocols/' + id,
            }).done(function (data) {
				window.location.href = window.location.origin + window.location.pathname + '#stations/' + data['FK_Station'] + '?observation=' + id ;
				console.log(data);
			}) ;
      //this.rgMain.show(new LytStations({id: id}));
    },
    newStation: function(from) {
      this.checkAjax();
      this.rgMain.show(new LytStationsNew({from: from}));
    },

    individuals: function(id) {
      this.checkAjax();
      this.rgMain.show(new LytIndividuals({id: id}));
    },
    newIndividual: function(type) {
      this.checkAjax();
      this.rgMain.show(new LytIndividualsNew({type: type}));
    },

    sensors: function(id) {
      this.checkAjax();
      this.rgMain.show(new LytSensors({id: id}));
    },
    newSensor: function(type) {
      this.checkAjax();
      this.rgMain.show(new LytSensorsNew({type: type}));
    },

    monitoredSites: function(id) {
      this.checkAjax();
      this.rgMain.show(new LytMonitoredSites({id: id}));
    },
    newMonitoredSite: function(type) {
      this.checkAjax();
      this.rgMain.show(new LytMonitoredSitesNew());
    },

    validate: function() {
      this.checkAjax();
      this.rgMain.show(new LytSensorValidate());
    },
    validateType: function(type) {
      this.checkAjax();
      this.rgMain.show(new LytSensorValidateType({
        type: type
      }));
    },

    release: function(id) {
      // (id of the station..)
      this.checkAjax();
      this.rgMain.show(new LytReleaseStation({id : id}));
    },

    export: function() {
      this.checkAjax();
      this.rgMain.show(new LytExport());
    },
    checkAjax : function(){
      var xhrPool = window.xhrPool;
      console.log('new route :');
      console.log(window.xhrPool);

      for(var i=0; i<xhrPool.length; i++){
         xhrPool[i].abort();
      }
       window.xhrPool = [];
    }

  });
});
