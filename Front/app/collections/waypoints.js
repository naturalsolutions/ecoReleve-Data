define([
	'backbone',
], function(Backbone) {
  'use strict';
  return Backbone.Collection.extend({

    save: function() {
      this.each(function(model) {
        model.save();
      });
    },
    destroy: function() {
      do {
        this.each(function(model) {
          model.destroy();
        });
      }
      while (this.length > 0);
    }
  });

	});
