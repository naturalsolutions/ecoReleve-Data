define([
  'jquery',
  'underscore',
  'backbone',
  'backgrid',
  //'backgrid_select_all'
  'backgridSelect_all'
], function($, _, Backbone, Backgrid, BGSA){
  'use strict';
  return Backbone.Model.extend({

    /*
    {
      name: 'age',
      label: 'AGE',
      editable: false,
      cell: 'string',
      headerCell: null,        }, {*/

    initialize: function(options){
      this.checkedColl = options.checkedColl;
      var _this = this;

        this.columns = new Backgrid.Columns();
        this.columns.url = options.url;
        this.columns.fetch({
          reset: true,
          data: {'checked' : this.checkedColl},
          success : function (data) {
            _this.buildColumn();
          }
        });
    },

    buildColumn : function () {
      for (var i = 0; i < this.columns.length ; i++) {
      }
    },

    checkedColl: function() {

    },

  });
});
