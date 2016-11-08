define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'ag-grid',
  'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',

  'i18n'

], function($, _, Backbone, Marionette, AgGrid, ObjectPicker, utils_1) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/ns_modules/ns_grid/grid.tpl.html',
    className: 'grid-view full-height flex-column',
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

    ui: {
      'totalSelected': '.js-total-selected',
      'totalRecords': '.js-total-records',

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
      this.model.set('typeObj', options.typeObj || 1);
      if(options.url){
        this.model.set('url', options.url);
      } else {
        this.model.set('url', options.type + '/');
      }
      this.idName = options.idName || false;

      if (options.com) {
        this.com = options.com;
        this.com.addModule(this);
      }

      this.clientSide = options.clientSide || false;
      this.filters = options.filters || [];
      this.afterGetRows = options.afterGetRows;
      this.afterFetchColumns = options.afterFetchColumns;
      this.afterFirstRowFetch = options.afterFirstRowFetch;
      this.goTo = options.goTo || false;

      this.name = options.name || false;

      this.gridOptions = {
        enableSorting: true,
        enableColResize: true,
        rowHeight: 40,
        headerHeight: 30,
        suppressRowClickSelection: true,
        onRowSelected: this.onRowSelected.bind(this),
        onGridReady: function(){
          $.when(_this.deferred).then(function(){
            setTimeout(function(){
              _this.gridOptions.api.sizeColumnsToFit();
              if(!_this.model.get('totalRecords')){
                _this.model.set('totalRecords', _this.gridOptions.rowData.length);
              }
              _this.ui.totalRecords.html(_this.model.get('totalRecords'));
            }, 0);
          });
        },
        onAfterFilterChanged: function(){
          _this.handleSelectAllChkBhv();
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

      if(!this.gridOptions.rowData){
        if(this.clientSide){
          this.fetchData();
        } else {
          this.deferred = $.Deferred();
          this.initDataSource();
        }
      }

      if(this.gridOptions.rowSelection === undefined){
        this.model.set('legend', false);
      } else {
        this.model.set('legend', true);
      }
    },

    onRowSelected: function(e){
      if(this.ready){
        this.interaction('singleSelection', e.node.data[this.idName] || e.node.data.id || e.node.data.ID, this);
      }

      // verify if all elts are selected
      var rowsToDisplay = this.gridOptions.api.getModel().rowsToDisplay;
      var allSelected = false;
      var allSelected = rowsToDisplay.every(function(node){
        return node.selected;
      });
      this.checkUncheckSelectAllUI(allSelected);

      // update status bar ui
      this.ui.totalSelected.html(this.gridOptions.api.getSelectedRows().length);
    },

    formatColumns: function(columnDefs){
      var _this = this;
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


        if(_this.gridOptions.rowSelection === 'multiple' && i == 0){
          _this.formatSelectColumn(col)
        }
        //draft
        if(col.cell == 'autocomplete'){
          _this.addBBFEditor(col);
        }
      });
      return columnDefs;
    },

    handleSelectAllChkBhv: function(){
      if(!this.$el.find('.js-check-all')){
        return;
      }

      var allSelected = false;

      var selectedNodes = this.gridOptions.api.getSelectedNodes();
      var rowsToDisplay = this.gridOptions.api.getModel().rowsToDisplay;

      if(Object.keys(this.gridOptions.api.getFilterModel()).length === 0 ){
        if(selectedNodes.length === rowsToDisplay.length){
          allSelected = true;
        }
      } else {
        if(selectedNodes.length < rowsToDisplay.length){
         allSelected = false;
        } else {
          allSelected = rowsToDisplay.every(function(node){
            return node.selected;
          });
        }
      }
      this.checkUncheckSelectAllUI(allSelected);
    },

    formatSelectColumn: function(col){
      var _this = this;
      col.checkboxSelection = true;
      col.headerCellTemplate = function() {
        var eCell = document.createElement('span');
        eCell.innerHTML = '\
            <img class="js-check-all pull-left" value="unchecked" src="./app/styles/img/unchecked.png" title="check only visible rows (after filter)" style="padding-left:10px; padding-top:7px" />\
            <div id="agResizeBar" class="ag-header-cell-resize"></div>\
            <span id="agMenu" class="ag-header-icon ag-header-cell-menu-button"></span>\
            <div id="agHeaderCellLabel" class="ag-header-cell-label">\
              <span id="agSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>\
              <span id="agSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>\
              <span id="agNoSort" class="ag-header-icon ag-sort-none-icon"></span>\
              <span id="agFilter" class="ag-header-icon ag-filter-icon"></span>\
              <span id="agText" class="ag-header-cell-text"></span>\
            </div>\
        ';
          var checkboxElt = eCell.querySelector('.js-check-all');

          checkboxElt.addEventListener('click', function(e) {
            if($(this).attr('value') === 'unchecked'){
              _this.checkUncheckSelectAllUI(true);
              _this.selectAllVisible();
            } else {
              _this.checkUncheckSelectAllUI(false);
              _this.deselectAllVisible();
            }
          });

        return eCell;
      };
    },

    checkUncheckSelectAllUI: function(allSelected){
      var checkbox = this.$el.find('.js-check-all');
      if(allSelected){
        checkbox.attr('value', 'checked');
        checkbox.attr('src', './app/styles/img/checked.png');
      } else {
        checkbox.attr('value', 'unchecked');
        checkbox.attr('src', './app/styles/img/unchecked.png');
      }
    },


    addBBFEditor: function(col){
      //draft
      var _this = this;
      var BBFEditor = function () {

      };

      var options = {
        key: col.options.target,
        schema: {
          options: col.options,
          editable: true
        },
        fromGrid: true
      };

      BBFEditor.prototype.init = function(params){
        var self = this;
        this.picker = new ObjectPicker(options);
        this.input = this.picker.render();
        var _this = this;
        if (params.charPress){
          this.input.$el.find('input').val(params.charPress).change();
        } else {
          if (params.value){
            if (params.value.label !== undefined  ){
              this.input.$el.find('input').attr('data_value',params.value.value);
              this.input.$el.find('input').val(params.value.label).change();
            } else {
              this.input.$el.find('input').val(params.value).change();
            }
          }
        }
      };
      BBFEditor.prototype.getGui = function(){
        return this.input.el;
      };
      BBFEditor.prototype.afterGuiAttached = function () {
        this.input.$el.find('input').focus();
      };
      BBFEditor.prototype.getValue = function() {
        if (this.input.getItem){
          return this.input.getItem();
        }
        return this.input.getValue();
      };
      col.cellEditor = BBFEditor;
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
        if (this.afterFetchColumns){
          this.afterFetchColumns(this);
        }
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
            _this.model.set('totalRecords', response[0].total_entries);
            _this.gridOptions.api.setRowData(response[1]);
          } else {
            _this.model.set('totalRecords', response.length);
            _this.gridOptions.api.setRowData(response);
          }
          if(_this.afterFirstRowFetch){
            _this.afterFirstRowFetch();
          }
        });
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
            order_by: JSON.stringify(order_by),
            typeObj: _this.model.get('typeObj')
          };

          $.ajax({
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

            _this.deferred.resolve();
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
      if(this[action]){
        this[action](params, from);
      } else {
        console.warn(this, 'doesn\'t have ' + action + ' action');
      }
    },
    interaction: function(action, params){
      if(this.com){
        this.com.action(action, params, this);
      }
    },

    focus: function(param){
      var _this = this;
      this.gridOptions.api.forEachNode( function (node) {
          if (node.data[_this.idName] === param || node.data.ID === param || node.data.id === param) {
            _this.gridOptions.api.ensureIndexVisible(node.childIndex);
            setTimeout(function(){
               var tmp = _this.idName || (node.data.id)? 'id' : 'ID';
              _this.gridOptions.api.setFocusedCell(node.childIndex, tmp, null);
            },0);
          }
      });
    },

    focusByIndex: function(params) {
      var _this = this;
        _this.gridOptions.api.ensureIndexVisible(params.index);
        setTimeout(function(){
          _this.gridOptions.api.setFocusedCell(params.index, 'ID', null);
          //_this.gridOptions.api.setFocusedCell(params.index, 'id', null);
        },0);
    },

    multiSelection: function(params, from){
      //could certainly be optimized
      var _this = this;
      this.gridOptions.api.forEachNode( function (node) {
        params.map( function (param) {
          if(node.data[_this.idName] === param || node.data.ID === param || node.data.id === param){
              _this.ready = false;
              node.setSelected(true);
              _this.ready = true;
          }
        });
      });
    },

    singleSelection: function(param, from){
      var _this = this;
      if(from == this){
        return;
      }
      this.gridOptions.api.forEachNode( function (node) {
          if (node.data[_this.idName] === param || node.data.ID === param || node.data.id === param) {
            _this.ready = false;
            node.setSelected(!node.selected);
            _this.ready = true;
          }
      });
    },

    selectAllVisible: function(){
      this.gridOptions.api.getModel().rowsToDisplay.map(function(node){
        node.setSelected(true);
      });
    },

    deselectAllVisible: function(){
      this.gridOptions.api.getModel().rowsToDisplay.map(function(node){
        node.setSelected(false);
      });
    },


    deselectAll: function(){
      this.ready = false;
      this.gridOptions.api.deselectAll();
      this.ready = true;
    },

    selectAll: function(){
      this.ready = false;
      this.gridOptions.api.selectAll();
      this.ready = true;
    },

    clientSideFilter: function(filters){
      var _this = this;
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
            'id': node.data[_this.idName] || node.data.id || node.data.ID,
            'geometry': {
                'type': 'Point',
                'coordinates': [
                  node.data.LAT || node.data.latitude || node.data.lat,
                  node.data.LON || node.data.longitude || node.data.lon
                ],
            },
            'properties': node.data,
        };
        featureCollection.features.push(feature);
        if(node.selected){
          selectedFeaturesIds.push(node.data[_this.idName] || node.data.id || node.data.ID);
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

      var gridDiv = this.$el.find('.js-ag-grid')[0];
      this.grid = new AgGrid.Grid(gridDiv, this.gridOptions);


      if(!this.clientSide && !this.gridOptions.rowData){
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

      if(AgGrid.extended){
        return;
      }

      AgGrid.TextFilter.prototype.afterGuiAttached = function(options) {
        this.eFilterTextField.focus();
        $(this.eGui.querySelector('#applyButton')).addClass('btn full-width');
        $(this.eGui).find('input, select').each(function(){
          $(this).addClass('form-control input-sm');
        });
      };


      AgGrid.NumberFilter.prototype.afterGuiAttached = function(options) {
        this.eFilterTextField.focus();
        $(this.eGui.querySelector('#applyButton')).addClass('btn full-width');
        $(this.eGui).find('input, select').each(function(){
          $(this).addClass('form-control input-sm');
        });
        $(this.eGui).find('input').each(function(){
          $(this).attr('type', 'number');
        });
      };


      AgGrid.StandardMenuFactory.prototype.showPopup = function (column, positionCallback) {
          var filterWrapper = this.filterManager.getOrCreateFilterWrapper(column);
          //ag Menu
          var eMenu = document.createElement('div');
          $(eMenu).addClass('ag-menu');

          eMenu.appendChild(filterWrapper.gui);

          //Add header
          var eheader = document.createElement('div');
          eheader.className = 'header-filter';
          //eheader.innerHTML = "<p><span class='glyphicon glyphicon-align-right glyphicon-filter'></span></p>";
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
          var template = Backbone.Marionette.Renderer.render('app/ns_modules/ns_grid/pagination.tpl.html');

          /*'<div class="ag-paging-panel ag-font-style">' +
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
              '</div>';*/
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

      AgGrid.extended = true;
    },

  });
});
