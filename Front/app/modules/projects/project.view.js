define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'L',

  'ns_map/ns_map',
  'ns_grid/grid.view',
  'ns_form/NsFormsModuleGit',

  'modules/objects/detail.view',
  './project.model',


], function(
  $, _, Backbone, Marionette, Swal, Translater, L,
  NsMap, GridView, NsForm,
  DetailView, ProjectModel
){

  'use strict';

  return DetailView.extend({
    ModelPrototype: ProjectModel,
    events: {
      'click button.NsFormModuleEdit': 'toggleMapControl'
    },

    toggleMapControl: function(e){
      console.log('click Edit', e)
      // this.map.toggleDrawing();
      // this.map.setDrawControl();
      
    },

    displayGrids: function(){
      this.displayStationsGrid();
    },

    reload: function(options) {
      this.model.set('id', options.id);

      this.com.addModule(this.map);
      this.map.com = this.com;
      this.map.url = this.model.get('type') + '/' + this.model.get('id')  + '/stations?geo=true'; //only this one
      this.map.updateFromServ();
      this.map.url = false;

      this.displayForm();
      this.displayGrids();
      this.afterShow();
    },

    displayMap: function(geoJson) {
      var self = this;
      this.map = new NsMap({
        url: 'projects/' + this.model.get('id')  + '/stations?geo=true', ////only this one
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

    displayStationsGrid: function() {
      this.rgStationsGrid.show(this.stationsGrid = new GridView({
        columns: this.model.get('stationsColumnDefs'),
        type: this.model.get('type'),
        url: this.model.get('type') + '/' + this.model.get('id')  + '/stations',
        clientSide: true,
      }));
      this.gridViews.push(this.stationsGrid);
    },

  });
});
