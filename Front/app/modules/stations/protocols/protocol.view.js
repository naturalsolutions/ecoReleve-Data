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

    },

    onShow: function(){
      var model = new Backbone.Model(this.model.get('obs')[0]);

      this.rgObservation.show(this.obs = new LytObservation({
        model: model
      }));
    },

  });
});

