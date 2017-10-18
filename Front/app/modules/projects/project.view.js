define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',

  'ns_map/ns_map',
  'ns_grid/grid.view',
  'ns_form/NSFormsModuleGit',

  'modules/objects/detail.view',
  './project.model',


], function(
  $, _, Backbone, Marionette, Swal, Translater,
  NsMap, GridView, NsForm,
  DetailView, ProjectModel
){

  'use strict';

  return DetailView.extend({
    ModelPrototype: ProjectModel,

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
    },

    displayMap: function(geoJson) {
      this.map = new NsMap({
        url: 'projects/' + this.model.get('id')  + '/stations?geo=true', ////only this one
        zoom: 4,
        element: 'map',
        popup: true,
        cluster: true
      });
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
