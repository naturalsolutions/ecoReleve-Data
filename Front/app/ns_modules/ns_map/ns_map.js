
/**
  TODO:
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
  'Draw',
  'leaflet_cluster',
  'googleLoaer',
  'leaflet_google',
  'config',

], function(config, $, _, Backbone , Marionette, moment, L, Draw, cluster, GoogleMapsLoader
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
    this.player = options.player;
    // Store the private instance id.
    this._instanceID = getNewInstanceID();
    //check if there is a communicator
    if(options.com){
      this.com = options.com;
      this.com.addModule(this);
    }
    if(options.drawable){
      this.drawable = true;
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
    this.mapCenter = config.mapCenter;
    this.disableClustering = options.disableClustering || 16;
    this.bbox = options.bbox || false;
    this.area = options.area || false;
    this.cluster = options.cluster || false;
    this.businessLayers = options.cluster || true;
    this.popup = options.popup || false;
    this.legend = options.legend || false;
    this.drawOptions = options.drawOptions;
    this.selection = options.selection || false;
    this.preventSetView = options.preventSetView || false;
    this.dict = {}; //list of markers
    this.selectedMarkers = {}; // list of selected markers

    this.lastImported = false;

    this.init();
  }

  Map.prototype = {


    remove : function() {
      console.log("on remove et oui")

    },

    destroy: function(){
      this.map.remove();
      clearInterval(this.timer); //player timer
    },

    action: function(action, params, from){
      if(this[action]){
        this[action](params, from);
      } else {
        // console.warn(this, 'doesn\'t have ' + action + ' action');
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
      L.Icon.Default.imagePath = 'bower_components/leaflet/dist/images/';
      this.selectedIcon = new L.DivIcon({className: 'custom-marker selected'});
      this.icon = new L.DivIcon({className: 'custom-marker'});

      this.map = new L.Map(this.elem, {
        center: this.mapCenter || [33, 33],
        zoom: this.zoom,
        zoomControl: false,
        minZoom: 2,
        maxZoom : 18,
        inertia: false,
        zoomAnimation: true,
        keyboard: false, //fix scroll window
        attributionControl: false,
      }).locate({setView:!this.preventSetView});

      L.control.zoom({
        position:'topright'
      }).addTo(this.map);

      this.google.defered  = this.google();
      //once google api ready, (fetched it once only)
      $.when(this.google.defered).always(function(){
        if(_this.url){
          _this.fetchGeoJson(_this.url);
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

    refreshGeoJsonWithRowGrid: function(refView) {
      var newfeatures = []

      refView.locationsGrid.gridOptions.api.forEachNodeAfterFilterAndSort(function(node) {
        var jsonItem = {
          "geometry": {
            "coordinates" : [node.data.LAT,node.data.LON],
            "type": "Point"
          }, 
          "properties": {
            "Date" :"node.data.Date",
            "ID" : node.data.ID,
            "precision" : node.data.precision,
            "type_" : node.data.type_
          },
          "type": "Feature"
        };
        newfeatures.push(jsonItem)
      })

      var newGeoJson = {
          "total" : newfeatures.length ,
          "exceed" : false,
          "features" : newfeatures,
          "type" :"FeatureCollection"
      }

      this.map.removeLayer(this.clusterLayer);

      if (this.cluster){
        this.initClusters(newGeoJson);

        // if(this.player){
        //   this.firstInit();
        // }
      } else {
        // this.geoJson = geoJson;
        this.initLayer(newGeoJson);
      }
      var displayLegend = false;
      this.ready(displayLegend);
      this.fitBound();

      // if (this.clusterLayer){
      //   if (newfeatures.length < 1000) {
      //     this.cluster = false
      //   }
        // this.map.removeLayer(this.clusterLayer);
        // this.clusterLayer = new L.FeatureGroup();
        // this.setMarkerListFromGeoJson(newGeoJson);
      //  this.updateLayers(newGeoJson);
        // var _this= this;
        // var firstLvl= true;
        // this.firstLvl= [];

        // var disableClusteringAtZoom = 16; //16 (scale at 200m), maxZomm at 18 (scale at 20m)
        // if(newGeoJson.features.length > 1000){
        //   disableClusteringAtZoom = 2; //minZoom
        // }
        // var CustomMarkerClusterGroup = L.MarkerClusterGroup.extend({
        //   _defaultIconCreateFunction: function (cluster, contains) {
        //     //push on firstLvl
        //     if(firstLvl){
        //       _this.firstLvl.push(cluster);
        //     }
        //     if(_this.selection){
        //       return _this.getClusterIcon(cluster, false, 0);
        //     }else{
        //       return _this.getClusterIcon(cluster);
        //     }
        //   },
        // });
        
        // this.clusterLayer = new CustomMarkerClusterGroup({
        //   disableClusteringAtZoom: disableClusteringAtZoom,
        //   maxClusterRadius: 70,
        //   polygonOptions: {color: "rgb(51, 153, 204)", weight: 2},
        // });

        // this.setMarkerListFromGeoJson(newGeoJson);
        // // this.clusterLayer.addLayers(this.markerList);
        // this.addClusterLayers();
      // }
        // this.ready();
      // debugger;
    },


    fetchGeoJson: function(url){
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
        context: this,
      }).done(function(resp) {
        if (resp.length == 2 ) {
          this.geoJson = resp[1];
        }
        else {
          this.geoJson = resp
        }


          if (this.cluster){
            this.initClusters(this.geoJson);

            if(this.player){
              this.firstInit();
            }
          } else {
            // this.geoJson = geoJson;
            this.initLayer(geoJson);
          }
          this.ready();
          this.fitBound();

      }).fail(function(msg) {
          console.error( msg );
      });
    },
    
    fitBound: function(){
      if(this.geoJson){
        if(this.geoJson.features.length){
          var arrayOfLatLngs = [];
          for (var i = 0; i < this.geoJson.features.length; i++) {
            arrayOfLatLngs.push(this.geoJson.features[i]['geometry']['coordinates']);
          }
          var bounds = new L.LatLngBounds(arrayOfLatLngs);
          this.map.fitBounds(bounds);
          return;
        }
      }
    },

    initDrawLayer: function(){
      L.drawLocal.edit.toolbar.buttons = {
        edit:"Edit marker",
        editDisabled: "No marker to edit",
        remove: "Delete marker",
        removeDisabled: "No marker to delete"
     };

			this.drawnItems = new L.FeatureGroup();
			this.map.addLayer(this.drawnItems);
			var _this = this;
      

			this.drawControl = new L.Control.Draw({
				edit: {
          featureGroup: _this.drawnItems,
          remove: false
        },
        draw:{
          circle:false,
          rectangle:false,
          polyline:false,
          polygon:false,
          circlemarker:false
        }, 
        position : 'topright'
			});
      this.map.addControl(this.drawControl);
      var controlDiv = this.drawControl._toolbars.edit._toolbarContainer;

      var removeControlUI = L.DomUtil.create('a', 'leaflet-draw-edit-remove');
      controlDiv.append(removeControlUI);
      removeControlUI.title = 'Remove All Polygons';
      removeControlUI.href = '#';
      L.DomEvent.addListener(removeControlUI, 'click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if(!$(removeControlUI).hasClass("leaflet-disabled") && _this.drawnItems.getLayers().length > 0){
          _this.drawnItems.clearLayers();
          _this.map.fire('draw:deleted');

        }
    });

    if (navigator.geolocation){
      var locationControlUI = L.DomUtil.create('a', 'leaflet-no-background glyphicon glyphicon-screenshot');
      controlDiv.append(locationControlUI);
      locationControlUI.title = 'Mark from current location';
      locationControlUI.href = '#';
      L.DomEvent.addListener(locationControlUI, 'click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if(!$(removeControlUI).hasClass("leaflet-disabled")){
            _this.getCurrentLocation();
        }
      });
    }
			// this.map.on('draw:created', function (e) {
      //   if(this.drawOptions.onDrawCreated){

      //   } 
			// });

			// this.map.on('draw:edited', function () {
			// 	console.log('ma couche controle a été éditée');
			// });

			// this.map.on('draw:deleted', function () {
			// 	console.log('ma couche a été supprimée')
			// });

    },

    toggleDrawing: function(forceDisable) {
      var button = $('.leaflet-draw-toolbar.leaflet-bar.leaflet-draw-toolbar-top');
      var markerButtons = button.find('a');
      if (button.hasClass('disabled-draw-control') && !forceDisable) {
          button.removeClass('disabled-draw-control');
          markerButtons.removeClass('leaflet-disabled');
          // $('.leaflet-draw-edit-remove').addClass('leaflet-disabled');
        } else {
          button.addClass('disabled-draw-control');
          markerButtons.addClass('leaflet-disabled');
          // $('.leaflet-draw-edit-remove').removeClass('leaflet-disabled');
      }
    },


    ready: function(displayLegend = true){
      this.setTotal(this.geoJson);

      if(this.legend && displayLegend){
        this.addLegend();
      }
      if(this.clusterLayer){
        this.addClusterLayers();
      }

      if(this.businessLayers){
        this.initOverlayRegions();
      }

      if(this.drawable){
        this.initDrawLayer();
      }

      this.initErrorLayer();
      this.displayError(this.geoJson);
    },

    google: function(){
      var _this = this;

      return GoogleMapsLoader.done(function(){

        var relief = L.gridLayer.googleMutant({
          type: 'terrain'
        });

        var hybrid = L.gridLayer.googleMutant({
            type: 'hybrid',
        });
        var baseMaps = {
          'relief': relief,
          'hybrid': hybrid,
        };
        
        _this.lControl = L.control.layers(baseMaps, null, {collapsed:true, position:'topleft'});
        _this.lControl.addTo(_this.map);
        _this.map.addLayer(relief);

      }).fail(function(){
        console.error('Google maps library failed to load');
      });
    },

    initOverlayRegions: function(){
      this.RegionLayers = {};
      var _this = this;
      $.ajax({
        url:'regions/getTypes',
        context: this
      }).done(function(response){
        response.forEach(function(layerName) {
          _this.fetchRegionsLayers(layerName);
        }, this);
      }).fail(function(response){
        console.log('error fetch region Types', response)
        
      });
    },

    eachPolygon: function(feature, layer){
      if(feature.properties && feature.properties.name){
        var polygonName = '<strong class="leaflet-polygon-name" >'+ feature.properties.name + '</strong>';
        layer.bindPopup(polygonName);
      }
    },

    fetchRegionsLayers: function(layerName){
      var _this = this;
      
      if (!window.RegionLayers[layerName] || window.RegionLayers[layerName].statusText == "abort" ) {
        window.RegionLayers[layerName] = $.ajax({
        url:'regions/getGeomFromType',
        data: {'type':layerName},
        context: this
        });
      }
      
      $.when(window.RegionLayers[layerName]).then(function() {
        var geoJson = window.RegionLayers[layerName].responseJSON
        _this.RegionLayers[layerName] = new L.GeoJSON(geoJson['geojson'],
                                                      {style : geoJson['style'],
                                                      onEachFeature: _this.eachPolygon
                                                    });
        _this.lControl.addOverlay(_this.RegionLayers[layerName], layerName);
      });
    },

    getCurrentLocation: function(){
      var _this = this;

      navigator.geolocation.getCurrentPosition(function(position){
        var lat = position.coords.latitude, lon = position.coords.longitude;
        _this.map.fire('currentLocation', {lat: lat, lon:lon});
      });
    },

    initClusters: function(geoJson){
      var _this= this;
      var firstLvl= true;
      this.firstLvl= [];
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
      if(geoJson.features.length < 600){
        disableClusteringAtZoom = 2; //minZoom
      }
      
      this.clusterLayer = new CustomMarkerClusterGroup({
        disableClusteringAtZoom: disableClusteringAtZoom,
        maxClusterRadius: 70,
        polygonOptions: {color: "rgb(51, 153, 204)", weight: 2},
      });
      this.setMarkerListFromGeoJson(geoJson);
    },

    addClusterLayers: function(){
      var _this = this;
      this.clusterLayer.addLayers(this.markerList);
      // this.lControl.addOverlay(this.clusterLayer, 'clusters');
      if(!this.playerDisplayed){
        this.map.addLayer(this.clusterLayer);
      }

      if(!this.player){
        this.geoJSONLayer = L.layerGroup(this.markerList);
      }

      if(this.area){
        this.addArea();
      }

      if(this.bbox){
        this.addBBox(this.clusterLayer);
      }

      this.map.on({
        overlayadd: function(e) {
          if (e.name == 'clusters'){
            this.removeLayer(_this.geoJSONLayer);
          }
        },
        overlayremove: function(e) {
          if (e.name == 'clusters'){
            this.addLayer(_this.geoJSONLayer);
          }
        }
      });
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
    },

    initLayer: function(geoJson){
      if(geoJson){
        this.clusterLayer = new L.FeatureGroup();
        this.setMarkerListFromGeoJson(geoJson);
      }
    },

    getMarkerIconClassName: function(feature){
      var className = 'marker';
      switch(feature.properties.type_.toLowerCase()) {
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

      return className;
    }, 

    setMarkerListFromGeoJson: function(geoJson){
      var _this = this;
      
      var marker, prop;
      var icon;
      var i =0;

      var markerList = [];

      var features = geoJson.features;
      var feature, latlng;

      for (var j = 0; j < features.length; j++) {
        feature = features[j];
        if(feature.geometry.coordinates[1] != null && feature.geometry.coordinates[0] != null){
          try{
            latlng = L.latLng(feature.geometry.coordinates[0], feature.geometry.coordinates[1]);
            i++;
            var infos = '';
            if (!feature.id) {
              feature.id = i;
              if (feature.properties.ID) {
                feature.id = feature.properties.ID;
              }
            }

            var className = _this.getMarkerIconClassName(feature);

            icon = new L.DivIcon({className : className});
            marker = L.marker(latlng, {icon: icon});

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
          } catch(excpetion){
            continue;
          }
        }else{
          console.warn('latlng null');
        }
      }

      this.markerList = markerList;
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
        if( !marker ) { //litle hack
          return;
        }
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
      var className = this.getMarkerIconClassName(m.feature);

      if (m.selected) {
          className += ' selected';
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
      var layers = this.clusterLayer._featureGroup._layers;
      
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
                },
                'properties': m.attributes,
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
        this.map.removeLayer(this.clusterLayer);
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
          this.map.removeLayer(this.clusterLayer);
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
      if(!this.errorElt){
        this.initErrorLayer();
      }
      this.errorElt.addClass('hidden');
      var msg;
      if(geoJson){
        if (!geoJson.features.length) {
          msg = ' No data to display';
          this.errorElt.removeClass('hidden');
          this.errorElt.find('.msg').html(msg);
        }
        else if (geoJson.exceed) {
          msg = ' Too much data to display';
          this.errorElt.removeClass('hidden');
          this.errorElt.find('.msg').html(msg)
        }
      }
    },


    updateLayers: function(geoJson) {
      var _this = this;
      
      this.displayError(geoJson);

      this.lControl.removeLayer(this.clusterLayer);
      this.map.removeLayer(this.clusterLayer);
      
      if(geoJson == false){
        this.disablePlayer();
        return false;
      }

      if(geoJson.features.length){

        this.computeInitialData(geoJson);
        this.initClusters(geoJson);

        this.addClusterLayers();
        if(this.player){
          this.initPlayer(geoJson);

        }
      } else {
        this.disablePlayer();
      }
      if(this.bbox){
        this.addBBox(this.clusterLayer);
      }
      this.setTotal(geoJson);
      this.fitBound();
    },



    //Player
    sortByDate: function(geoJson){
      
      geoJson.features.sort( function(a, b) {
        // for refact opti moment no more needed perf X10
        // var jsDateA = new Date(a.properties.Date || a.properties.date);
        // var jsDateB = new Date(b.properties.Date || b.properties.date);
        // return jsDateA - jsDateB;
        return moment(a.properties.Date || a.properties.date) - moment(b.properties.Date || b.properties.date)
      });

    },

    disablePlayer: function(options){
      if(this.player){

        this.hidePlayer(options);
        $('.js-toggle-ctrl-player').addClass('hidden');
      }
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
      if ( !$('.js-player-chevron').hasClass('reneco-chevron_top reneco-chevron_bottom') ) {
        $('.js-player-chevron').addClass('reneco-chevron_top reneco-chevron_bottom')
      }
      // $('.js-player-chevron').toggleClass('reneco-chevron_top reneco-chevron_bottom');
      $('#player').addClass('active');
      if ( !$('.leaflet-bottom').hasClass('active-player') ) {
        $('.leaflet-bottom').addClass('active-player')
      }
      // $('.leaflet-bottom').toggleClass('active-player');
      this.map.removeLayer(this.clusterLayer);
      this.map.addLayer(this.playerLayer);
      this.degraded();
      this.draw();
      this.playerDisplayed = true;
      this.keyboard = true;
      this.bindKeyboardShortcuts();
    },

    hidePlayer: function(options){

      if( $('.leaflet-bottom').hasClass('active-player') ) {
        $('.leaflet-bottom').removeClass('active-player')
      }
      // $('.leaflet-bottom').toggleClass('active-player');
      if ( $('.js-player-chevron').hasClass('reneco-chevron_bottom') ) {
        $('.js-player-chevron').removeClass('reneco-chevron_bottom')
      }
      // $('.js-player-chevron').toggleClass('reneco-chevron_top reneco-chevron_bottom');
      $('#player').removeClass('active');
      this.pause(options);
      this.map.addLayer(this.clusterLayer);
      if (this.playerLayer) {
        this.map.removeLayer(this.playerLayer);
      }
      this.clearMarkers();
      this.clearLines();
      if(this.lastMarker){
        this.map.removeLayer(this.lastMarker);
      }
      this.interaction('noFocus');//for hidding icon col
      // this.playerLayer.removeLayer(this.lastMarker)
      this.playerDisplayed = false;
      this.keyboard = false;
      this.bindKeyboardShortcuts();
    },

    firstInit: function(geoJson){
      var geoJson = this.geoJson;
      if(geoJson.features.length < 3){
        this.noPlayer = true;
        this.hidePlayer({silent : true});
        return;
      }
      this.autoNextSpeed = 1000;
      var _this = this;

      var togglePlayer = L.control({position: 'bottomleft'});

      togglePlayer.onAdd = function (map) {
        $('#map').find('.js-toggle-ctrl-player').remove();
        $('#map').find('#player').remove();
        
        var div = L.DomUtil.create('div', 'js-toggle-ctrl-player info-legend');
        
        div.innerHTML = '<button class="js-player-toggle btn"><i class="js-player-chevron reneco reneco-chevron_top"></i> location player</button>';
        return div;
      };

      togglePlayer.addTo(this.map);

      $('.js-player-toggle').on('click', function(){
        if($('#player').hasClass('active')){
          _this.hidePlayer();
        } else {
          _this.showPlayer();
        }
        $('.js-player-toggle').blur();
      });
      this.parentContainer = $($('#map').parent());
      this.parentContainer.css('overflow', 'hidden');


      /*

this.parentContainer.append('\
        <div id="player" class="player">\
        <div class="col-xs-12">\
        </div>\
        <div class="timeline col-xs-12">\
          <div class="js-player-scale scale"></div>\
          <div class="js-timeline-total timeline-total">\
            <div class="js-timeline-current timeline-current"></div>\
            <div class="js-cursor-timeline-current cursor-timeline-current">\
              <div class="js-timeline-currentDate timeline-currentDate"></div>\
            </div>`\
          </div>\
        </div>\
        <div class="col-xs-12 custom-row">\
          <span class="js-time-current">00:00:00</span>\
          <span class="pull-right">Total duration: <span class="js-time-total">00:00:00</span></span>\
        </div>\
        <div class="col-xs-5">\
          <button title="previous location" class="js-player-prev btn"><i class="reneco reneco-rewind"></i></button>\
          <button title="play/pause" class="js-player-play-pause btn"><i class="reneco reneco-play"></i></button>\
          <button title="stop" class="js-player-stop btn"><i class="glyphicon glyphicon-stop"></i></button>\
          <button title="next location" class="js-player-next btn"><i class="reneco reneco-forward"></i></button>\
          <button title="display locations every x times (default: 1 location/second)" class="js-player-auto-next btn"><i class="reneco reneco-forward"></i><i class="reneco reneco-play"></i> Location by location </button> \
        </div>\
        <div class="col-xs-4 no-padding">\
          <div class="pull-left">\
            <label for="track" title="follow positions on the map"> Map centered </label>\
            <input id="track" title="follow positions on the map" type="checkbox" class="js-player-track form-control pull-left" /> \
          </div>\
          <div class="pull-left">\
            <label for="keyboard" title="use arrows to navigate & space bar to make it pause"> Keyboard </label>\
            <input title="use arrows to navigate & space bar to make it pause" id="keyboard" type="checkbox" class="js-player-keyboard form-control pull-left" />\
          </div>\
          <label for="" class="pull-right">speed: </label>\
        </div>\
        <div class="col-xs-3 range">\
          <input title="" class="js-player-day-in-ms" min=-24000 max=-200 value=-1000 step=100 type="range">\
          <input title="" class="js-player-auto-next-speed hidden" min=-2000 max=-50 value=-1000 step=10 type="range">\
        </div>\
        </div>\
      ');

      */

      this.parentContainer.append('\
        <div id="player" class="player">\
          <div class="timeline">\
            <div class="js-player-scale scale">\
            </div>\
            <div class="js-timeline-total timeline-total">\
              <span class="js-myTooltip">hje he he he </span>\
              <div class="js-timeline-current timeline-current" >\
              </div>\
              <div class="js-cursor-timeline-current cursor-timeline-current">\
              </div>\
            </div>\
            <div>\
            <span class="js-timeline-currentDate timeline-currentDate left">\
            </span>\
            </div>\
          </div>\
          <div class="custom-row">\
            <span class="js-time-current">00:00:00</span>\
            <span class="pull-right">Total duration: <span class="js-time-total">00:00:00</span></span>\
          </div>\
          <div class="player-controller">\
            <div class="checkbox-labelled">\
              <input id="track" title="follow positions on the map" type="checkbox" class="js-player-track form-control" /> \
              <label for="track" title="follow positions on the map"> Last point centered </label>\
            </div>\
            <div class="js-icon-tooltip" >\
              <i class="reneco reneco-ECORELEVE-shortcuts shortcutsIcon"><span class="content">Shortcuts</span></i>\
            </div>\
            <div class="player-controller-btns">\
              <button title="previous location" class="js-player-prev btn"><i class="reneco reneco-rewind"></i></button>\
              <button title="play/pause" class="js-player-play-pause btn"><i class="reneco reneco-play"></i></button>\
              <button title="stop" class="js-player-stop btn"><i class="glyphicon glyphicon-stop"></i></button>\
              <button title="next location" class="js-player-next btn"><i class="reneco reneco-forward"></i></button>\
            </div>\
            <button title="display locations every x times (default: 1 location/second)" class="js-player-auto-next btn"><i class="reneco reneco-ECORELEVE-location-by-location"></i>Location by location </button>\
              <div class="js-speed-range">\
               <span>Speed : </span>\
               <input title="" class="js-player-day-in-ms" min=-24000 max=-200 value=-1000 step=100 width="100" type="range">\
               <input title="" class="js-player-auto-next-speed hidden" min=-2000 max=-50 value=-1000 step=10 width="100" type="range">\
              </div>\
        </div>\
      ');
      this.bindPlayer();

      this.initPlayer(geoJson);
    },

    initPlayer: function(geoJson){
      if(geoJson.features.length < 3){
        this.disablePlayer({silent:true});
        return;
      }

      this.sortByDate(geoJson);

      this.playerInitialized = true;
      this.index = 0;
      this.time = 0;
      this.p_markers = [];
      // for the last 3 points
      this.lines = {
        0 : null,
        1: null
      };

       //usefull for position presicion & perf: is actually a framerate.
       // and to be on real quartz time because setInterval is multithread.
       //so we consider here that 10ms is the maximum time taken to make one turn in the loop to draw etc,
       //in that way we stay on a real quartz time.
      this.offset = 10;

      this.playerLayer = L.layerGroup();
      this.map.addLayer(this.playerLayer);
      
      this.computeInitialData(geoJson);
                                         
      $('.js-icon-tooltip').popover({
                              animation : true,
                              placement: 'top',
                              template :'<div class="popover js-popover-player-position" role="tooltip">\
                                          <h5 class="popover-title"></h5>\
                                          <div class="popover-content"></div>\
                                        </div>',
                              container :'body',
                              trigger :'hover',
                              title: '<h5 class="custom-title"><u>Shortcuts</u></h5>',
                              content: '<div class="js-shortcuts-help">\
                                          <i class="reneco reneco-ECORELEVE_space"> : Pause</i>\
                                          <i class="reneco reneco-ECORELEVE_left"> : Previous location</i>\
                                          <i class="reneco reneco-ECORELEVE_right"> : Next location</i>\
                                        </div>',
                              html: true,
                              delay: { 
                                show: 300,
                                hide : 300
                               },
                               // viewport: 'body'
                          }); 


      // $('.js-icon-tooltip').tooltip({
      //   placement : 'top',
      //    title: 'tes gfdgfeg regre gh etgr t',
      //   template : templateTooltip
      // })
    },

    clearLines : function() {
     for( var line in this.lines ) {
       if( this.lines[line] ) {
         this.playerLayer.removeLayer(this.lines[line])
       }
     }
    },

    degraded: function(){
      var opacity = 1;
      for (var i = 0; i < this.p_markers.length; i++) {
        opacity -= 0.05;
        if(i !== 0){
          $(this.p_markers[i]._icon).css('opacity', opacity).removeClass('focus');
        }
      }
    },

    computeInitialData: function(geoJson, x){
      if(!this.player){
        return;
      }
      var dayInMs = 86400000;

      var relDayInMs = ( x || 1000)
      var speed = relDayInMs / dayInMs;
      this.speedForUi = speed;

      var firstDate = geoJson.features[0].properties.Date || geoJson.features[0].properties.date;
      var lastDate = geoJson.features[geoJson.features.length - 1].properties.Date || geoJson.features[geoJson.features.length - 1].properties.date;
      
      var format = 'DD/MM/YYYY HH:mm:ss';

      $('.js-player-first-date').html(moment(firstDate).format(format));
      $('.js-player-last-date').html(moment(lastDate).format(format));

      /*      
      if(geoJson.features[0].properties.format){
        format = geoJson.features[0].properties.format;
      }*/

      this.p_realDuration = moment(lastDate).diff(moment(firstDate));

      var ms;
      var _date2;
      
      for (var i = 0; i < geoJson.features.length; i++) {

        _date2 = geoJson.features[i].properties.Date || geoJson.features[i].properties.date;

        ms = moment(_date2).diff(moment(firstDate));
        ms = speed * ms;
        ms = Math.floor(ms / 10) * 10;

        geoJson.features[i].time = ms;
      }

      this.locations = geoJson.features;

      this.p_relDuration = speed * this.p_realDuration;
      
      // var diff = geoJson.features[10].time / speed;
      
      this.displayScale();


      $('.js-toggle-ctrl-player').removeClass('hidden');
    },

    displayScale: function(){
      
      var format = 'DD/MM/YYYY';

      var firstDate = this.locations[0].properties.Date || this.locations[0].properties.date;
      firstDate = moment(firstDate);
      $('.js-player-scale').html('');
      $('.js-player-scale').append('<span class="note" style="left:0%">' + firstDate.format(format) + '</span>');

      for (var i = 0.25; i < 1; i+=0.25) {
        var diff = Math.floor(this.p_realDuration * 0.25);
        firstDate.add(diff, 'ms');
        $('.js-player-scale').append('<span class="js-mid-scale note" style="left:'+((i)*100)+'%">' + firstDate.format(format) + '</span>');
      }

      var diff = Math.floor(this.p_realDuration * 0.25);
      firstDate.add(diff, 'ms');
      $('.js-player-scale').append('<span class="note last" style="right:0%">' + firstDate.format(format) + '</span>');

    },

    handleAutoNext: function(){
      $('.js-player-auto-next').toggleClass('btn-success active');
      $('.js-mid-scale').toggleClass('hidden');
      this.autoNext  = !this.autoNext;

      $('.js-player-day-in-ms').toggleClass('hidden');
      $('.js-player-auto-next-speed').toggleClass('hidden');

      if(this.playing){
        this.play();
      }
      this.draw();

    },

    handlePlayPause: function(){
      this.playing = !this.playing;
      if(this.playing){
        this.play();
      } else {
        this.pause();
      }
    },

    play: function(e){
      this.playing = true;
      var _this= this;
      this.interaction('noFocus');
      $('.js-player-play-pause>i').addClass('reneco-pause').removeClass('reneco-play');
      $('.js-timeline-current').css('transition', 'none');
      clearInterval(this.timer);
      clearInterval(this.autoNextTimer);

      if(this.autoNext){

        this.autoNextTimer = setInterval(function(){
          _this.next(true);
        }, this.autoNextSpeed || 1000);

      } else {

        this.timer = setInterval(function(){
          _this.frame();
        }, this.offset);

        window.mapTimers = [this.timer, this.autoNextTimer];
      }
    },

    handleAutoNextSpeed: function(e){
      var wasPlaying = this.playing;
      this.pause();
      var value = $(e.currentTarget).val();
      value *= -1;
      this.autoNextSpeed = value;
      if(wasPlaying){
        this.play();
      }
    },

    handleSpeed: function(e){
      var wasPlaying = this.playing;
      this.pause();
      var value = $(e.currentTarget).val();
      value *= -1;

      this.computeInitialData(this.geoJson, value);

      this.time = this.locations[this.index].time;
      
      if(wasPlaying){
        this.play();
      }
    },

    clearMarkers: function(){
      if(this.p_markers){
        for (var i = 0; i < this.p_markers.length; i++) {
          this.playerLayer.removeLayer(this.p_markers[i])
        }
        this.p_markers = [];
      }
    },

    travel: function(e){
      var rapport =  e.offsetX / e.currentTarget.clientWidth;

      this.clearMarkers();
      this.clearLines();

      this.time = Math.floor((this.p_relDuration * rapport) / 10) * 10;
      this.index = this.findClosestFloorPositionIndex(this.time);

      if(this.autoNext){
        this.index = Math.round((this.locations.length * rapport));
        this.time = this.locations[this.index].time;
        clearInterval(this.autoNextTimer);
        this.draw();
        if(this.playing){
          this.play();
        } 
      } else {
        this.draw();
      }

      this.updateInfos();
    },

    findClosestFloorPositionIndex: function(time){
      for (var i = this.locations.length - 1; i >= 0; i--) {
        if(time > this.locations[i].time){
          return i;
        }
      }      
    },

    pause: function(options) {

      this.playing = false;
      if( typeof(options) == 'undefined' ||  !options.hasOwnProperty('silent') || !options.silent  ) {
        var feature = this.locations[this.index];
        this.interaction('highlight', feature.properties.ID || feature.id);
      }
      $('.js-player-play-pause>i').removeClass('reneco-pause').addClass('reneco-play');
      $('.js-timeline-current').css('transition', 'width .2s');
      clearInterval(this.autoNextTimer);
      clearInterval(this.timer);
    },


    updateInfos: function(){
      var elemTimeLineTotal = $('.js-timeline-total')[0]
      var elemTimeLineCurrent = $('.js-timeline-current')[0];
      var elemCursorTimeline = $('.cursor-timeline-current')[0];
      var elemTimeLineCurrentDate = $('.js-timeline-currentDate')[0];
      if(this.autoNext){
        
        $('.js-time-total').html(this.msToReadable( this.locations.length * (this.autoNextSpeed / 1000) * 1000 ));
        $('.js-time-current').html(this.msToReadable( this.index * (this.autoNextSpeed / 1000) * 1000 ));

        var width = (this.index /this.locations.length * 100);
        // $('.js-timeline-current').css('width', width + '%');
        elemTimeLineCurrent.style.width = width+'%';

      } else {


        $('.js-time-total').html(this.msToReadable(this.p_relDuration));

        $('.js-time-current').html(this.msToReadable(this.time));
        var width = (this.time /this.p_relDuration * 100);

        // $('.js-timeline-current').css('width', width + '%');
        elemTimeLineCurrent.style.width = width+'%';
        }

        elemCursorTimeline.style.left = 'calc('+width+'% - 7px)';
        var format = 'DD/MM/YYYY';
        var firstDate = this.locations[0].properties.Date || this.locations[0].properties.date;
        firstDate = moment(firstDate);
        firstDate.add(this.time/this.speedForUi , 'ms');
        elemTimeLineCurrentDate.innerHTML = firstDate.format(format);

        //invert ?
        var widthTotal = elemTimeLineTotal.getBoundingClientRect().width;
        var pxAvailable = widthTotal - ( ( widthTotal * width) /100 )
        if ( elemTimeLineCurrentDate.getBoundingClientRect().width < pxAvailable ) {
          elemTimeLineCurrentDate.style.left = width+'%';
          elemTimeLineCurrentDate.style.right = null;
         if( elemTimeLineCurrentDate.className.indexOf('right') > -1 ) {
          elemTimeLineCurrentDate.className = elemTimeLineCurrentDate.className.replace('right','left');
         }
        }
        else {
          elemTimeLineCurrentDate.style.left = null;
          if( elemTimeLineCurrentDate.className.indexOf('left') > -1 ) {
            elemTimeLineCurrentDate.className = elemTimeLineCurrentDate.className.replace('left','right');
          }
          elemTimeLineCurrentDate.style.right = (100 - width)+'%';
        }  
    },

    drawLines : function() {
      var p1,p2,p3;
      //get last three points (p1 last )
      p1 = this.p_markers[0];
      p2 = this.p_markers[1];
      p3 = this.p_markers[2];

      if ( p2 && p3 ) {
        if( this.lines[1])
          this.playerLayer.removeLayer(this.lines[1]);
        if (this.lines[0] )
          this.lines[1] = this.lines[0];
      }
      if( p1 && p2  ) {
        this.lines[0] = L.polyline( [p1.getLatLng(),p2.getLatLng()] , {className : 'polylineTest'}).addTo(this.playerLayer);
      }
    },

    draw: function(){
      this.updateInfos();

      var feature = this.locations[this.index];
      var coords = feature.geometry.coordinates;
      var className = this.getMarkerIconClassName(feature)+ ' focus';
      var icon = new L.DivIcon({className: className, iconSize: new L.Point(18,18)});
      var m = new L.marker(coords, {icon: icon});
      var prop = feature.properties;
      var infos = '';
      for(var p in prop){
        infos += '<b>' + p + ' : ' + prop[p] + '</b><br />';
      }
      m.bindPopup(infos);

      this.p_markers.unshift(m);

      m.addTo(this.playerLayer);
      this.drawLines();
      
      if( !this.playing ) {
        this.interaction('highlight', feature.properties.ID || feature.id);
      }

      if(this.p_markers.length > 20){
        this.playerLayer.removeLayer(this.p_markers.pop());
      }

      this.degraded();

      if(this.tracked){
        var center = m.getLatLng();
        this.map.panTo(center, {animate: false});
      }
    },
    
    frame: function(){

      if(this.time >= this.p_relDuration || this.index + 1 >= this.locations.length) {
        this.pause();
        this.time = 0;
        this.index = 0;
        return;
      }

      //Because if a quartz day is represented by a quartz second, it becomes a relative day.
      //And it becomes hard to distinct a second (or minute) of this relative day in here 10ms (offset).
      //So we display them in the same loop time. (at least in js for now on)
      while(this.locations[this.index + 1] && this.time == this.locations[this.index + 1].time){
       this.index++;
       this.draw();
      }

      
      this.updateInfos();

      this.time += this.offset;
    },

    prev: function(){
      // this.pause();

      if(this.time < 0 || this.index === 0){
        return;
      }
      this.clearMarkers();
      this.clearLines();

      this.index--;
      this.time = this.locations[this.index].time;

      this.draw();
    },

    next: function(pass){
      if(this.time >= this.p_relDuration || this.index + 1 >= this.locations.length){
        this.clearMarkers();
        this.clearLines();
        this.time = 0;
        this.index = 0;
      } else {
        this.index++;        
        this.time = this.locations[this.index].time;
      }
      this.draw();
    },

    toggleTrack: function(e){
      this.tracked = !this.tracked;
    },

    stop: function(){
      if(this.noPlayer){
        return;
      }
      this.pause();
      this.index = 0;
      this.time = 0;
      this.clearMarkers();
      this.clearLines();
      this.draw();
    },

    clearPlayer: function(){
      this.pause();
      this.index = 0;
      this.time = 0;
      this.draw();
      this.clearMarkers();
      this.clearLines();
      this.hidePlayer();
    },
    displayDate : function(e) {

      var _this = this;
      var rapport =  e.offsetX / e.currentTarget.clientWidth;
      var time = Math.floor(( _this.p_relDuration * rapport) / 10) * 10;
      var format = 'DD/MM/YYYY';
      var firstDate = _this.locations[0].properties.Date || _this.locations[0].properties.date;
      firstDate = moment(firstDate);
      firstDate.add(time/this.speedForUi , 'ms');
      _this.myTooltipElem.innerHTML = firstDate.format(format);
      var y = (_this.timelineTotalElem.getBoundingClientRect().y - 25) +'px';
      var dim = _this.myTooltipElem.getBoundingClientRect();
      _this.myTooltipElem.style.top = y;

      var dimTotal = _this.timelineTotalElem.getBoundingClientRect();

      if ( dim.width + e.clientX < dimTotal.right ) {
        _this.myTooltipElem.style.left = (e.clientX) + 'px';
        _this.myTooltipElem.style.right = null;
      }
      else {
        _this.myTooltipElem.style.left = null;
        _this.myTooltipElem.style.right = '0px';
      }  
    },

    bindPlayer: function(){
      var _this = this;

      $('.js-player-prev').on('click', $.proxy(this.prev, this));
      $('.js-player-play-pause').on('click', $.proxy(this.handlePlayPause, this));
      $('.js-player-stop').on('click', $.proxy(this.stop, this));
      $('.js-player-next').on('click', $.proxy(this.next, this));
      $('.js-player-auto-next').on('click', $.proxy(this.handleAutoNext, this));
      
      $('.js-player-auto-next-speed').on('change', $.proxy(this.handleAutoNextSpeed, this));
      $('.js-player-day-in-ms').on('change', $.proxy(this.handleSpeed, this));
      $('.js-player-track').on('change', $.proxy(this.toggleTrack, this));
      $('.js-timeline-total').on('click', $.proxy(this.travel, this));
      // $('.js-timeline-total').tooltip({title:'',container:'body' ,trigger: 'manual'})
      // $('.js-timeline-total').on('hover', $.proxy(this.displayDate, this));
      $('.js-timeline-total').mousemove(this.displayDate.bind(this));

      _this.myTooltipElem = $('.js-myTooltip')[0];
      _this.timelineTotalElem = $('.js-timeline-total')[0];
      this.keyboard = true;
      // _this.bindKeyboardShortcuts();
      // $('.js-player-keyboard').on('change', $.proxy(this.bindKeyboardShortcuts, this));

    },

    bindKeyboardShortcuts: function(){
      var _this = this;
      // this.keyboard = !this.keyboard;
      if(this.keyboard){
        document.onkeydown = function(e){
          if(e.code === 'Space'){
            _this.handlePlayPause();
          }
          if(e.code === 'ArrowLeft'){
            _this.prev();
          }
          if(e.code === 'ArrowRight'){
            _this.next();
          }
        };
      } else {
        document.onkeydown = function(e){};
      }

    },



  }
  return( Map );
});
