define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'text!./tpl-map.html',
    'L',
    'leaflet_cluster',
    'text!./tpl-legend.html',
    'leaflet_google',

], function($, _, Backbone , Marionette, tpl, L, cluster, tpl_legend
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
      console.info('Proto'); 

        // Store the private instance id.
        this._instanceID = getNewInstanceID();
        this.unlockError();
        //check if there is a communicator

        if(options.com){
          this.com = options.com;
          this.com.addModule(this);
        }
        this.url=options.url;
        this.geoJson=options.geoJson;

        this.geoJsonLayers = [];

        this.zoom = options.zoom;

        this.elem = options.element;
        this.bbox = options.bbox || this.bbox;
        this.cluster = options.cluster;
        this.popup = options.popup;
        this.legend = options.legend;


        this.selection = options.selection;

        this.dict={}; //list of markers
        this.selectedMarkers = {}; // list of selected markers
        this.url = options.url;
        this.geoJson = options.geoJson;

        this.initIcons();
        // Return this object reference.
        return( this );
    
    }

    Map.prototype = {

        selection: false,
        bbox : false,
        legend : false,
        popup: false,
        zoom: 3,
        fitBounds: false,
        geoJsonLayers: [],

        onBeforeDestroy: function(){
          this.map.remove();
          console.info('detroy map');
        },

        destroy: function(){
          this.map.remove();
          console.info('detroy map');
        },

        unlockError: function(){


          L.LatLng = function (lat, lng, alt) { // (Number, Number, Number)
            lat = parseFloat(lat);
            lng = parseFloat(lng);

            if (isNaN(lat) || isNaN(lng)) {
              console.warn('Invalid LatLng object: (' + lat + ', ' + lng + ')');
              this.lat = 90;
              this.lng = 180;
            }else{
              this.lat = lat;
              this.lng = lng;
            }

            if (alt !== undefined) {
              this.alt = parseFloat(alt);
            }
          };

          L.extend(L.LatLng, {
            DEG_TO_RAD: Math.PI / 180,
            RAD_TO_DEG: 180 / Math.PI,
            MAX_MARGIN: 1.0E-9 // max margin of error for the "equals" check
          });

          L.LatLng.prototype = {
            equals: function (obj) { // (LatLng) -> Boolean
              if (!obj) { return false; }

              obj = L.latLng(obj);

              var margin = Math.max(
                      Math.abs(this.lat - obj.lat),
                      Math.abs(this.lng - obj.lng));

              return margin <= L.LatLng.MAX_MARGIN;
            },

            toString: function (precision) { // (Number) -> String
              return 'LatLng(' +
                      L.Util.formatNum(this.lat, precision) + ', ' +
                      L.Util.formatNum(this.lng, precision) + ')';
            },

            // Haversine distance formula, see http://en.wikipedia.org/wiki/Haversine_formula
            // TODO move to projection code, LatLng shouldn't know about Earth
            distanceTo: function (other) { // (LatLng) -> Number
              other = L.latLng(other);

              var R = 6378137, // earth radius in meters
                  d2r = L.LatLng.DEG_TO_RAD,
                  dLat = (other.lat - this.lat) * d2r,
                  dLon = (other.lng - this.lng) * d2r,
                  lat1 = this.lat * d2r,
                  lat2 = other.lat * d2r,
                  sin1 = Math.sin(dLat / 2),
                  sin2 = Math.sin(dLon / 2);

              var a = sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2);

              return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            },

            wrap: function (a, b) { // (Number, Number) -> LatLng
              var lng = this.lng;

              a = a || -180;
              b = b ||  180;

              lng = (lng + b) % (b - a) + (lng < a || lng === b ? b : a);

              return new L.LatLng(this.lat, lng);
            }
          };


        },

        initialize: function(options) {


            this.unlockError();
            //check if there is a communicator

            if(options.com){
              this.com = options.com;
              this.com.addModule(this);
            }
            this.url=options.url;
            this.geoJson=options.geoJson;

            this.geoJsonLayers = [];

            this.zoom = options.zoom;

            this.elem = options.element;
            this.bbox = options.bbox || this.bbox;
            this.cluster = options.cluster;
            this.popup = options.popup;
            this.legend = options.legend;


            this.selection = options.selection;

            this.dict={}; //list of markers
            this.selectedMarkers = {}; // list of selected markers
            this.url = options.url;
            this.geoJson = options.geoJson;

            this.initIcons();
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
              //this.popup(params);
              break;
            case 'resetAll':
              this.resetAll();
              break;
            case 'filter':
              this.filter(params);
              break;
            default:
              console.warn('verify the action name');
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
          if(this.url){
            this.requestGeoJson(this.url);
          }else{
            if (this.cluster){
              this.initClusters(this.geoJson);
            }else{
              this.initLayer(this.geoJson);
            }
          }
          this.initMap();
        },

        google: function(){
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

              var _this = this;
              this._reposition = google.maps.event.addListenerOnce(map, 'center_changed',
                function() { _this.onReposition(); });
              this._google = map;

              google.maps.event.addListenerOnce(map, 'idle',
                function() { _this._checkZoomLevels(); });
              //Reporting that map-object was initialized.
              this.fire('MapObjectInitialized', { mapObject: map });
            },
          });

          var googleLayer = new CustomGMap('HYBRID', {unloadInvisibleTiles: true,
            updateWhenIdle: true,
            reuseTiles: true
          });

          this.map.addLayer(googleLayer);
        },

        initMap: function(){


            this.map = new L.Map(this.elem, {
              center: this.center ,
              zoom: 3,
              minZoom: 2,
              inertia: false,
              zoomAnimation: true,
              keyboard: false //fix scroll window
            });


            var markerArray = [];
            var geoJsonLayer = this.geoJsonLayers[0];
            if(geoJsonLayer){
              for(var index in geoJsonLayer._layers) {
                  var lat = geoJsonLayer._layers[index]._latlng.lat;
                  var lng = geoJsonLayer._layers[index]._latlng.lng;
                  markerArray.push( new L.marker([lat, lng]));
              }
            }

            if (markerArray.length >1 && this.fiBounds){
              var group = L.featureGroup(markerArray);
            this.map.fitBounds(group.getBounds());
            } else {
              this.map.setZoom(this.zoom);
            }


            this.google();

            if(this.legend){
              this.addCtrl(tpl_legend);
            }

            if(this.markersLayer){
              this.addMarkersLayer2Map();
            }
        },

        addMarkersLayer2Map: function(){
          if(this.geoJsonLayers.length !== 0){
            for (var i = 0; i < this.geoJsonLayers.length; i++) {
              this.markersLayer.addLayer(this.geoJsonLayers[i]);
            }
          }

          this.map.addLayer(this.markersLayer);

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
          var criterias = {
              page: 1,
              per_page: 20,
              criteria: null,
              offset: 0,
              order_by: '[]',
          };

          var ctx = this;
          var jqxhr = $.getJSON( url, function(criterias){
          }).done(function(geoJson) {
              if (ctx.cluster){
                ctx.initClusters(geoJson);
              }else{
                ctx.initLayer(geoJson);
              }
          })
          .fail(function(msg) {
              console.error( msg );
          });

        },


        initIcons: function(){
          this.focusedIcon = new L.DivIcon({className: 'custom-marker focus'});
          this.selectedIcon = new L.DivIcon({className: 'custom-marker selected'});
          this.icon = new L.DivIcon({className: 'custom-marker'});
        },

        changeIcon: function(m){
          if (m.checked) {
            m.setIcon(this.selectedIcon);
          }else{
            m.setIcon(this.icon);
          }
        },

        setCenter: function(geoJson){
          if(!geoJson){
            this.center = new L.LatLng(0,0);
          }else{
            this.center = new L.LatLng(
              geoJson.features[0].geometry.coordinates[1],
              geoJson.features[0].geometry.coordinates[0]
            );
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
          var ctx = this;
          var i =0;
          var geoJsonLayer = new L.geoJson(geoJson, {
              // onEachFeature: function (feature, layer) {
              // },
              pointToLayer: function(feature, latlng) {
                i++;
                var infos = '';
                if(!feature.id)
                feature.id = i;
                if(feature.checked){
                  marker = new L.marker(latlng, {icon: ctx.focusedIcon});
                }else{
                  marker = new L.marker(latlng, {icon: ctx.icon});
                }

                marker.checked=false;

                if(ctx.popup){
                  prop = feature.properties;
                  for(var p in prop){
                    infos +='<b>'+p+' : '+prop[p]+'</b><br />';
                  }
                  marker.bindPopup(infos);
                }

                ctx.dict[feature.id] = marker;

                marker.on('click', function(e){
                  if(this.selection){
                    this.interaction('selection', feature.id);
                  }
                }, ctx);

                return marker;
              },
          });
          this.geoJsonLayers.push(geoJsonLayer);
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


        initClusters: function(geoJson){
          var firstLvl= true;
          this.firstLvl= [];
          var ctx= this;
          var CustomMarkerClusterGroup = L.MarkerClusterGroup.extend({
            _defaultIconCreateFunction: function (cluster, contains) {
              //push on firstLvl
              if(firstLvl){
                ctx.firstLvl.push(cluster);
              }
              if(ctx.selection){
                return ctx.getClusterIcon(cluster, false, 0);
              }else{
                return ctx.getClusterIcon(cluster);
              }

            },
          });

          this.markersLayer = new CustomMarkerClusterGroup({
              disableClusteringAtZoom : 18,
              maxClusterRadius: 100,
              polygonOptions: {color: "rgb(51, 153, 204)", weight: 2},
          });

          this.setGeoJsonLayer(geoJson);

          //return [this.geoJsonLayers, this.markersLayer];

        },

        /*==========  updateClusterParents :: display selection inner cluster  ==========*/
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
        /** recursive */
        updateAllClusters: function(c, all){
          var childClusters = c._childClusters;
          this.updateClusterStyle(c, all);

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
          var ctx = this;

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
              if (e.boxZoomBounds.contains(marker._latlng) /*&& !ctx.selectedMarkers[key]*/) {

                  if(!marker._markers){
                    bbox.push(marker.feature.id);
                  }else{
                    childs = marker.getAllChildMarkers();

                    ctx.updateAllClusters(marker, true);

                    for (var i = childs.length - 1; i >= 0; i--) {
                      childs[i].checked = true;
                      ctx.selectedMarkers[childs[i].feature.id] = childs[i];
                      bbox.push(childs[i].feature.id);

                      ctx.changeIcon(childs[i]);
                    }
                    if(marker.__parent){
                        ctx.updateClusterParents(marker, []);
                    }
                  }
              }
            }
            ctx.interaction('selectionMultiple', bbox);
            $(ctx).trigger('ns_bbox_end', e.boxZoomBounds);
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
          var marker = this.dict[id];

          if(this.lastFocused && this.lastFocused != marker){
            this.changeIcon(this.lastFocused);
          }
          this.lastFocused = marker;
          marker.setIcon(this.focusedIcon);

          var center = marker.getLatLng();
          this.map.panTo(center);
          var ctx = this;

          if(zoom){
            setTimeout(function(){
              ctx.map.setZoom(zoom);
             }, 1000);
          }
        },

        /*==========  resetMarkers :: reset a list of markers  ==========*/
        resetAll: function(){
          var marker;
          for (var key in this.selectedMarkers) {
              marker = this.selectedMarkers[key];
              marker.checked=!marker.checked;
              this.changeIcon(marker);
          }
          if(this.cluster){
            var cluster;
            for (var i = this.firstLvl.length - 1; i >= 0; i--) {
              cluster = this.firstLvl[i];
              this.updateAllClusters(cluster, false);
            }
          }
          this.selectedMarkers={};
        },

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
          this.map.panTo(center);
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
                        'coordinates': [attr.longitude, attr.latitude],
                    },
                    'properties': {
                      //todo
                    },
                };
                features.features.push(feature);
            });
            return features;
        },

        //apply filters on the map from a collection
        filter: function(param){
          var geoJson, coll;
          coll = _.clone(param);
          //if(coll instanceof Backbone.Collection){
          geoJson = this.coll2GeoJson(coll);
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
          /*
          }else{
            this.updateLayers(geoJson);
          }*/
        },

        updateLayers: function(geoJson){
          this.map.removeLayer(this.markersLayer);
          this.geoJsonLayers = [];
          this.initClusters(geoJson);
          this.addMarkersLayer2Map();

          if(this.bbox){
            this.addBBox(this.markersLayer);
          }
        },


  }
  return( Map );
});
