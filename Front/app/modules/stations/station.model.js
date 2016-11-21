define([
  'underscore',
  'backbone'
], function(
  _, Backbone
) {
  'use strict';

  return Backbone.Model.extend({
    defaults: {
      map: true,

      label: 'stations',
      single: 'station',
      type: 'stations',

      uiTabs: [
        {
          name: 'all',
          label: 'All',
        },
        {
          name: 'lastImported',
          label: 'Last imported',
        }
      ],

      formConfig: {
        name: 'StaForm',
        modelurl: 'stations',
        displayMode: 'display',
        objectType: 1,
        reloadAfterSave: true,
      }
    }
  });
});