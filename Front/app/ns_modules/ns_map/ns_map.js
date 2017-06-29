
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
  'moment',
  'L',
  'leaflet_cluster',
  'googleLoaer',
  'leaflet_google',
  'config',

], function(config, $, _, Backbone , Marionette, moment, L, cluster, GoogleMapsLoader
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

    if (options.idName)  {
      this.idName = options.idName;
    }

    if (options.lonName)  {
      this.lonName = options.lonName;
    }

    if (options.latName)  {
      this.latName = options.latName;
    }
    this.totalElt = options.totalElt || false;

    this.url = options.url;
    this.geoJson = options.geoJson;

    this.elem = options.element || 'map';
    this.zoom = config.mapZoom;
    this.disableClustering = options.disableClustering || 16;
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

    action: function(action, params, from){
      if(this[action]){
        this[action](params, from);
      } else {
        console.warn(this, 'doesn\'t have ' + action + ' action');
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
      var _this = this;
      //set defaults icons styles
      L.Icon.Default.imagePath = 'bower_components/leaflet/dist/images';
      this.selectedIcon = new L.DivIcon({className  : 'custom-marker selected'});
      this.icon = new L.DivIcon({className      : 'custom-marker'});

      this.setCenter(this.geoJson);

      this.map = new L.Map(this.elem, {
        center: this.center ,
        zoom: this.zoom,
        minZoom: 2,
        maxZoom : 18,
        inertia: false,
        zoomAnimation: true,
        keyboard: false, //fix scroll window
        attributionControl: false,
      });

      this.google.defered  = this.google();
      $.when(this.google.defered).always(function(){
        if(_this.url){
          _this.requestGeoJson(_this.url);
        }else{
          if (_this.cluster){
            _this.initClusters(_this.geoJson);
          }else{
            _this.initLayer(_this.geoJson);
          }
          _this.ready();
        }
      });

    },

    ready: function(){
      this.setTotal(this.geoJson);

      if(this.legend){
        this.addLegend();
      }
      if(this.markersLayer){
        this.addMarkersLayer();
      }

      this.initErrorLayer();
      this.displayError(this.geoJson);
    },

    google: function(){
      var _this = this;

      return GoogleMapsLoader.done(function(){
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
        console.error('Google maps library failed to load');
      });
    },

    //Player
    //return an object where positions are indexed by their offset (from firstDate) in ms
    setValuesFromSpeed: function(geoJson, x){

      var dayInMs = 86400000;
      var speed = x / dayInMs;

      var obj = {};
      var ms;

      var firstDate = geoJson.features[0].properties.Date;

      var _date2;

      //2 recalculate if speed changes

      for (var i = 0; i < geoJson.features.length; i++) {

        _date2 = geoJson.features[i].properties.Date;

        ms = moment(_date2, 'DD/MM/YYYY HH:mm:ss').diff(moment(firstDate,'DD/MM/YYYY HH:mm:ss'));
        ms = speed * ms;
        ms = Math.floor(ms / 10) * 10;

        obj[ms] = geoJson.features[i];
      }

      this.p_indexedPositions = obj;
      
      this.p_relDuration = speed * this.p_realDuration;

      $('.js-time-total').html(this.msToReadable(this.p_relDuration));
    },
  
    msToReadable: function(ms){
      ms = Math.round(ms);

      var seconds = String(Math.floor(ms / 1000) % 60);

      if(seconds.length == 1){
        seconds = '0' + seconds;
      }

      var minutes = String(Math.floor(ms / 1000 / 60) % 60);
      if(minutes.length == 1){
        minutes = '0' + minutes;
      }

      var hours   = String(Math.floor(ms / (1000 * 60 * 60)) % 24);
      if(hours.length == 1){
        hours = '0' + hours;
      }
      return hours + ':' + minutes + ':' + seconds;
    },

    showPlayer: function(){
      $('#map').css('height', '90%');
      $('#map').parent().append('\
      <div class="player">\
      <div class="timeline col-xs-12">\
        <div class="js-timeline-total timeline-total"></div>\
        <div class="js-timeline-current timeline-current"></div>\
      </div>\
      <div class="col-xs-12">\
        <span class="js-time-current"></span>\
        <span class="pull-right">Total duration: <span class="js-time-total"></span></span>\
      </div>\
      <div class="col-xs-6">\
        <button class="js-player-prev btn"><i class="reneco reneco-rewind"></i></button>\
        <button class="js-player-play btn"><i class="reneco reneco-play"></i></button>\
        <button class="js-player-pause btn"><i class="reneco reneco-pause"></i></button>\
        <button class="js-player-next btn"><i class="reneco reneco-forward"></i></button>\
      </div>\
      <div class="col-xs-3 pull-right">\
        <input id="speed" min=1000 max=24000 value=1000 step=1000 width="100" type="range">\
      </div>\
      </div>\
      ');
    },

    difference: function(geoJson){
      var _this = this;
      var speed = 10000;

      this.showPlayer();

      var firstDate = geoJson.features[0].properties.Date;

      _this.map.setView(geoJson.features[0].geometry.coordinates, 10/*, zoom*/);
      var lastDate = geoJson.features[geoJson.features.length - 1].properties.Date;
        
      this.p_realDuration = moment(lastDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(firstDate,'DD/MM/YYYY HH:mm:ss'));

      this.setValuesFromSpeed(geoJson, speed);

      this.time = 0;
      this.p_markers = [];

      var offset = 10;

      this.timer = setInterval(frame, offset);

      function frame() {
        if(_this.time % 1000 === 0){
          $('.js-time-current').html(_this.msToReadable(_this.time));
        }

        if(_this.time >= _this.p_relDuration) {
          clearInterval(_this.timer);
        } else {

          if(_this.p_indexedPositions[_this.time]){

            var coords = _this.p_indexedPositions[_this.time].geometry.coordinates;
            var icon = new L.DivIcon({className: 'marker custom-marker focus'});
            var m = new L.marker(coords, {icon: icon});

            _this.p_markers.push(m);

            _this.interaction('focus', _this.p_indexedPositions[_this.time].properties.ID);

            if(_this.p_markers.length > 10){
              _this.map.removeLayer(_this.p_markers.shift());
            }

            for (var i = _this.p_markers.length - 1; i > 0; i--) {
              if(i !== 0){
                $(_this.p_markers[i]._icon).css('opacity', i/10).removeClass('focus');
              }
            }

            m.addTo(_this.map);
            var center = m.getLatLng();
            
          }

          var width = (_this.time /_this.p_relDuration * 100);
          $('.js-timeline-current').css('width', width + '%');
          _this.time += offset;

        }
      }

      var clearMarkers = function(){
        for (var i = 0; i < _this.p_markers.length; i++) {
          _this.map.removeLayer(_this.p_markers[i])
        }
      };

      var travel = function(e){
        var rapport =  e.offsetX / e.target.clientWidth;
        _this.time = Math.floor((_this.p_relDuration * rapport) / 10) * 10;
        clearMarkers();
        $('.js-time-current').html(_this.msToReadable(_this.time));
        frame();
      };

      var play = function(e){
        clearInterval(_this.timer);
        _this.timer = setInterval(frame, offset);
      };

      var pause = function(){
        clearInterval(_this.timer);
      };

      var handleSpeed = function(e){
        var value = $(e.currentTarget).val();
        _this.setValuesFromSpeed(geoJson, value);
      };

      var prev = function(){
        pause();
        clearMarkers();

        var arr = [];

        for (var key in _this.p_indexedPositions) {
          
          arr.push(key);
        }

        for (var i=arr.length-1; i>=0; i--) {
          var key = arr[i];
          if(parseInt(key) < parseInt(_this.time)){
            _this.time = parseInt(key);
            break;
          }
        }
        
        frame();
        _this.time -= 2*offset;
      };

      var next = function(){
        pause();
        clearMarkers();

        for (var key in _this.p_indexedPositions) {
          // console.log(key);
          if(parseInt(key) > parseInt(_this.time)){
            _this.time = parseInt(key);
            break;
          }
        }
        
        frame();
      };

      $('#speed').on('change', handleSpeed);
      $('.js-timeline-total').on('click', travel);
      $('.js-player-play').on('click', play);
      $('.js-player-pause').on('click', pause);
      $('.js-player-prev').on('click', prev);
      $('.js-player-next').on('click', next);
    },
  
    initClusters: function(geoJson){
      this.difference(geoJson);
      return;
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

      var disableClusteringAtZoom = 16; //16 (scale at 200m), maxZomm at 18 (scale at 20m)
      if(geoJson.features.length < 500){
        disableClusteringAtZoom = 2; //minZoom
      }

      this.markersLayer = new CustomMarkerClusterGroup({
        disableClusteringAtZoom: disableClusteringAtZoom,
        maxClusterRadius: 70,
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

    addLegend: function(){
      var legend = L.control({position: 'bottomright'});

      legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info-legend');
        var types = ['station', 'gps', 'argos'];
        var labels = [];

        for (var i = 0; i < types.length; i++) {
          labels.push(
            '<div class="marker marker marker-' + types[i] +'"></div>' + '&nbsp; ' + types[i]
          );
        }

        div.innerHTML = labels.join('<br>');
        return div;
      };

      legend.addTo(this.map);


      // var MyControl = L.Control.extend({
      //     options: {
      //         position: 'topright'
      //     },
      //     onAdd: function (map) {
      //         var lg = $.parseHTML(legend);
      //         return lg[0];
      //     }
      // });
      //this.map.addControl(new MyControl());
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
      var _this = this;
      this.setCenter(geoJson);
      var marker, prop;
      var icon;
      var className = '';
      var i =0;

      var markerList = [];

      var features = geoJson.features;
      var feature, latlng;

      for (var j = 0; j < features.length; j++) {
        className = 'marker';
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

          switch(feature.properties.type_) {
            case 'station':
              className += ' marker-station';
              break;
            case 'gps':
              className += ' marker-gps';
              break;
            case 'argos':
              className += ' marker-argos';
              break;
            default:
          }

          if(feature.selected){
            className += ' selected';
          }else{
            className += ' ';
          }

          icon = new L.DivIcon({className : className});
          marker = L.marker(latlng, {icon: icon});

          //useless: doesn't update the parent cluster
          if(feature.selected){
            marker.selected=true;
          }else{
            marker.selected=false;
          }

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
            if(_this.selection && this.feature.properties.type_ !== 'station'){
              _this.interaction('singleSelection', this.feature.id);
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
            if(childMarkers[i].selected){
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
        childs[i].selected = true;
        this.selectedMarkers[childs[i].feature.id] = childs[i];
        this.toggleIconClass(childs[i]);
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

        var bbox = [];
        for(var key in  markers._featureGroup._layers){
          marker =  markers._featureGroup._layers[key];
          if (e.boxZoomBounds.contains(marker._latlng) /*&& !_this.selectedMarkers[key]*/) {

            if(!marker._markers){
              if(marker.feature.properties.type_ !== 'station'){
                bbox.push(marker.feature.id);
              }
            }else{
              childs = marker.getAllChildMarkers();

              //bad functionName
              _this.updateAllClusters(marker, true);

              for (var i = childs.length - 1; i >= 0; i--) {
                if(childs[i].feature.properties.type_ !== 'station'){
                  childs[i].selected = true;
                  _this.selectedMarkers[childs[i].feature.id] = childs[i];
                  bbox.push(childs[i].feature.id);
                  _this.toggleIconClass(childs[i]);
                }
              }
              if(marker.__parent){
                  _this.updateClusterParents(marker, []);
              }
            }
          }
        }
        
        _this.interaction('multiSelection', bbox);
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

    singleSelection: function(id){
      if(this.selection){
      var marker;
        marker=this.dict[id];
        marker.selected=!marker.selected;
        if(this.selectedMarkers){
          this.selectedMarkers[id]=marker;
        }else{
          delete(this.selectedMarkers[id]);
        }
        this.toggleIconClass(marker);
        this.updateClusterParents(marker, []);
      }
    },

    avoidDoublon: function(id, marker){
      if(!this.selectedMarkers[id])
        this.selectedMarkers[id] = marker;
    },

    //from child to parent
    multiSelection: function(ids){
      if(this.selection){
        var marker;
        for (var i = 0; i < ids.length; i++) {
          marker=this.dict[ids[i]];
          marker.selected = true;

          this.avoidDoublon(ids[i], marker);

          this.toggleIconClass(marker);
          this.updateClusterParents(marker, []);
        }
      }
    },

    /*==========  focusMarker :: focus & zoom on a point  ==========*/
    focus: function(id){
      var marker = this.dict[String(id)];
      if(!marker) return;
      var center = marker.getLatLng();

      if(this.lastFocused) {
        $(this.lastFocused._icon).removeClass('focus');
      }
      this.lastFocused = marker;
      this.map.setView(center);
      this.toggleIconClass(marker);
    },

    focusAndZoom: function(id, zoom){
      var marker = this.dict[String(id)];
      if(!marker) return;
      var center = marker.getLatLng();
      var zoom = this.disableClustering;

      if(this.lastFocused) {
        $(this.lastFocused._icon).removeClass('focus');
      }
      this.lastFocused = marker;
      this.map.setView(center, zoom);
      this.toggleIconClass(marker);
    },

    toggleIconClass: function(m){
      var className = 'marker';

      if (m.selected) {
          //$(m._icon).addClass('selected');
          className += ' selected';
      }
      
      switch(m.feature.properties.type_) {
        case 'station':
          className += ' marker-station';
          break;
        case 'gps':
          className += ' marker-gps';
          break;
        case 'argos':
          className += ' marker-argos';
          break;
        default:
      }

      m.setIcon(new L.DivIcon({className  : className}));
      if (m == this.lastFocused) {
          $(m._icon).addClass('focus');
      }

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

    deselectAll: function(){
      this.updateLayers(this.geoJson);
    },

    selectAll: function(){
      var firstProp;
      var layers = this.markersLayer._featureGroup._layers;
      
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
      var _this = this;
        var features = {
            'features': [],
            'type': 'FeatureCollection'
        };
        var feature, attr,id, lat, lon;

        coll.each(function(m){
            attr = m.attributes;
            if (_this.idName) {
              id = m.get(_this.idName);
            } else {
            id = m.attributes.id;
            }

            if (_this.latName) {
              lat = m.get(_this.latName);
            } else {
              lat = m.attributes.latitude;
            }

            if (_this.lonName) {
              lon = m.get(_this.lonName);
            } else {
              lon = m.attributes.longitude;
            }

            feature = {
                'type': 'Feature',
                'id': id ,
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lat, lon],
                }
,                'properties': m.attributes,
            };
            features.features.push(feature);
        });
        return features;
    },

    updateFromServ: function(param){
      var _this = this;
      this.searchCriteria = param;
      
      var data = {
        'criteria': JSON.stringify(this.searchCriteria),
      };

      $.ajax({
        url: this.url,
        data: data,
        context: this
      }).done(function(geoJson) {
        this.geoJson = geoJson;
        if (this.cluster){
          this.updateLayers(geoJson);
        }else{
          this.initLayer(geoJson);
        }
      });
      return;
    },

    //apply filters on the map from a collection

    //param can be filters or directly a collection
    loadFeatureCollection: function(params){
      var _this = this;
      if(params.featureCollection.features.length){
        this.updateLayers(params.featureCollection);
        if(params.selectedFeaturesIds){
          this.multiSelection(params.selectedFeaturesIds);
        }
      } else {
        this.map.removeLayer(this.markersLayer);
        this.geoJsonLayers = [];
      }
    },

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
        var selectedMarkers = [];
        for (var i = coll.models.length - 1; i >= 0; i--) {
          //todo : generic term (import)
          if(coll.models[i].attributes.import)
            selectedMarkers.push((coll.models[i].attributes.id || coll.models[i].attributes.ID));
        }
        //todo : amelioration

        this.multiSelection(selectedMarkers);
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
