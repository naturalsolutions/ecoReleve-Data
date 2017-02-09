define([
  'underscore',
  'backbone',
  'config',
  'marionette',
  'moment'
], function (_, Backbone, config, Marionette, moment) {
  'use strict';

  return Marionette.ItemView.extend({
    template: 'app/base/home/tpl/tpl-info.html',

    model: new Backbone.Model({
      siteName: config.siteName,
      date: moment().format('dddd, MMMM Do YYYY'),
      nbIndiv: 0
    }),

    modelEvents: {
      change: 'render'
    },

    initialize: function () {
      this.$el.hide();
      var isDomoInstance = config.instance;
      if (!isDomoInstance || (isDomoInstance != 'demo')) {
        $.ajax({
          context: this,
          url: config.coreUrl + 'individuals/count'
        }).done(function (data) {
          this.model.set('nbIndiv', data);
          this.$el.fadeIn();
        });
      }
    },

    onDestroy: function () {
      delete this.model;
    }
  });
});
