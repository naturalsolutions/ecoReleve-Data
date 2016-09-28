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
    model: new SensorModel(),
    initialize: function(options) {
      switch (options.objectType){
        case 'argos':
          this.model.set('objectType', 1);
          this.type = 1;
          break;
        case 'gsm':
          this.model.set('objectType', 2);
          this.type = 2;
          break;
        case 'rfid':
          this.model.set('objectType', 3);
          this.type = 3;
          break;
        case 'vhf':
          this.model.set('objectType', 4);
          this.type = 4;
          break;
        default:
          Backbone.history.navigate('#' + this.model.get('type'), {trigger: true});
          break;
      }
    }
  });
});
