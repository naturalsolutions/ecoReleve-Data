define([
  'underscore',
  'backbone',
  'config',
], function(
  _, Backbone, config
) {
  'use strict';

  return Backbone.Model.extend({
    defaults: {
      label: 'stations',
      single: 'station',
      type: 'stations',

      formConfig: {
        name: 'StaForm',
        modelurl: config.coreUrl + 'stations',
        displayMode: 'display',
        objectType: 1,
        reloadAfterSave: true,
      }
    }
  });
});