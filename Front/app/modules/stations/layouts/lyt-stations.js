define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'config',
  'ns_modules/ns_com',
  'ns_grid/model-grid',
  //'ns_filter/model-filter',
  'ns_filter_bower',
  'ns_map/ns_map',

  './lyt-station-detail',

  'i18n'

], function($, _, Backbone, Marionette, Swal,
  config, Com, NSGrid, NsFilter, NsMap,
  LytStationsEdit
) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height white rel',

    template: 'app/modules/stations/templates/tpl-stations.html',

    events: {
      'click button#submit': 'filter',
      'click #stationType a.tab-link': 'displayTab',
      'click #back': 'hideDetails',
      'click button#activeGridPanel': 'activeGridPanel',
      'click button#activeMapPanel': 'activeMapPanel',
      'click button#clear': 'clearFilter',
    },

    ui: {
      'stationId': '#stationId',
      'filters': '#filters',
      'detail': '#detail',
      'gridPanel': '#gridPanel',
      'mapPanel': '#mapPanel',
      'btnGridPanel': 'button#activeGridPanel',
      'btnMapPanel': 'button#activeMapPanel',
      'paginator': '#paginator'
    },

    regions: {
      gridRegion: '#grid',
      paginatorRegion: '#paginator',
      detail: '#detail'
    },

    initialize: function(options) {
      if (options.id) {
        this.stationId = options.id;
      }
      this.com = new Com();
    },

    activeGridPanel: function(e) {
      this.ui.mapPanel.removeClass('active');
      this.ui.gridPanel.addClass('active');
      // this.ui.paginator.removeClass('hidden');

      this.ui.btnMapPanel.removeClass('active');
      this.ui.btnGridPanel.addClass('active');
    },

    activeMapPanel: function(e) {
      this.ui.gridPanel.removeClass('active');
      this.ui.mapPanel.addClass('active');
      //this.ui.paginator.addClass('hidden');

      this.ui.btnGridPanel.removeClass('active');
      this.ui.btnMapPanel.addClass('active');
    },

    displayMap: function() {
      this.map = new NsMap({
        url: config.coreUrl + 'stations/?geo=true',
        cluster: true,
        com: this.com,
        zoom: 3,
        element: 'map',
        popup: true,
      });
    },

    onShow: function() {
      this.initGrid();
      this.displayGrid();
      this.displayFilters(4);
      this.displayMap();

      var view;
      if (this.stationId) {
        this.detail.show(view = new LytStationsEdit({
          stationId: this.stationId
        }));
        this.ui.detail.removeClass('hidden');
      }
      console.log(view);
    },

    initGrid: function(url) {
      var _this = this;
      var url = config.coreUrl + 'stations/';

      this.grid = new NSGrid({
        pageSize: 20,
        pagingServerSide: true,
        com: this.com,
        name: 'StationGrid',
        url: url,
        rowClicked: true,
        totalElement: 'totalEntries',
      });
      this.grid.rowClicked = function(args) {
        _this.rowClicked(args.row);
      };
      this.grid.rowDbClicked = function(args) {
        _this.rowDbClicked(args.row);
      };
    },

    displayGrid: function() {
      var _this = this;
      this.gridRegion.show(this.grid.getGridView());
      this.$el.find('#paginator').html(_this.grid.displayPaginator());
    },

    displayFilters: function(typeObj) {
      this.filters = new NsFilter({
        url: config.coreUrl + 'stations/',
        com: this.com,
        name: 'StationGrid',
        typeObj: typeObj,
        filterContainer: this.ui.filters,
      });
    },

    rowClicked: function(row) {
      this.detail.show(new LytStationsEdit({
        model: row.model,
        globalGrid: this.grid
      }));
      var id = row.model.get('ID');
      Backbone.history.navigate('#stations/' + id, {trigger: false});
      this.ui.detail.removeClass('hidden');
      this.grid.currentRow = row;
      this.grid.upRowStyle();
    },

    rowDbClicked: function(row) {
      this.rowClicked(row);
    },

    hideDetails: function() {
      Backbone.history.navigate('#stations/', {trigger: false});
      this.ui.detail.addClass('hidden');
    },

    filter: function(e) {
      this.filters.update();
    },

    clearFilter: function() {
      this.filters.reset();
    },

    displayTab: function(e) {
      var type = $(e.target).attr('name');

      $('.tab-ele').removeClass('activeTab');
      $(e.target).parent().addClass('activeTab');

      if (type == 'allSt') {
        type = false;
      }else {
        type = true;
      }
      this.grid.lastImportedUpdate(type);
      this.map.lastImportedUpdate(type);
    }
  });
});
