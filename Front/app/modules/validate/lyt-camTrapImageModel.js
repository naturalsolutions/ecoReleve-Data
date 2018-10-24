define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',

], function($, _, Backbone, Marionette, Translater, config) {

  'use strict';

  return  Backbone.Model.extend({
    defaults:{
      path :'',
      name: '',
      id: null,
      checked: null,
      validated: null,
			tags : null,
			note : null,
      date_creation : '',
      stationId : null,
      activeFront : false
    },
    initialize : function() {
      
    },

    set : function(attributes , options) {
      var tmpResult;
      if ( attributes && Object.keys(attributes).length == 1 && attributes.hasOwnProperty('activeFront') ) {
        // delete attributes.activeFront;
        this.attributes.activeFront = attributes.activeFront
        this.trigger("custom:activechange");
        return;
        // options = {silent:true}
      }
      tmpResult = Backbone.Model.prototype.set.call(this, attributes, options);
      if (options && options.hasOwnProperty('refreshUI') && options.refreshUI ) {
        this.trigger('custom:refreshUI');
      }
      return tmpResult

      // delete attributes.activeFront;
      // return Backbone.Model.prototype.set.call(this, attributes, options);
    },

    sync :function(method,model,options){
      options.attrs = _.omit(this.attributes, 'positionFront', 'activeFront','id');
      return Backbone.sync.call(this, method, model, options);
    }
  });
});
