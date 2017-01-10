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
      'rgObservation': '.js-rg-observation',
    },

    events:{
      'click .js-prev': 'prevObs',
      'click .js-next': 'nextObs',
    },

    prevObs: function(){
      this.model.attributes.index--;
      if(this.model.get('index') <= 0){
        this.model.attributes.index = this.model.get('obs').length;
      }
      this.navigate();
    },

    nextObs: function(){
      this.model.attributes.index++;
      if(this.model.get('index') > this.model.get('obs').length){
        this.model.attributes.index = 1;
      }
      this.navigate();
    },

    navigate: function(){
      var hash = window.location.hash.split('?');
      var obs = this.model.get('obs')[this.model.get('index') - 1];
      var url = hash[0] + '?proto=' + this.model.get('ID') + '&obs=' + obs;
      Backbone.history.navigate(url, {trigger: true});
    },

    initialize: function(options){
      var _this = this;
      this.model.set('index', 0);
      this.model.get('obs').map(function(obs, i){
        if(obs == _this.model.get('currentObs')){
          _this.model.set('index', i + 1);
        }
      });
    },

    onShow: function(){
      this.displayObs();
    },
    
    addObs: function(){
      
    },

    displayObs: function(){
      var model = new Backbone.Model();

      if(this.model.get('currentObs') == 0){
        model.set('id', 0);
      } else {
        model.set('id', this.model.get('obs')[this.model.get('index') - 1]);
      }
      
      model.urlRoot = 'observations/';
      model.set('ID', this.model.get('ID'));

      this.rgObservation.show(this.obs = new LytObservation({
        model: model,
        parentModel: this.model
      }));
    },
  });
});

