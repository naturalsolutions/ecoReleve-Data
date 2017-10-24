define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',

  'modules/objects/object.new.view',
  './client.model',
], function(
  $, _, Backbone, Marionette,
  NewView, ClientModel
){

  'use strict';
  return NewView.extend({

    ModelPrototype: ClientModel,
  });
});
