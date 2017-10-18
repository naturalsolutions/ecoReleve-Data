define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',

  'modules/objects/object.new.view',
  './project.model',
], function(
  $, _, Backbone, Marionette,
  NewView, ProjectModel
){

  'use strict';
  return NewView.extend({

    ModelPrototype: ProjectModel,
  });
});
