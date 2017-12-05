define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',

  'ns_grid/grid.view',

	'i18n'
], function($, _, Backbone, Marionette, GridView
){

  'use strict';
  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/export/templates/tpl-export-step3.html',


    name : '<span class="export-step3"></span>',

    ui: {
      'columns': '#columns',
      'requirement': '#requirement',
      'totalRecords': '.js-total-records'
    },

    events: {
      'change .js-col-chk': 'updateGrid',
      'click button#all': 'selectAll',
      'click button#none': 'unselectAll',
    },

    regions: {
      rgGrid: '.js-rg-grid'
    },

    initialize: function(options) {
      this.model = options.model;
      this.cols = [];
      this.model.set('columns', this.cols);
      
    },

    onShow: function() {
      this.displayGrid();
      this.$el.i18n();
      var stepName = i18n.translate('export.step3-label');
      $('.export-step3').html(stepName);
    },

    displayGrid: function() {
      var _this = this;
      var afterFirstRowFetch = function(){
        _this.ui.totalRecords.html(this.model.get('totalRecords'));
        _this.displayColumnsPicker(this.gridOptions.columnApi.getAllGridColumns());
        _this.verififyCols();
      };
      this.rgGrid.show(this.gridView = new GridView({
        clientSide: true,
        filters: this.model.get('filters'),
        url: 'export/views/' + this.model.get('viewId') + '/',
        afterFirstRowFetch: afterFirstRowFetch
      }));
    },

    displayColumnsPicker: function(columnsList) {
      var _this = this;
      
      columnsList.map(function(col){
        var colLine = '<div class="checkbox">' +
          '<label><input class="js-col-chk" checked type="checkbox" value="' + col.colDef.field + '">' + col.colDef.headerName + '</label>' +
        '</div>';
        _this.ui.columns.append(colLine);
      });
    },

    updateGrid: function(e) {
      this.gridView.gridOptions.columnApi.setColumnVisible($(e.target).val(), $(e.target).is(':checked'));
      this.verififyCols();
    },

    unselectAll: function() {
      this.ui.columns.find('input').each(function() {
        $(this).prop('checked', false).change();
      });
    },

    selectAll: function() {
      this.ui.columns.find('input').each(function() {
        $(this).prop('checked', true).change();
      });
    },

    verififyCols: function() {
      var _this = this;
      this.cols = [];
      this.ui.columns.find('input:checked').each(function() {
        _this.cols.push($(this).val());
      });

      if (this.cols.length) {
        this.ui.requirement.val('passed').change();
        this.model.set('columns', this.cols);
      }else {
        this.ui.requirement.val('').change();
        this.model.set('columns', []);
      }
    },

    validate: function() {
      return this.model;
    },

    check: function() {
      if (this.cols.length) {
        return true;
      } else {
        return false;
      }
    },

  });
});
