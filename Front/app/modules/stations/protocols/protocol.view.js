define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  './observation.view',

  'i18n'
], function($, _, Backbone, Marionette, LytObservation) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/protocols/protocol.tpl.html',
    className: 'protocol full-height',

    regions: {
      'rgObservation': '.js-rg-observation'
    },

    initialize: function(options){
      this.model.set('index', 0);
      this.options.newObs = options.newObs;
    },

    onShow: function(){
      this.displayObs();
    },
    
    addObs: function(){
      
    },

    displayObs: function(){
      var model = new Backbone.Model();
      model.fieldsets = this.model.get('obs')[0].fieldsets;
      model.schema = this.model.get('obs')[0].schema;

      model.set('id', this.model.get('obs')[0].data.ID || 0);
      model.urlRoot = 'stations/' + this.model.get('stationId') + '/protocols' + '/';
      
      this.rgObservation.show(this.obs = new LytObservation({
        model: model,
      }));
    },
  });
});

