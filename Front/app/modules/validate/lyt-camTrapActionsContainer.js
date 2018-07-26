define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config'


], function ($, _, Backbone, Marionette, Translater, config) {

	'use strict';
	return Marionette.ItemView.extend({
        template : 'app/modules/validate/templates/tpl-ActionsContainer.html',
        className : 'actionsBtn',
        collection : new Backbone.Collection(),

        initialize : function() {
          var _this = this;
          this.listenTo(this.collection, 'custom:activechange custom:refreshUI change', function(){
            _this.render()
          });
        },
        changeCollection: function(collection) {
          var _this = this;
          this.collection = collection;
          this.listenTo(this.collection, 'custom:activechange custom:refreshUI change', function() {
            _this.render()
          })
        } 
      });

});

