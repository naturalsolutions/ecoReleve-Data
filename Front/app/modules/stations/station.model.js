define([
  'underscore',
  'backbone',
], function(
  _, Backbone
) {
  'use strict';

  return Backbone.Model.extend({
    defaults: {
      label: 'stations',
      single: 'station',
      type: 'stations',

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