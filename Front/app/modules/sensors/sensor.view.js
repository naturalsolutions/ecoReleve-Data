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
  './sensor.model'

], function (
  $, _, Backbone, Marionette, Swal, Translater,
  NsMap, GridView, NsForm,
  DetailView, SensorModel
) {
  'use strict';

  return DetailView.extend({

    regions: {
      rgNavbar: '.js-rg-navbar',
      rgHistoryGrid: '.js-rg-history-grid',
      rgEquipmentGrid: '.js-rg-equipment-grid',
      rgStationsGrid: '.js-rg-stations-grid'
    },

    events: {
      'click .tab-link': 'displayTab'
    },

    ModelPrototype: SensorModel,

    displayGrids: function () {
      this.displayHistoryGrid();
      this.displayDeploymentGrid();
    },

    displayMap: function () {
      this.map = new NsMap({
        url: this.model.get('type') + '/' + this.model.get('id') + '?geo=true',
        cluster: true,
        zoom: 3,
        element: 'map',
        popup: true
      });
    },

    displayHistoryGrid: function () {
      this.rgHistoryGrid.show(this.historyGrid = new GridView({
        columns: this.model.get('historyColumnsDefs'),
        type: this.model.get('type'),
        url: this.model.get('type') + '/' + this.model.get('id') + '/history',
        clientSide: true
      }));
      this.gridViews.push(this.rgHistoryGrid);
    },

    displayDeploymentGrid: function () {
      this.rgDeploymentGrid.show(this.deploymentGrid = new GridView({
        columns: this.model.get('deploymentColumnsDefs'),
        type: this.model.get('type'),
        url: this.model.get('type') + '/' + this.model.get('id') + '/equipment',
        clientSide: true
      }));
      this.gridViews.push(this.rgDeploymentGrid);
    }

  });
});
