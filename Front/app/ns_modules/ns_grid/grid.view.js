
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  'ag-grid',

  'i18n'

], function($, _, Backbone, Marionette, config, AgGrid

) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/ns_modules/ns_grid/grid.tpl.html',
    className: 'grid-view full-height',
    pageSize: 200,
    elementSelector: '#grid',
    navigate: true,
    
    initialize: function(options){
      var _this = this;
      this.url = options.url;
      this.type = options.type;

      this.gridOptions = {
        enableSorting: true,
        enableServerSideSorting: true,
        enableServerSideFilter: false,
        enableColResize: true,
        rowHeight: 35,
        headerHeight: 40,
        paginationPageSize: 200,
        overlayLoadingTemplate: '',
        sortingOrder: ['desc','asc'],
        suppressScrollLag: true,
        rowModelType: 'pagination',

        //rowData: this.data,
        //overlayNoRowsTemplate: '<span>No rows to display</span>',
        
        onRowClicked: function(row){
          Backbone.history.navigate(_this.type + '/' + (row.data.id || row.data.ID), {trigger: true});
        },
      };
      this.initDataSource();
      this.iniColumns();
    },

    iniColumns: function(){
      var columnDefs = [];

      this.columnDefered = $.ajax({
        url: this.url + 'getFields',
        method: 'GET',
        context: this,
        data: {
          name: 'default'
        }
      }).done( function(response) {

        response.map(function(col, i) {
          var columnDef = {
            headerName: col.label,
            field: col.name,
            hide: !(col.renderable),
            minWidth: 100,
            maxWidth: 500,
          }
          if(i == 0) {
            columnDef.pinned = 'left';
          }
          columnDefs.push(columnDef);
        });

        this.gridOptions.columnDefs = columnDefs;
      });
    },

    initDataSource: function(){
      var _this = this;
      this.myDataSource = {
        rowCount: null,
        paginationPageSize : 200,
        maxConcurrentDatasourceRequests: 2,
        getRows : function (params){
          var page = params.endRow / _this.pageSize;
          var offset = (page - 1) * _this.pageSize;

          var order_by = [];
          if(params.sortModel.length) {
            order_by = [params.sortModel[0].colId + ':' + params.sortModel[0].sort];
          }

          _this.deferred = $.ajax({
            url: _this.url,
            method: 'GET',
            context: this,
            data: {
              criteria: JSON.stringify({}),
              page: page,
              per_page: _this.pageSize,
              offset: offset,
              order_by: JSON.stringify(order_by)
            }
          }).done( function(response) {
            var rowsThisPage = response[1];
            var total = response[0].total_entries;

            params.successCallback(rowsThisPage , total);
          });

        }
      };
    },

    onShow: function() {
      var _this = this;

      $.when(this.columnDefered).then(function(){
        _this.displayGrid();
      })

      this.onResize = _.debounce( function() {
        _this.gridOptions.api.sizeColumnsToFit();
      }, 100);
      $(window).on('resize', this.onResize);
    },

    displayGrid: function() {
      var _this = this;
      var gridDiv = document.querySelector(this.elementSelector);
      this.grid = new AgGrid.Grid(gridDiv, this.gridOptions);

      this.gridOptions.api.sizeColumnsToFit();
      this.gridOptions.api.setDatasource(this.myDataSource);
    },

  });
});
