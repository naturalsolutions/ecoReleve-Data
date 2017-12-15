define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'ns_map/ns_map',
  'modules/objects/object.new.view',
  './project.model',
], function(
  $, _, Backbone, Marionette, NsMap,
  NewView, ProjectModel
){

  'use strict';
  return NewView.extend({

    ModelPrototype: ProjectModel,
    template: 'app/modules/projects/project.new.tpl.html',
    className: 'full-height white',

    onShow: function() {
      this.displayForm();
      this.displayMap();
      this.$el.i18n();
    },

    displayMap: function(geoJson) {
      var self = this;
      this.map = new NsMap({
        //url: 'projects/' + this.model.get('id')  + '/stations?geo=true', ////only this one
        zoom: 4,
        element: 'map',
        popup: true,
        // cluster: true,
        disableCentering: true,
        drawable: true,
      });

    },

    afterShow: function(){
      var _this = this;
      $.when(this.nsForm.jqxhr).done(function(data){
        var geom = data.data.geom;
        if(_this.map.drawnItems){
          _this.map.drawnItems.clearLayers();
        }
        if(geom){
          _this.map.addGeometry(geom, true);
        } 
      });


      this.nsForm.butClickSave = function(e){
        var geom;
        if (_this.map.getGeometry().features.length > 0){
          geom = _this.map.getGeometry().features[0];
        } else {
          geom = null;
        }
        _this.nsForm.model.set('geom',geom)
        NsForm.prototype.butClickSave.call(this, e);
      }
    },
  });
});
