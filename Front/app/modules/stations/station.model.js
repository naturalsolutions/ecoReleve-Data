define([
  'underscore',
  'backbone'
], function(
  _, Backbone
) {
  'use strict';

  return Backbone.Model.extend({
    defaults: {
      displayMap: true,

      label: 'stations',
      single: 'station',
      type: 'stations',
      authorisationLvl: {
        create_new: 'js-user',
      },

      uiGridConfs: [
        {
          name: 'details',
          label: 'Details'
        },
        {
          name: 'protocols',
          label: 'Protocols'
        },
      ],

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
