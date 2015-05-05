define([
    'ol3',
    'config',
    'radio',
    'modules2/map/views/basemap'
], function(ol, config, Radio, BaseMap) {

    'use strict';

    return BaseMap.extend({

        initialize: function() {
            //*Radio.channel('gsm-detail').comply('moveCenter', this.moveCenter, this);
            Radio.channel('import-gpx').comply('updateMap', this.updateMap, this);
        },

        onShow: function() {
            BaseMap.prototype.onShow.apply(this, []);
            this.interaction = new ol.interaction.Select({
                condition: ol.events.condition.click
            });
            this.map.addInteraction(this.interaction);
            this.interaction.getFeatures().on('add', function(e) {
                //Radio.channel('import-gpx').command('updateGrid', e.element.id_);
            });
            // add popup
            var element = document.getElementById('popup');
            var popup = new ol.Overlay({
              element: element,
              positioning: 'bottom-center',
              stopEvent: false
            });
            this.map.addOverlay(popup);

            // display popup on click
            this.map.on('click', function(evt) {
              var feature = this.forEachFeatureAtPixel(evt.pixel,
                  function(feature, layer) {
                    return feature;
                  });
              if (feature) {
                var geometry = feature.getGeometry();
                var coord = geometry.getCoordinates();
                var prop = feature.getProperties();
                var id = feature.getId();
                var label = prop.label;
                popup.setPosition(coord);
                var popupContent = 'id: '+ id + '<br/>name: '+ label ;
                $(element).popover('destroy');
                $(element).popover({
                  'placement': 'top',
                  'html': true,
                  'content': popupContent
                });
                //$(element).popover('destroy');
                //$(element).popover();
                $(element).popover('show');
              } else {
                $(element).popover('destroy');
              }
            });
        },
        onRemove: function() {
            Radio.channel('import-gpx').stopComplying('updateMap');
        },
        updateMap: function(model) {
            var id = model.get('id');
            var lat = model.get('latitude');
            var lon = model.get('longitude');
            var nblayers =  this.map.getLayers().getLength();
            // vector layer is the latest one 
            var feature = this.map.getLayers().item(nblayers - 1).getSource().getFeatureById(id);
            this.interaction.getFeatures().clear();
            this.interaction.getFeatures().push(feature);
            var center = [lon, lat];
            this.moveCenter(center);
            //this.map.getView().setZoom(8);
        }
    });
});
