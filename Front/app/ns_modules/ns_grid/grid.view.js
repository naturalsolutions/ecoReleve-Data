
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  'ag-grid',

  'i18n'

], function($, _, Backbone, Marionette, config, AgGrid) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/ns_modules/ns_grid/grid.tpl.html',
    className: 'grid-view full-height',
    name: 'gird',

    pageSize: 200,
    elementSelector: '#grid',
    navigate: true,
    
    firstGetRows: true,
    filters: [],

    initialize: function(options){
      var _this = this;
      this.model = options.model || new Backbone.Model();
      this.model.set('type', options.type);
      this.model.set('url', config.coreUrl + options.type + '/');
      
      if (options.com) {
        this.com = options.com;
        this.com.addModule(this);
      }
      
      this.filters = options.filters || [];
      //if (typeof options. === 'boolean')

      this.onRowClicked = options.onRowClicked;
      this.afterGetRows = options.afterGetRows;
      this.afterFirstGetRows = options.afterFirstGetRows;

      this.gridOptions = {
        enableSorting: true,
        enableServerSideSorting: true,
        enableServerSideFilter: false,
        enableColResize: true,
        rowHeight: 40,
        headerHeight: 30,
        paginationPageSize: this.pageSize,
        overlayLoadingTemplate: '',
        sortingOrder: ['desc','asc'],
        suppressScrollLag: true,
        rowModelType: 'pagination',

        //rowData: this.data,
        //overlayNoRowsTemplate: '<span>No rows to display</span>',
        
        onRowClicked: function(row){
          if(this.onRowClicked)
          _this.onRowClicked(row);
        },
      };

      this.extendAgGrid();
      this.iniColumns();
      this.initDataSource();
    },

    iniColumns: function(){
      var columnDefs = [];

      this.columnDefered = $.ajax({
        url: this.model.get('url') + 'getFields',
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
            maxWidth: 300,
          }
          if(i == 0) {
            columnDef.pinned = 'left';
            columnDef.minWidth = 50;
            columnDef.width = 50;
            columnDef.maxWidth = 100;
          }
          columnDefs.push(columnDef);
        });

        this.gridOptions.columnDefs = columnDefs;
      });
    },

    initDataSource: function(){
      var _this = this;
      this.dataSource = {
        rowCount: null,
        maxConcurrentDatasourceRequests: 2,
        getRows : function (params){
          var pageSize = params.endRow - params.startRow;
          var page = params.endRow / pageSize;
          var offset = (page - 1) * pageSize;

          var order_by = [];
          if(params.sortModel.length) {
            order_by = [params.sortModel[0].colId + ':' + params.sortModel[0].sort];
          }

          var status = {
            criteria: JSON.stringify(_this.filters),
            page: page,
            per_page: pageSize,
            offset: offset,
            order_by: JSON.stringify(order_by)
          };

          _this.deferred = $.ajax({
            url: _this.model.get('url'),
            method: 'GET',
            context: this,
            data: status
          }).done( function(response) {
            var rowsThisPage = response[1];
            var total = response[0].total_entries;

            _this.model.set('totalRecords', total);
            _this.model.set('status', status);

            if(_this.afterGetRows){
              _this.afterGetRows();
            }

            if(_this.firstGetRows && _this.afterFirstGetRows){
              _this.afterFirstGetRows();
            }

            _this.firstGetRows = false;
            params.successCallback(rowsThisPage , total);
          });

        }
      };
    },

    serialize: function() {
      var data = [];
      this.gridOptions.api.forEachNodeAfterFilterAndSort(function(node, index){
        if (node.data) {
          data.push(node.data || node.data);
        }
      });
      this.model.set({
        list: data,
        filters: this.filters,
        filterModel: this.gridOptions.api.getFilterModel(),
        sortModel: this.gridOptions.api.getSortModel(),
      });
      return this.model.attributes;
    },

    action: function(action, params){
      switch(action){
        case 'focus':
          this.focus(params);
          break;
        case 'selection':
          this.selectOne(params);
          break;
        case 'selectionMultiple':
          this.selectMultiple(params);
          break;
        case 'filter':
          this.filter(params);
          break;
        default:
          break;
      }
    },

    interaction: function(action, params){
      if(this.com){
        this.com.action(action, params);
      }else{
        this.action(action, params);
      }
    },

    filter: function(filters){
      this.filters = filters;
      if(this.dataSource){
        this.gridOptions.api.setDatasource(this.dataSource);
      }
    },

    changePageSize: function(pageSize){
      this.gridOptions.paginationPageSize = new Number(pageSize);
      this.gridOptions.api.setDatasource(this.dataSource);
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

    onDestroy: function(){
      this.gridOptions.api.destroy();
      this.grid.destroy();
    },

    exportData: function(){
      var params = {
        allColumns: true,
        fileName: this.model.get('type') + new Date().toJSON().slice(0,10) + '.csv',
        columnSeparator: ','
      }
      this.gridOptions.api.exportDataAsCsv(params);
    },

    displayGrid: function() {
      var _this = this;

      var gridDiv = document.querySelector(this.elementSelector);
      this.grid = new AgGrid.Grid(gridDiv, this.gridOptions);
      this.gridOptions.api.setDatasource(this.dataSource);
      this.gridOptions.api.sizeColumnsToFit();
      this.paginationController = this.gridOptions.api.paginationController;
    },
    
    jumpToPage: function(index){
      this.paginationController.currentPage = index;
      this.paginationController.loadPage();      
    },

    extendAgGrid: function(){

      AgGrid.PaginationController.prototype.createTemplate = function () {
          var localeTextFunc = this.gridOptionsWrapper.getLocaleTextFunc();
          var template = '<div class="ag-paging-panel ag-font-style">' +
              '<span id="pageRowSummaryPanel" class="ag-paging-row-summary-panel">' +
              '<span id="firstRowOnPage"></span>' +
              ' [TO] ' +
              '<span id="lastRowOnPage"></span>' +
              ' [OF] ' +
              '<span id="recordCount"></span>' +
              '</span>' +
              '<span class="ag-paging-page-summary-panel">' +
              '<button type="button" class="ag-paging-button btn btn-default" id="btFirst">[FIRST]</button>' +
              '<button type="button" class="ag-paging-button btn btn-default" id="btPrevious">[PREVIOUS]</button>' +
              '<span class="col-xs-5">' +
              '[PAGE] ' +
              '<span id="current"></span>' +
              ' [OF]' +
              '<span id="total"></span>' +
              '</span>' +
              '<button type="button" class="ag-paging-button btn btn-default" id="btNext">[NEXT]</button>' +
              '<button type="button" class="ag-paging-button btn btn-default" id="btLast">[LAST]</button>' +
              '</span>' +
              '</div>';
          return template
              .replace('[PAGE]', localeTextFunc('page', 'Page'))
              .replace('[TO]', localeTextFunc('to', 'to'))
              .replace('[OF]', localeTextFunc('of', 'of'))
              .replace('[OF]', localeTextFunc('of', 'of'))
              .replace('[FIRST]', localeTextFunc('first', 'First'))
              .replace('[PREVIOUS]', localeTextFunc('previous', 'Previous'))
              .replace('[NEXT]', localeTextFunc('next', 'Next'))
              .replace('[LAST]', localeTextFunc('last', 'Last'));
      };
    },

  });
});
