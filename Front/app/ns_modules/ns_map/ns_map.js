
/**
	TODO:
	- fitBounds
	- find a way to automaticly destroy the map with the related view
	----> replace the prototype by a marionnette view?
**/

define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'L',
	'leaflet_cluster',
	'googleLoaer',
	//'text!./tpl-legend.html',
	'leaflet_google',

], function($, _, Backbone , Marionette, L, cluster, GoogleMapsLoader //tpl_legend
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

		this.url=options.url;
		this.geoJson=options.geoJson;

		this.elem = options.element || 'map';
		this.zoom = options.zoom || 10;
		this.disableClustring = options.disableClustring || 18;
		this.bbox = options.bbox || false;
		this.area = options.area || false;
		this.cluster = options.cluster || false;
		this.popup = options.popup || false;
		this.legend = options.legend || false;
		this.selection = options.selection || false;

		this.dict={}; //list of markers
		this.selectedMarkers = {}; // list of selected markers
		this.geoJsonLayers = [];

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
					console.error('verify the action name');
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
			this.focusedIcon = new L.DivIcon({className		: 'custom-marker focus'});
			this.selectedIcon = new L.DivIcon({className	: 'custom-marker selected'});
			this.icon = new L.DivIcon({className			: 'custom-marker'});


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

		ready: function(){
			this.setCenter();

			this.map = new L.Map(this.elem, {
				center: this.center ,
				zoom: this.zoom || 4,
				minZoom: 2,
				inertia: false,
				zoomAnimation: true,
				keyboard: false, //fix scroll window
				attributionControl: false,
			});
			this.google();

			if(this.legend){
				this.addCtrl(tpl_legend);
			}
			if(this.markersLayer){
				this.addMarkersLayer();
			}
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
/*					this.geoJsonLayers[i].length = 0;
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
		},

		setCenter: function(geoJson){
			if(!geoJson || (geoJson.features.length == 0) ){
				this.center = new L.LatLng(0,0);
			}else{
				this.center = new L.LatLng(
					geoJson.features[0].geometry.coordinates[1],
					geoJson.features[0].geometry.coordinates[0]
				);
				this.center = new L.LatLng(0,0);
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

			var markerList = [];

			var features = geoJson.features;
			var feature, latlng;

			for (var j = 0; j < features.length; j++) {
				feature = features[j];
				if(feature.geometry.coordinates[1] != null && feature.geometry.coordinates[0] != null){
					latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
					i++;
					var infos = '';
					if(!feature.id)
					feature.id = i;
					if(feature.checked){
						marker = L.marker(latlng, {icon: ctx.focusedIcon});
					}else{
						marker = L.marker(latlng, {icon: ctx.icon});
					}

					marker.checked=false;

					if(ctx.popup){
						prop = feature.properties;
						for(var p in prop){
							infos +='<b>'+p+' : '+prop[p]+'</b><br />';
						}
						marker.bindPopup(infos);
					}

					marker.feature = feature;

					ctx.dict[feature.id] = marker;

					marker.on('click', function(e){
						if(ctx.selection){
							ctx.interaction('selection', this.feature.id);
						}
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

								//bad functionName
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

		addArea: function(){
			var ctx = this;

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


		resetAll: function(){
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
			//TODO : refact
			var _this = this;
			if(this.url){
				$.ajax({
					url: this.url,
					data: {
						'criteria': JSON.stringify( param)
					},
				}).done(function(geoJson) {
					if (_this.cluster){
						_this.updateLayers(geoJson);
					}else{
						_this.initLayer(geoJson);
					}
				});
				return;
			}
			var geoJson;

			var coll = _.clone(param);
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

		initErrorWarning: function(msg){
			$('#'+this.elem).before('<div class="map-error"><div class="msg col-sm-8">'+msg+'</div></div>');
		},

		errorWarning: function(msg){
			$('.map-error').fadeIn();
			$('.map-error .msg').html(msg);
		},

		updateLayers: function(geoJson){
			if(geoJson == false){
				this.errorWarning('<i>There is too much datas to display on the map. <br /> Please be more specific in your filters.</i>');
				if(this.markersLayer){
					this.map.removeLayer(this.markersLayer);
				}
				return false;
			}
			$('.map-error').fadeOut('slow');
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
		},


	}
	return( Map );
});
