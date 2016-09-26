define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  'ag-grid',

  'i18n'

], function($, _, Backbone, Marionette, config, AgGrid, utils_1) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/ns_modules/ns_grid/grid.tpl.html',
    className: 'grid-view full-height',
    name: 'gird',

    pageSize: 200,
    firstRowFetch: true,
    first: true,
    filters: [],
    comeback: false,
    ready: true,

    events: {
      'click #agMenu': 'focusFilter',
      'keypress .ag-row': 'keypress'
    },

    keypress: function(e){
      if(e.keyCode == 13){
        $(e.currentTarget).click();
      }
    },

    initialize: function(options){
      this.extendAgGrid();

      var _this = this;
      this.model = options.model || new Backbone.Model();
      this.model.set('type', options.type);
      if(options.url){
        this.model.set('url', config.coreUrl + options.url);
      } else {
        this.model.set('url', config.coreUrl + options.type + '/');
      }

      if (options.com) {
        this.com = options.com;
        this.com.addModule(this);
      }

      this.clientSide = options.clientSide || false;
      this.filters = options.filters || [];
      this.afterGetRows = options.afterGetRows;
      this.afterFirstRowFetch = options.afterFirstRowFetch;
      this.goTo = options.goTo || false;

      this.name = options.name || false;

      this.gridOptions = {
        enableSorting: true,
        enableColResize: true,
        rowHeight: 40,
        headerHeight: 30,
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        onRowSelected: this.onRowSelected.bind(this),
        onGridReady: function(){
            setTimeout(function(){
              _this.gridOptions.api.sizeColumnsToFit();
            }, 0)
        },
        onAfterFilterChanged: function(){
          _this.clientSideFilter();
        }
        //overlayNoRowsTemplate: '<span>No rows to display</span>',
        //overlayLoadingTemplate: '',
      };

      if(!this.clientSide) {
        $.extend(this.gridOptions, {
          enableServerSideSorting: true,
          paginationPageSize: this.pageSize,
        });
      }

      $.extend(this.gridOptions, options.gridOptions || {});

      if(options.columns){
        this.gridOptions.columnDefs = this.formatColumns(options.columns);
        this.columnDeferred = true;
      } else {
        this.fetchColumns();
      }

      if(this.clientSide){
        this.fetchData();
      } else {
        this.initDataSource();
      }
    },

    onRowSelected: function(e){
      if(this.ready){
        this.interaction('selection', e.node.data.id || e.node.data.ID, this);
      }
    },

    formatColumns: function(columnDefs){
      var filter = {
        'string' : 'text',
        'integer': 'number',
      };
      columnDefs.map(function(col, i) {
        if(col.name){
          col.headerName = col.label;
          col.field = col.name;
          col.filter = filter[col.cell];
        }
        col.minWidth = col.minWidth || 100;
        col.maxWidth = col.maxWidth || 300;
        col.filterParams = col.filterParams || {apply: true};
      });
      return columnDefs;
    },

    fetchColumns: function(){
      this.columnDeferred = $.ajax({
        url: this.model.get('url') + 'getFields',
        method: 'GET',
        context: this,
        data: {
          name: this.name || 'default'
        }
      }).done( function(response) {
        this.gridOptions.columnDefs = this.formatColumns(response);
      });
    },

    fetchData: function(){
      var _this = this;
      this.deferred = $.ajax({
        url: this.model.get('url'),
        method: 'GET',
        context: this,
      }).done( function(response) {
        this.gridOptions.rowData = response;
        $.when(this.columnDeferred).then(function(){
          if(response[1] instanceof Array){
            _this.gridOptions.api.setRowData(response[1]);
          } else {
            _this.gridOptions.api.setRowData(response);
          }
        })
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

            if(_this.firstRowFetch && _this.afterFirstRowFetch){
              _this.afterFirstRowFetch();
            }

            _this.firstRowFetch = false;
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

    action: function(action, params, from){
      switch(action){
        case 'focus':
          this.focus(params);
          break;
        case 'selection':
          this.selectOne(params, from);
          break;
        case 'selectionMultiple':
          this.selectMultiple(params);
          break;
        case 'filter':
          this.filter(params);
          break;
        case 'focus':
          this.focus(params);
          break;
        default:
          break;
      }
    },
    interaction: function(action, params){
      if(this.com){
        this.com.action(action, params, this);
      }else{
        this.action(action, params);
      }
    },

    focus: function(param){
      var _this = this;
      this.gridOptions.api.forEachNode( function (node) {
          if (node.data.ID === param) {
            _this.gridOptions.api.ensureIndexVisible(node.childIndex);
            setTimeout(function(){
              _this.gridOptions.api.setFocusedCell(node.childIndex, 'ID', null);
            },0);
          }
      });
    },

    focusByIndex: function(params) {
      console.log(params);
      var _this = this;
        _this.gridOptions.api.ensureIndexVisible(params.index);
        setTimeout(function(){
          _this.gridOptions.api.setFocusedCell(params.index, 'ID', null);
        },0);
    },

    selectOne: function(param, from){
      var _this = this;
      this.gridOptions.api.forEachNode( function (node) {
          if (node.data.ID === param) {
              if(from === _this){
                _this.ready = false;
                node.setSelected(node.selected);
                _this.ready = true;
              } else {
                _this.ready = false;
                node.setSelected(!node.selected);
                _this.ready = true;
              }
          }
      });
    },

    clientSideFilter: function(filters){
      var data = [];
      var featureCollection = {
          'features': [],
          'type': 'FeatureCollection'
      };
      var feature;

      var selectedFeaturesIds = [];

      //because it's better than to do others loops
      this.gridOptions.api.forEachNodeAfterFilterAndSort(function(node, index){
        feature = {
            'type': 'Feature',
            'id': node.data.id || node.data.ID,
            'geometry': {
                'type': 'Point',
                'coordinates': [node.data.LAT, node.data.LON],
            },
            'properties': node.data,
        };
        featureCollection.features.push(feature);
        if(node.selected){
          selectedFeaturesIds.push(node.data.id || node.data.ID);
        }
      });

      this.interaction('loadFeatureCollection', {
        featureCollection: featureCollection,
        selectedFeaturesIds: selectedFeaturesIds
      });
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

      $.when(this.columnDeferred).then(function(){
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

      var gridDiv = this.$el.find('#grid')[0];
      this.grid = new AgGrid.Grid(gridDiv, this.gridOptions);


      if(!this.clientSide){
        this.gridOptions.api.setDatasource(this.dataSource);
      }
      if(this.gridOptions.rowModelType == 'pagination'){
        this.paginationController = this.gridOptions.api.paginationController;
      }

      /*if(this.goTo){
        $.when(this.deferred).then(function(){
          _this.jumpToPage(_this.goTo.page - 1);
          setTimeout(function(){
          _this.gridOptions.api.ensureIndexVisible(_this.goTo.index);
          setTimeout(function(){
            _this.gridOptions.api.setFocusedCell(_this.goTo.index, 'ID', null);
          }, 0);
          },500);
      });
      }*/
    },
    
    jumpToPage: function(index){
      this.paginationController.currentPage = index;
      this.paginationController.loadPage();      
    },

    focusFilter: function(e){
      setTimeout(function(){
        $(e.currentTarget).parent().addClass('current-filter');
      }, 0);
    },

    extendAgGrid: function(){
      var _this = this;

      AgGrid.StandardMenuFactory.prototype.showPopup = function (column, positionCallback) {
          var filterWrapper = this.filterManager.getOrCreateFilterWrapper(column);
          //ag Menu
          var eMenu = document.createElement('div');
          var addCssClass = function (element, className) {
            var _this = this;
            if (!className || className.length === 0) {
                return;
            }
            if (className.indexOf(' ') >= 0) {
                className.split(' ').forEach(function (value) { return _this.addCssClass(element, value); });
                return;
            }
            if (element.classList) {
                element.classList.add(className);
            }
            else {
                if (element.className && element.className.length > 0) {
                    var cssClasses = element.className.split(' ');
                    if (cssClasses.indexOf(className) < 0) {
                        cssClasses.push(className);
                        element.className = cssClasses.join(' ');
                    }
                }
                else {
                    element.className = className;
                }
            }
        };

          //utils_1.Utils.addCssClass(eMenu, 'ag-menu');
          addCssClass(eMenu, 'ag-menu');

          eMenu.appendChild(filterWrapper.gui);

          //Add header
          var eheader = document.createElement('div');
          eheader.className = 'header-filter';
          eheader.innerHTML = "<p><span class='glyphicon glyphicon-align-right glyphicon-filter'></span></p>";
          eMenu.insertBefore(eheader, eMenu.firstChild);

          // need to show filter before positioning, as only after filter
          // is visible can we find out what the width of it is
          var elt = this.filterManager.gridCore.eGridDiv;
          var closedCallback = function(){
            $(elt).find('.ag-header-cell').removeClass('current-filter');
          };
          var hidePopup = this.popupService.addAsModalPopup(eMenu, true, closedCallback);

          positionCallback(eMenu);
          if (filterWrapper.filter.afterGuiAttached) {
              var params = {
                  hidePopup: hidePopup
              };
              filterWrapper.filter.afterGuiAttached(params);
          }
      };

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
