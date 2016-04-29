
/**
  TODO:
  - fitBounds
  - find a way to automaticly destroy the map with the related view
  ----> replace the prototype by a marionnette view?
**/


/*
  Offset Draft!
  // Calculate the offset
  var offset = this.map.getSize().x*0.15;
  // Then move the map
  //this.map.panBy(new L.Point(-offset, 0), {animate: false});
*/

define([
  'config',
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'L',
  'leaflet_cluster',
  'googleLoaer',
  'leaflet_google',
  'config',

], function(config, $, _, Backbone , Marionette, L, cluster, GoogleMapsLoader
    ) {

  'use strict';  
  // I am the internal, static counter for the number of Coms
  // that have been created in the system. This is used to
  // power the unique identifier of each instance.
  var instanceCount = 0;


  // I get the next instance ID.
  var getNewInstanceID = function(){

      // Precrement the instance count in order to generate the
      // next value instance ID.
      return( ++instanceCount );
  };


  function Map(options){
    // Store the private instance id.
    this._instanceID = getNewInstanceID();
    //check if there is a communicator
    if(options.com){
      this.com = options.com;
      this.com.addModule(this);
    }

    this.totalElt = options.totalElt || false;

    this.url = options.url;
    this.geoJson = options.geoJson;

    this.elem = options.element || 'map';
    this.zoom = config.mapZoom;
    this.disableClustring = options.disableClustring || 18;
    this.bbox = options.bbox || false;
    this.area = options.area || false;
    this.cluster = options.cluster || false;
    this.popup = options.popup || false;
    this.legend = options.legend || false;
    this.selection = options.selection || false;

    this.dict = {}; //list of markers
    this.selectedMarkers = {}; // list of selected markers
    this.geoJsonLayers = [];

    this.lastImported = false;

    this.init();
  }

  Map.prototype = {

    destroy: function(){
      this.map.remove();
    },

    action: function(action, params){
      switch(action){
        case 'focus':
          this.focus(params);
          break;
        case 'selection':
          this.selectOne(params);
          break;
        case 'selectionMultiple':
          this.selectMultiple(params);
          break;
        case 'popup':
          this.popup(params);
          break;
        case 'resetAll':
          this.resetAll();
          break;
        case 'selectAll':
          this.selectAll();
          break;
        case 'filter':
          this.filter(params);
          break;
        default:
          break;
      }
    },

    interaction: function(action, id){
      if(this.com){
        this.com.action(action, id);
      }else{
        this.action(action, id);
      }
    },

    init: function(){
      //set defaults icons styles
      L.Icon.Default.imagePath = 'bower_components/leaflet/dist/images';
      this.focusedIcon = new L.DivIcon({className   : 'custom-marker focus'});
      this.selectedIcon = new L.DivIcon({className  : 'custom-marker selected'});
      this.icon = new L.DivIcon({className      : 'custom-marker'});

      this.setCenter(this.geoJson);

      this.map = new L.Map(this.elem, {
        center: this.center ,
        zoom: this.zoom,
        minZoom: 2,
        inertia: false,
        zoomAnimation: true,
        keyboard: false, //fix scroll window
        attributionControl: false,
      });
      this.google();

      if(this.url){
        this.requestGeoJson(this.url);
      }else{
        if (this.cluster){
          this.initClusters(this.geoJson);
        }else{
          this.initLayer(this.geoJson);
        }
        this.ready();
      }
    },

    move: function(){
      //draft for dynamic visualisation
      var features = {"type": "FeatureCollection", "features": [{"geometry": {"coordinates": [33.2795, -3.90556], "type": "Point"}, "properties": {"speed": -2.81, "sensor": "136", "date": "19/04/2015 06:43:40", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.28273, -3.88909], "type": "Point"}, "properties": {"speed": -0.073, "sensor": "136", "date": "19/04/2015 07:17:14", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.28303, -3.88907], "type": "Point"}, "properties": {"speed": -0.23, "sensor": "136", "date": "19/04/2015 07:44:31", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.28294, -3.88832], "type": "Point"}, "properties": {"speed": -0.232, "sensor": "136", "date": "19/04/2015 08:02:49", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.28364, -3.88757], "type": "Point"}, "properties": {"speed": -0.422, "sensor": "136", "date": "19/04/2015 08:29:42", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.28563, -3.88761], "type": "Point"}, "properties": {"speed": -0.323, "sensor": "136", "date": "19/04/2015 09:01:07", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.28418, -3.88928], "type": "Point"}, "properties": {"speed": -0.094, "sensor": "136", "date": "19/04/2015 09:42:44", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.28399, -3.88948], "type": "Point"}, "properties": {"speed": -0.123, "sensor": "136", "date": "19/04/2015 10:00:42", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.28299, -3.88895], "type": "Point"}, "properties": {"speed": -0.488, "sensor": "136", "date": "19/04/2015 11:00:22", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27915, -3.88705], "type": "Point"}, "properties": {"speed": -0.862, "sensor": "136", "date": "19/04/2015 11:57:10", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27862, -3.88682], "type": "Point"}, "properties": {"speed": -0.642, "sensor": "136", "date": "19/04/2015 12:01:33", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27521, -3.88234], "type": "Point"}, "properties": {"speed": -0.106, "sensor": "136", "date": "19/04/2015 12:54:09", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27525, -3.88222], "type": "Point"}, "properties": {"speed": -0.177, "sensor": "136", "date": "19/04/2015 13:00:56", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27401, -3.88103], "type": "Point"}, "properties": {"speed": -0.168, "sensor": "136", "date": "19/04/2015 14:00:48", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.2741, -3.88061], "type": "Point"}, "properties": {"speed": -0.178, "sensor": "136", "date": "19/04/2015 14:15:06", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27298, -3.88113], "type": "Point"}, "properties": {"speed": -0.068, "sensor": "136", "date": "19/04/2015 15:00:18", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27236, -3.88104], "type": "Point"}, "properties": {"speed": -0.17, "sensor": "136", "date": "19/04/2015 16:01:35", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27347, -3.88219], "type": "Point"}, "properties": {"speed": -0.229, "sensor": "136", "date": "19/04/2015 16:59:09", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27333, -3.88218], "type": "Point"}, "properties": {"speed": -0.132, "sensor": "136", "date": "19/04/2015 17:03:20", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27224, -3.8818], "type": "Point"}, "properties": {"speed": -0.058, "sensor": "136", "date": "19/04/2015 18:00:34", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27228, -3.8819], "type": "Point"}, "properties": {"speed": -0.128, "sensor": "136", "date": "19/04/2015 18:10:52", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27241, -3.88066], "type": "Point"}, "properties": {"speed": -0.051, "sensor": "136", "date": "19/04/2015 19:05:17", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.2724, -3.88048], "type": "Point"}, "properties": {"speed": -0.028, "sensor": "136", "date": "19/04/2015 19:25:27", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27248, -3.88028], "type": "Point"}, "properties": {"speed": -0.012, "sensor": "136", "date": "19/04/2015 20:09:51", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.2723, -3.88024], "type": "Point"}, "properties": {"speed": -0.018, "sensor": "136", "date": "19/04/2015 21:51:22", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27246, -3.88026], "type": "Point"}, "properties": {"speed": -0.005, "sensor": "136", "date": "19/04/2015 22:52:22", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.2725, -3.88024], "type": "Point"}, "properties": {"speed": -0.006, "sensor": "136", "date": "19/04/2015 23:56:41", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27245, -3.88029], "type": "Point"}, "properties": {"speed": -0.007, "sensor": "136", "date": "20/04/2015 01:05:15", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27248, -3.88021], "type": "Point"}, "properties": {"speed": -0.006, "sensor": "136", "date": "20/04/2015 02:18:08", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27241, -3.88022], "type": "Point"}, "properties": {"speed": -0.002, "sensor": "136", "date": "20/04/2015 03:35:22", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27239, -3.88022], "type": "Point"}, "properties": {"speed": -0.038, "sensor": "136", "date": "20/04/2015 04:51:55", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27247, -3.88076], "type": "Point"}, "properties": {"speed": -0.2, "sensor": "136", "date": "20/04/2015 06:12:15", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27144, -3.88269], "type": "Point"}, "properties": {"speed": -0.019, "sensor": "136", "date": "20/04/2015 07:16:04", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27152, -3.88257], "type": "Point"}, "properties": {"speed": -0.417, "sensor": "136", "date": "20/04/2015 08:00:06", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.2723, -3.88157], "type": "Point"}, "properties": {"speed": -0.13, "sensor": "136", "date": "20/04/2015 08:18:22", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27242, -3.8806], "type": "Point"}, "properties": {"speed": -0.008, "sensor": "136", "date": "20/04/2015 09:00:13", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27242, -3.88062], "type": "Point"}, "properties": {"speed": -0.403, "sensor": "136", "date": "20/04/2015 09:15:40", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.2745, -3.87829], "type": "Point"}, "properties": {"speed": -1.167, "sensor": "136", "date": "20/04/2015 10:02:53", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27441, -3.88375], "type": "Point"}, "properties": {"speed": -0.198, "sensor": "136", "date": "20/04/2015 10:28:57", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27447, -3.88489], "type": "Point"}, "properties": {"speed": -0.201, "sensor": "136", "date": "20/04/2015 11:01:06", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27483, -3.88659], "type": "Point"}, "properties": {"speed": -0.049, "sensor": "136", "date": "20/04/2015 11:49:43", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27479, -3.88668], "type": "Point"}, "properties": {"speed": -0.154, "sensor": "136", "date": "20/04/2015 12:00:38", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27573, -3.8859], "type": "Point"}, "properties": {"speed": -1.013, "sensor": "136", "date": "20/04/2015 12:50:02", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27643, -3.88421], "type": "Point"}, "properties": {"speed": -0.391, "sensor": "136", "date": "20/04/2015 13:00:24", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27355, -3.88159], "type": "Point"}, "properties": {"speed": -0.043, "sensor": "136", "date": "20/04/2015 14:02:09", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27339, -3.88147], "type": "Point"}, "properties": {"speed": -0.025, "sensor": "136", "date": "20/04/2015 14:31:42", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27342, -3.88159], "type": "Point"}, "properties": {"speed": -0.131, "sensor": "136", "date": "20/04/2015 15:01:01", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.2722, -3.88175], "type": "Point"}, "properties": {"speed": -0.077, "sensor": "136", "date": "20/04/2015 16:03:20", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27224, -3.88219], "type": "Point"}, "properties": {"speed": -0.232, "sensor": "136", "date": "20/04/2015 16:35:08", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27292, -3.88308], "type": "Point"}, "properties": {"speed": -0.091, "sensor": "136", "date": "20/04/2015 17:04:04", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27208, -3.88284], "type": "Point"}, "properties": {"speed": -0.14, "sensor": "136", "date": "20/04/2015 18:07:05", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27282, -3.88126], "type": "Point"}, "properties": {"speed": -0.041, "sensor": "136", "date": "20/04/2015 19:19:14", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27304, -3.88106], "type": "Point"}, "properties": {"speed": -0.006, "sensor": "136", "date": "20/04/2015 20:04:38", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27303, -3.88118], "type": "Point"}, "properties": {"speed": -0.009, "sensor": "136", "date": "20/04/2015 21:54:06", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27309, -3.8811], "type": "Point"}, "properties": {"speed": -0.006, "sensor": "136", "date": "20/04/2015 22:58:42", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27307, -3.88103], "type": "Point"}, "properties": {"speed": -0.009, "sensor": "136", "date": "21/04/2015 00:07:38", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27299, -3.8811], "type": "Point"}, "properties": {"speed": -0.002, "sensor": "136", "date": "21/04/2015 01:20:08", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27302, -3.88111], "type": "Point"}, "properties": {"speed": -0.005, "sensor": "136", "date": "21/04/2015 02:37:05", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27301, -3.88117], "type": "Point"}, "properties": {"speed": -0.024, "sensor": "136", "date": "21/04/2015 03:54:23", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27303, -3.88151], "type": "Point"}, "properties": {"speed": -0.235, "sensor": "136", "date": "21/04/2015 05:15:09", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27312, -3.88446], "type": "Point"}, "properties": {"speed": -0.113, "sensor": "136", "date": "21/04/2015 06:25:06", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27377, -3.88367], "type": "Point"}, "properties": {"speed": -0.093, "sensor": "136", "date": "21/04/2015 07:19:42", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27337, -3.8842], "type": "Point"}, "properties": {"speed": -0.517, "sensor": "136", "date": "21/04/2015 08:02:08", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27732, -3.88411], "type": "Point"}, "properties": {"speed": -0.074, "sensor": "136", "date": "21/04/2015 08:53:05", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.2774, -3.8841], "type": "Point"}, "properties": {"speed": -0.106, "sensor": "136", "date": "21/04/2015 09:00:25", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27726, -3.88414], "type": "Point"}, "properties": {"speed": -0.169, "sensor": "136", "date": "21/04/2015 09:09:28", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27597, -3.88416], "type": "Point"}, "properties": {"speed": -0.211, "sensor": "136", "date": "21/04/2015 10:00:15", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27423, -3.88505], "type": "Point"}, "properties": {"speed": -0.137, "sensor": "136", "date": "21/04/2015 11:00:05", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27465, -3.88578], "type": "Point"}, "properties": {"speed": -0.152, "sensor": "136", "date": "21/04/2015 11:36:03", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27496, -3.88632], "type": "Point"}, "properties": {"speed": -0.158, "sensor": "136", "date": "21/04/2015 12:00:09", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27541, -3.88794], "type": "Point"}, "properties": {"speed": -1.232, "sensor": "136", "date": "21/04/2015 13:00:42", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27484, -3.88672], "type": "Point"}, "properties": {"speed": -0.287, "sensor": "136", "date": "21/04/2015 13:07:02", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27333, -3.88464], "type": "Point"}, "properties": {"speed": -0.14, "sensor": "136", "date": "21/04/2015 14:00:30", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27344, -3.88479], "type": "Point"}, "properties": {"speed": -0.273, "sensor": "136", "date": "21/04/2015 14:08:39", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27192, -3.88303], "type": "Point"}, "properties": {"speed": -0.041, "sensor": "136", "date": "21/04/2015 15:00:14", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27165, -3.88271], "type": "Point"}, "properties": {"speed": -0.239, "sensor": "136", "date": "21/04/2015 16:01:08", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27296, -3.88442], "type": "Point"}, "properties": {"speed": -0.039, "sensor": "136", "date": "21/04/2015 16:55:05", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27292, -3.88447], "type": "Point"}, "properties": {"speed": -0.114, "sensor": "136", "date": "21/04/2015 17:04:12", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27208, -3.88349], "type": "Point"}, "properties": {"speed": -0.117, "sensor": "136", "date": "21/04/2015 18:12:21", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27275, -3.88278], "type": "Point"}, "properties": {"speed": -0.061, "sensor": "136", "date": "21/04/2015 19:03:03", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27238, -3.88311], "type": "Point"}, "properties": {"speed": -0.032, "sensor": "136", "date": "21/04/2015 19:52:57", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27242, -3.88327], "type": "Point"}, "properties": {"speed": -0.068, "sensor": "136", "date": "21/04/2015 20:23:22", "type": "GSM"}, "type": "Feature"}, {"geometry": {"coordinates": [33.27262, -3.88251], "type": "Point"}, "properties": {"speed": -0.022, "sensor": "136", "date": "21/04/2015 21:28:28", "type": "GSM"}, "type": "Feature"}], "type": "FeatureCollection"}
      features = features.features;

      var featuresList = [];
      var speed = [];

      for (var i = features.length - 1; i >= 0; i--) {
        featuresList.push(features[i].geometry.coordinates);
        speed.push(features[i].properties.speed*(-1)*6000);
      };



      var marker = L.Marker.movingMarker(featuresList, speed, {autostart: true}).addTo(this.map);
      
      L.polyline(featuresList, {color: 'rgba(0,0,0,0.7)', weight: 1}).addTo(this.map);
      
      //this.map.fitBounds(featuresList);

      marker.on('end', function() {
          marker.bindPopup('end', {closeOnClick: false})
          .openPopup();
      });
    },

    ready: function(){
      this.setTotal(this.geoJson);

      if(this.legend){
        this.addCtrl(tpl_legend);
      }
      if(this.markersLayer){
        this.addMarkersLayer();
      }

      this.initErrorLayer();
      this.displayError(this.geoJson);
    },

    google: function(){
      var _this = this;
      GoogleMapsLoader.done(function(){
        var CustomGMap = L.Google.extend({
          _initMapObject: function() {
            if (!this._ready) return;
            this._google_center = new google.maps.LatLng(0, 0);
            var map = new google.maps.Map(this._container, {
              center: this._google_center,
              zoom: 0,
              tilt: 0,
              mapTypeId: google.maps.MapTypeId[this._type],
              disableDefaultUI: true,
              keyboardShortcuts: false,
              draggable: false,
              scaleControl: true,
              disableDoubleClickZoom: true,
              scrollwheel: false,
              streetViewControl: false,
              styles: this.options.mapOptions.styles,
              backgroundColor: this.options.mapOptions.backgroundColor
            });

            var _that = this;
            this._reposition = google.maps.event.addListenerOnce(map, 'center_changed',
              function() { _that.onReposition(); });
            this._google = map;

            google.maps.event.addListenerOnce(map, 'idle',
              function() { _that._checkZoomLevels(); });
            //Reporting that map-object was initialized.
            this.fire('MapObjectInitialized', { mapObject: map });
          },
        });

        _this.googleLayer = new CustomGMap('HYBRID', {unloadInvisibleTiles: true,
          updateWhenIdle: true,
          reuseTiles: true
        });
        _this.map.addLayer(_this.googleLayer);
      }).fail(function(){
        console.error("ERROR: Google maps library failed to load");
      });
    },

    initClusters: function(geoJson){
      var firstLvl= true;
      this.firstLvl= [];
      var _this= this;
      var CustomMarkerClusterGroup = L.MarkerClusterGroup.extend({
        _defaultIconCreateFunction: function (cluster, contains) {
          //push on firstLvl
          if(firstLvl){
            _this.firstLvl.push(cluster);
          }
          if(_this.selection){
            return _this.getClusterIcon(cluster, false, 0);
          }else{
            return _this.getClusterIcon(cluster);
          }
        },
      });
      this.markersLayer = new CustomMarkerClusterGroup({
        disableClusteringAtZoom : this.disableClustring, //2km
        maxClusterRadius: 100,
        polygonOptions: {color: "rgb(51, 153, 204)", weight: 2},
      });
      this.setGeoJsonLayer(geoJson);
    },

    addMarkersLayer: function(){
      if(this.geoJsonLayers.length !== 0){
        for (var i = 0; i < this.geoJsonLayers.length; i++) {
          this.markersLayer.addLayers(this.geoJsonLayers[i]);
          for (var j = 0; j < this.geoJsonLayers[i].length; j++) {
            delete this.geoJsonLayers[i][j];
          };
/*          this.geoJsonLayers[i].length = 0;
          this.geoJsonLayers[i] = [];
          delete this.geoJsonLayers[i];
          this.geoJsonLayers.length = 0;
          this.geoJsonLayers = [];
          delete this.geoJsonLayers;*/
        }
      }

      this.map.addLayer(this.markersLayer);

      if(this.area){
        this.addArea();
      }

      if(this.bbox){
        this.addBBox(this.markersLayer);
      }
    },

    resize: function(){
      //todo: should be a better way
      this.map._onResize();
    },

    addCtrl: function(legend){
      var MyControl = L.Control.extend({
          options: {
              position: 'topright'
          },
          onAdd: function (map) {
              var lg = $.parseHTML(legend);
              return lg[0];
          }
      });
      this.map.addControl(new MyControl());
    },

    requestGeoJson: function(url){
      var _this = this;
      var criterias = {
          page: 1,
          per_page: 20,
          criteria: null,
          offset: 0,
          order_by: '[]',
      };

      this.deffered = $.ajax({
        url: url,
        contentType:'application/json',
        type:'GET',
      }).done(function(geoJson) {
          if (_this.cluster){
            _this.initClusters(geoJson);
            _this.geoJson = geoJson;
            
            _this.ready();
            /*setTimeout(function(){
              _this.addMarkersLayer();
            }, 1000);*/
          }else{
            /*
            _this.initLayer(geoJson);
            _this.geoJson = geoJson;
            */
          }
      }).fail(function(msg) {
          console.error( msg );
      });
    },

    changeIcon: function(m){
      if (m.checked) {
        m.setIcon(this.selectedIcon);
      }else{
        m.setIcon(this.icon);
      }
      if (m == this.lastFocused) {
        $(m._icon).addClass('focus');
      }
    },

    setCenter: function(geoJson){
      if(!geoJson || (geoJson.features.length == 0) ){
        this.center = new L.LatLng(30,0);
      }else{
        this.center = new L.LatLng(
          geoJson.features[0].geometry.coordinates[0],
          geoJson.features[0].geometry.coordinates[1]
        );
      }
      if(this.map){

        //todo : 2 optimize, leafleft center function bugs
        this.map.panTo(this.center, {animate: false});
      }
    },

    initLayer: function(geoJson){
      if(geoJson){
        this.markersLayer = new L.FeatureGroup();
        this.setGeoJsonLayer(geoJson);
      }else{
        this.setCenter();
      }
    },

    setGeoJsonLayer: function(geoJson){
      this.setCenter(geoJson);
      var marker, prop;
      var _this = this;
      var i =0;

      var markerList = [];

      var features = geoJson.features;
      var feature, latlng;

      for (var j = 0; j < features.length; j++) {
        feature = features[j];
        if(feature.geometry.coordinates[1] != null && feature.geometry.coordinates[0] != null){
          latlng = L.latLng(feature.geometry.coordinates[0], feature.geometry.coordinates[1]);
          i++;
          var infos = '';
          if (!feature.id) {
            feature.id = i;
            if (feature.properties.ID) {
              feature.id = feature.properties.ID;
            }
          }
          if(feature.checked){
            marker = L.marker(latlng, {icon: _this.focusedIcon});
          }else{
            marker = L.marker(latlng, {icon: _this.icon});
          }

          marker.checked=false;

          if(_this.popup){
            prop = feature.properties;
            for(var p in prop){
              infos +='<b>'+p+' : '+prop[p]+'</b><br />';
            }
            marker.bindPopup(infos);
          }

          marker.feature = feature;

          _this.dict[feature.id] = marker;

          marker.on('click', function(e){
            if(_this.selection){
              _this.interaction('selection', this.feature.id);
            }
            _this.interaction('focus', this.feature.id);
          });
          markerList.push(marker);
        }else{
          console.warn('latlng null');
        }
      }
      this.geoJsonLayers.push(markerList);
    },


    getClusterIcon: function(cluster, contains, nbContains){
      var childCount = cluster.getChildCount();
      var classe = 'marker-cluster marker-cluster-';
      var size = 30;
      if (childCount < 10) {
        size+=5;
        classe += 'small';
      } else if (childCount < 100) {
        size+=15;
        classe += 'medium';
      } else if (childCount < 1000) {
        size+= 25;
        classe += 'medium-lg';
      } else {
        size+= 35;
        classe += 'large';
      }

      if(!contains && nbContains !== 0){
        return new L.DivIcon({ html: '<span>'+childCount+'</span>', className: classe, iconSize: new L.Point(size, size) });
      }

      if(contains){
        classe +=' marker-cluster-contains';
      }

      return new L.DivIcon({
        html: '<span>' + nbContains + ' / ' + childCount +'</span>',
        className: classe,
        iconSize: new L.Point(size, size)
      });
    },

    /*==========  updateClusterParents :: display selection inner cluster from childs to parents ==========*/
    updateClusterParents: function(m, parents){
      if(this.cluster){
        var c=m.__parent;
        if(m.__parent){
          parents.push(m.__parent);

          m.__parent.setIcon(this.selectedIcon);

          this.updateClusterParents(m.__parent, parents);

          var childMarkers = c.getAllChildMarkers();
          var childCount = c.getChildCount();

          var nbContains=0;
          var contains=false;

          for (var i = 0; i < childMarkers.length; i++) {
            if(childMarkers[i].checked){
              nbContains++;
              contains=true;
            }else{
              if(nbContains===0){
                contains=false;
              }
            }
          }

          var icon = this.getClusterIcon(c, contains, nbContains);
          c.setIcon(icon);
        }
      }
    },
    /** from parent to child */
    updateAllClusters: function(c, all){

      this.updateClusterStyle(c, all);
      var childs = c.getAllChildMarkers();

      for (var i = childs.length - 1; i >= 0; i--) {
        childs[i].checked = true;
        this.selectedMarkers[childs[i].feature.id] = childs[i];
        this.changeIcon(childs[i]);
      }

      var childClusters = c._childClusters;
      for (var i = childClusters.length - 1; i >= 0; i--) {
        this.updateClusterStyle(childClusters[i], all);
        this.updateAllClusters(childClusters[i], all);

      }

      return;
    },

    //updateClusterChilds :: check if you must change cluster style for all cluster or for none
    updateClusterStyle: function(c, all){
      var childCount = c.getChildCount();
      var icon;
      if(all){
        icon = this.getClusterIcon(c, true, childCount);
      }else{
        icon = this.getClusterIcon(c, false, 0);
      }
      c.setIcon(icon);
    },

    addBBox: function(markers){
      var _this = this;

      var marker, childs;

      this.map.boxZoom.onMouseUp = function(e){
        this._finish();

        var map = this._map,
            layerPoint = map.mouseEventToLayerPoint(e);

        if (this._startLayerPoint.equals(layerPoint)) { return; }

        var bounds = new L.LatLngBounds(
                map.layerPointToLatLng(this._startLayerPoint),
                map.layerPointToLatLng(layerPoint));

        map.fire('boxzoomend', {
          boxZoomBounds: bounds
        });
      };

      this.map.on('boxzoomend', function(e) {

        var bbox=[], childIds=[];
        for(var key in  markers._featureGroup._layers){
          marker =  markers._featureGroup._layers[key];
          if (e.boxZoomBounds.contains(marker._latlng) /*&& !_this.selectedMarkers[key]*/) {

              if(!marker._markers){
                bbox.push(marker.feature.id);
              }else{
                childs = marker.getAllChildMarkers();

                //bad functionName
                _this.updateAllClusters(marker, true);

                for (var i = childs.length - 1; i >= 0; i--) {
                  childs[i].checked = true;
                  _this.selectedMarkers[childs[i].feature.id] = childs[i];
                  bbox.push(childs[i].feature.id);

                  _this.changeIcon(childs[i]);
                }
                if(marker.__parent){
                    _this.updateClusterParents(marker, []);
                }
              }
          }
        }
        _this.interaction('selectionMultiple', bbox);
        $(_this).trigger('ns_bbox_end', e.boxZoomBounds);
      });
    },

    addArea: function(){
      var _this = this;

      this.map.boxZoom.onMouseUp = function(e){
        this._finish();

        var map = this._map,
            layerPoint = map.mouseEventToLayerPoint(e);

        if (this._startLayerPoint.equals(layerPoint)) { return; }

        var bounds = new L.LatLngBounds(
                map.layerPointToLatLng(this._startLayerPoint),
                map.layerPointToLatLng(layerPoint));

        map.fire('boxzoomend', {
          boxZoomBounds: bounds
        });
      };

      this.map.on('boxzoomend', function(e) {
        $(_this).trigger('ns_bbox_end', e.boxZoomBounds);
      });
    },

    selectOne: function(id){
      if(this.selection){
      var marker;
        marker=this.dict[id];
        marker.checked=!marker.checked;
        if(marker.checked){
          this.selectedMarkers[id]=marker;
        }else{
          delete(this.selectedMarkers[id]);
        }
        this.changeIcon(marker);
        this.updateClusterParents(marker, []);
      }
    },

    avoidDoublon: function(id, marker){
      if(!this.selectedMarkers[id])
        this.selectedMarkers[id] = marker;
    },

    //from child to parent
    selectMultiple: function(ids){
      if(this.selection){
      var marker;
      for (var i = 0; i < ids.length; i++) {
        marker=this.dict[ids[i]];
        marker.checked = true;

        this.avoidDoublon(ids[i], marker);

        this.changeIcon(marker);
        this.updateClusterParents(marker, []);
      }
      }
    },

    /*==========  focusMarker :: focus & zoom on a point  ==========*/
    focus: function(id, zoom){
      if (!isNaN(id)){
        id = parseInt(id);
      }
      var _this = this;
      var marker = this.dict[id];
      var center = marker.getLatLng();
      var zoom = this.disableClustring;

      if(this.lastFocused){
        $(this.lastFocused._icon).removeClass('focus')
      }
      this.lastFocused = marker;

      $(this.lastFocused._icon).addClass('focus');

      _this.map.setView(center, zoom);

    },

    /*==========  resetMarkers :: reset a list of markers  ==========*/
    addMarker: function(m, lat, lng, popup, icon){
      if(m){
        m.addTo(this.map);
      }else{
        m = new L.marker([lat, lng]);
        if(popup){
          m.bindPopup(popup);
        }
        if(icon){
          m.setIcon(icon);
        }
        m.addTo(this.map);
      }

      if(this.lastMarker){
        this.map.removeLayer(this.lastMarker);
      }
      this.lastMarker = m;
      var center = m.getLatLng();
      this.map.panTo(center, {animate: false});

      return m;
    },

    /*==========  updateMarkerPos  ==========*/
    updateMarkerPos: function(id, lat, lng , zoom){
      var marker = this.dict[id];
      var latlng = new L.latLng(lat, lng);
      marker.setLatLng(latlng);

      if(zoom){
        this.focus(id, zoom);
      }else{
        this.focus(id, false);
      }
    },

    resetAll: function(){
      console.log(this.geoJson);
      this.updateLayers(this.geoJson);
    },

    selectAll: function(){
      var firstProp, layers = this.markersLayer._featureGroup._layers;
      
      //get the first layer (marker cluster)
      for(var key in layers) {
          if(layers.hasOwnProperty(key)) {
              firstProp = layers[key];
              break;
          }
      }

      //get the top parent from a marker or a cluster
      while(firstProp.__parent){
        firstProp = firstProp.__parent;
      }

      this.topParent = firstProp;

      this.updateAllClusters(firstProp, true);
    },

    /*
    popup: function(id){
      var marker = this.dict[id];
      marker.openPopup();
    },*/

    //convert a BB collection to a feature collection (geoJson)
    coll2GeoJson: function(coll){
        var features = {
            'features': [],
            'type': 'FeatureCollection'
        };
        var feature, attr;
        coll.each(function(m){
            attr = m.attributes;
            feature = {
                'type': 'Feature',
                'id': attr.id,
                'geometry': {
                    'type': 'Point',
                    'coordinates': [attr.latitude, attr.longitude],
                },
                'properties': {
                  //todo
                },
            };
            features.features.push(feature);
        });
        return features;
    },

    updateFromServ: function(param){
      var _this = this;
      if(param)
        this.searchCriteria = param;
      //station last imported?
      if(this.lastImported){
        var data = {
          'criteria': JSON.stringify(this.searchCriteria),
          'lastImported' : this.lastImported,
        };
      }else{
        var data = {
          'criteria': JSON.stringify(this.searchCriteria),
        };
      }

      $.ajax({
        url: this.url,
        data: data,
      }).done(function(geoJson) {
        if (_this.cluster){
          _this.updateLayers(geoJson);
        }else{
          _this.initLayer(geoJson);
        }
      });
      return;
    },


    lastImportedUpdate: function(lastImported){
      this.lastImported = lastImported;
      this.updateFromServ();
    },
    //apply filters on the map from a collection

    //param can be filters or directly a collection
    filter: function(param){
      //TODO : refact
      var _this = this;
      if(this.url){
        this.updateFromServ(param);
        return;
      }else{
      var geoJson;
      var coll = _.clone(param);
      geoJson = this.coll2GeoJson(coll);
      this.geoJson = geoJson;
      coll = param;
        if(coll.length){
          this.updateLayers(geoJson);
        }else{
          this.map.removeLayer(this.markersLayer);
          this.geoJsonLayers = [];
        }
        var checkedMarkers = [];
        for (var i = coll.models.length - 1; i >= 0; i--) {
          //todo : generic term (import)
          if(coll.models[i].attributes.import)
            checkedMarkers.push(coll.models[i].attributes.id);
        }
        //todo : amelioration
        this.selectMultiple(checkedMarkers);
      }
    },

    setTotal: function(geoJson) {
      if(this.totalElt){
        this.total =  geoJson.total;
        this.totalElt.html(this.total);
      }
    },


    //todo : refact
    initErrorLayer: function() {
      var elem = '<div id="errorLayer" class="errorLayer hidden"><legend><span class="glyphicon glyphicon-warning-sign"></span><span class="msg"></span></legend></div>';
      $('#'+this.elem).append(elem);
      this.errorElt = $('#'+this.elem + ' #errorLayer');
    },

    displayError: function(geoJson){
      this.errorElt.addClass('hidden');
      var msg;
      if(geoJson){
        if (!geoJson.features.length) {
          msg = ' No data to display';
          this.errorElt.removeClass('hidden');
          this.errorElt.find('.msg').html(msg);
        }
        if (geoJson.exceed) {
          msg = ' Too much data to display';
          this.errorElt.removeClass('hidden');
          this.errorElt.find('.msg').html(msg)
        }
      }
    },

    updateLayers: function(geoJson) {
      this.displayError(geoJson);
      //?
      if(geoJson == false){
        if(this.markersLayer){
          this.map.removeLayer(this.markersLayer);
        }
        return false;
      }

      if(this.markersLayer){
        this.map.removeLayer(this.markersLayer);
      }
      this.geoJsonLayers = [];
      if(geoJson.features.length){
        this.initClusters(geoJson);
        this.addMarkersLayer();
      }
      if(this.bbox){
        this.addBBox(this.markersLayer);
      }
      this.setTotal(geoJson);
    },
  }
  return( Map );
});
