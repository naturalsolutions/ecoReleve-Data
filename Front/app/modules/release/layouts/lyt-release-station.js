//radio
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'config',
  'ns_modules/ns_com',
  'ns_grid/model-grid',
  //'ns_filter/model-filter_module',
  'ns_filter_bower',
  'modules/release/layouts/lyt-release-individual',

], function($, _, Backbone, Marionette, Swal, Translater, config,

  Com, NsGrid, NsFilter, LytReleaseIndiv
) {

  'use strict';

  return Marionette.LayoutView.extend({
    /*===================================================
        =            Layout Stepper Orchestrator            =
        ===================================================*/

    template: 'app/modules/release/templates/tpl-release-station.html',
    className: 'full-height animated white rel',

    events: {
      'click #btnFilter': 'filter',
      'click button#clear': 'clearFilter',
      'click .tab-link': 'displayTab',
      'click #useStation': 'useStation',
      'click #back': 'hideDetails',
    },

    ui: {
      'grid': '#grid',
      'paginator': '#paginator',
      'filter': '#filters',
      'detail': '#detail',
      'totalEntries': '#totalEntries',
      'toolbar': '#toolbar'
    },

    regions: {
      detail: '#detail',
      toolbar: '#toolbar'
    },

    initialize: function(options) {
      this.translater = Translater.getTranslater();
      this.com = new Com();
      this.stationId = options.id;
    },

    onRender: function() {

      this.$el.i18n();
    },

    onShow: function() {
      var _this = this;
      if(this.stationId){
        var model = new Backbone.Model();
        model.url = config.coreUrl + 'stations/' + this.stationId;
        model.fetch({
          success: function(md){
            _this.detail.show(new LytReleaseIndiv({station: md}));
            _this.ui.detail.removeClass('hidden');
          },
        });
      }
      this.initGrid();
      this.displayFilters(4);
    },

    initGrid: function() {
      var _this = this;
      this.grid = new NsGrid({
        pageSize: 20,
        pagingServerSide: true,
        com: this.com,
        name: 'StationGrid',
        url: config.coreUrl + 'stations/',
        urlParams: this.urlParams,
        rowClicked: true,
        totalElement: 'stations-count',
        onceFetched: function(params) {
          _this.totalEntries(this.grid);
        }
      });
      this.grid.rowClicked = function(args) {
        _this.rowClicked(args.row);
      };
      this.grid.rowDbClicked = function(args) {
        _this.rowDbClicked(args.row);
      };
      this.displayGrid();
    },

    displayGrid: function() {
      this.ui.grid.html(this.grid.displayGrid());
      this.ui.paginator.html(this.grid.displayPaginator());
      var callback = function() {
        _this.filter();
      };
      this.grid.lastImportedUpdate(false, callback);
    },

    displayFilters: function(typeObj) {
      this.filters = new NsFilter({
        url: config.coreUrl + 'stations/',
        com: this.com,
        name: 'StationGrid',
        typeObj: typeObj,
        filterContainer: this.ui.filter,
      });
    },

    filter: function() {
      this.filters.update();
    },
    clearFilter: function() {
      this.filters.reset();
    },
    rowClicked: function(row) {
      if (this.currentRow) {
        this.currentRow.$el.removeClass('active');
      }
      row.$el.addClass('active');
      this.currentRow = row;
    },

    rowDbClicked: function(row) {
      this.rowClicked(row);
      this.useStation();
    },

    hideDetails: function() {
      Backbone.history.navigate('#release', {trigger: false});
      this.ui.detail.addClass('hidden');
    },

    totalEntries: function(grid) {
      this.total = grid.collection.state.totalRecords;
      $(this.ui.totalEntries).html(this.total);
    },

    useStation: function() {
      this.detail.show(new LytReleaseIndiv({station: this.currentRow.model}));
      this.ui.detail.removeClass('hidden');
    },

    displayTab: function(e) {
      var _this = this;
      $('.tab-ele').removeClass('activeTab');
      $(e.target).parent().addClass('activeTab');
      var type = $(e.target).attr('name');
      if (type == 'allSt') {
        type = false;
      }else {
        type = true;
      }

      this.grid.lastImportedUpdate(type);
    },

  });
});
