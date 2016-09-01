define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'ns_grid/model-grid',
	'i18n'
], function($, _, Backbone, Marionette, config, NsGrid
) {
  'use strict';
  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/export/templates/tpl-export-step3.html',


    name : '<span class="export-step3"></span>',

    ui: {
      'grid': '#grid',
      'columns': '#columns',
      'requirement': '#requirement'
    },

    events: {
      'change .col-chk': 'updateGrid',
      'click button#all': 'selectAll',
      'click button#none': 'unselectAll',
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
      this.grid = new NsGrid({
        pageSize: 20,
        pagingServerSide: true,
        url: config.coreUrl + 'export/views/' + this.model.get('viewId') + '/',
        urlParams: this.model.get('filters'),
        totalElement: 'total',
        onceFetched: function() {
          _this.displayColumnsPicker();
        },
      });

      this.ui.grid.html(this.grid.displayGrid());
    },

    displayColumnsPicker: function() {
      var _this = this;
      this.columns = this.grid.columns;
      this.columns.each(function(model, index) {
        var colLine = '<div class="checkbox"><label><input class="col-chk" type="checkbox" value="' + model.get('name') + '">' + model.get('name') + '</label></div>';
        _this.ui.columns.append(colLine);
      });
    },

    updateGrid: function(e) {
      var model = this.columns.findWhere({'name': $(e.target).val()});
      if ($(e.target).is(':checked')) {
        model.set('renderable', true);
      }else {
        model.set('renderable', false);
      }
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
