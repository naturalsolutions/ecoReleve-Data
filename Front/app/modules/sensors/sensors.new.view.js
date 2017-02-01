define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',

  'modules/objects/object.new.view',
  './sensor.model',
], function(
  $, _, Backbone, Marionette,
  NewView, SensorModel
){

  'use strict';
  return NewView.extend({

    ModelPrototype: SensorModel,
  });
});
