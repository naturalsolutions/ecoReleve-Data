define([
  'jquery',
  'underscore',
  'backbone',
  'ns_grid/customCellRenderer/decimal5Renderer',
  'ns_grid/customCellRenderer/dateTimeRenderer',
], function(
  $, _, Backbone, Decimal5Renderer, DateTimeRenderer
){
  'use strict';

  return Backbone.Model.extend({
    defaults: {
      label: 'projects',
      single: 'project',
      type: 'projects',

      icon: 'reneco-site',

      fk: 'FK_Project',

      formConfig: {
        modelurl: 'projects',
        displayMode: 'display',
        reloadAfterSave: true,
        }
      },

      uiGridConfs: [
      ],

      //MonitoredSiteGridHistory
  });
});
