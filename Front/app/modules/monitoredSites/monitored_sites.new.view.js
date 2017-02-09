define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  
  'modules/objects/object.new.view',
  './monitored_site.model',

], function(
  $, _, Backbone, Marionette,
  NewView, MonitoredSiteModel
){

  'use strict';
  return NewView.extend({
    ModelPrototype: MonitoredSiteModel,
  });
});
