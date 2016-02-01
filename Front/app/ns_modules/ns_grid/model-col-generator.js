define([
  'jquery',
  'underscore',
  'backbone',
  'backgrid',
  'backgridSelect_all'
], function($, _, Backbone, Backgrid, BGSA) {
  'use strict';
  return Backbone.Model.extend({

    initialize: function(options) {
      this.checkedColl = options.checkedColl;
      var self = this;

      if (options.paginable) {
        Backgrid.Column.prototype.defaults.headerCell = this.hc;
      }

      this.columns = new Backgrid.Columns();
      this.columns.url = options.url;

      this.columns.fetch({
        reset: true,
        data: {'checked' : this.checkedColl},
        success : function (data) {
          self.buildColumn();
        }
      });
    },

    buildColumn : function () {
      for (var i = 0; i < this.columns.length ; i++) {
      }
    },

  });
});
