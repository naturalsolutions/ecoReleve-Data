define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',

  'modules/objects/object.new.view',
  './individual.model'

], function (
  $, _, Backbone, Marionette,
  NewView, IndividualModel
) {
  'use strict';

  return NewView.extend({
    ModelPrototype: IndividualModel
  });
});
