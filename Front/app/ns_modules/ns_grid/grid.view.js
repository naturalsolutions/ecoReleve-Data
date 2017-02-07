define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'ag-grid',
  'sweetAlert',

  './custom.text.filter',
  './custom.number.filter',
  './custom.date.filter',
  './custom.select.filter',
  './custom.text.autocomplete.filter',

  'vendors/utils',
  
  './custom.renderers',
  './custom.editors',

  'ns_grid/customCellRenderer/decimal5Renderer',
  'ns_grid/customCellRenderer/dateTimeRenderer',

  'i18n'

], function($, _, Backbone, Marionette, AgGrid, Swal,
  CustomTextFilter, CustomNumberFilter, CustomDateFilter, CustomSelectFilter, 
  CustomTextAutocompleteFilter, utils_1, Renderers, Editors,
  Decimal5Renderer, DateTimeRenderer
) {
  
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
      this.model.set('objectType', options.objectType || 1);
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
        editType: 'fullRow',
        rowHeight: 34,
        suppressNoRowsOverlay: true,
        headerHeight: 30,
        suppressRowClickSelection: true,
        onRowSelected: this.onRowSelected.bind(this),
        onGridReady: function(){
          $.when(_this.deferred).then(function(){
            setTimeout(function(){
              _this.gridOptions.api.firstRenderPassed = true;
              _this.focusFirstCell();
              _this.gridOptions.api.sizeColumnsToFit(); //keep it for the moment
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
        },
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

    focusFirstCell: function(){
      if ( this.gridOptions.columnDefs[0].checkboxSelection ) {
        this.gridOptions.api.setFocusedCell(0, this.gridOptions.columnDefs[1].field, null);
      } else {
        this.gridOptions.api.setFocusedCell(0, this.gridOptions.columnDefs[0].field, null);
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
      columnDefs.map(function(col, i) {

        if(col.field == 'FK_ProtocoleType'){
          col.hide = true;
          return;
        }

        col.minWidth = col.minWidth || 150;
        col.maxWidth = col.maxWidth || 300;
        col.filterParams = col.filterParams || {apply: true};


        switch(col.type){
          case 'AutocompTreeEditor':
            col.cellEditor = Editors.ThesaurusEditor;
            col.cellRenderer = Renderers.ThesaurusRenderer;
            break;          
          case 'AutocompleteEditor':
            col.cellEditor = Editors.AutocompleteEditor;
            col.cellRenderer = Renderers.AutocompleteRenderer;
            break;
          case 'ObjectPicker':
            col.cellEditor = Editors.ObjectPicker;
            col.cellRenderer = Renderers.ObjectPickerRenderer;
            break;          
          case 'Checkbox':
            col.cellEditor = Editors.CheckboxEditor;
            col.cellRenderer = Renderers.CheckboxRenderer;
            break;
          case 'Number':
            col.cellEditor = Editors.NumberEditor;
            col.cellRenderer = Renderers.NumberRenderer;
            break;          
          case 'DateTimePickerEditor':
            col.cellEditor = Editors.DateTimeEditor;
            col.cellRenderer = Renderers.DateTimeRenderer;
            break;
          case 'Text':
            col.cellEditor = Editors.TextEditor;
            col.cellRenderer = Renderers.TextRenderer;
            break;
          case 'TextArea':
            col.cellEditor = Editors.TextEditor;
            col.cellRenderer = Renderers.TextRenderer;
            break;
          case 'Select':
            col.cellEditor = Editors.SelectEditor;
            col.cellRenderer = Renderers.SelectRenderer;
            break;
        }

        switch(col.filter){
          case 'number': {
            col.filter = CustomNumberFilter;
            break;
          }
          case 'date': {
            col.minWidth = 180;
            col.filter = CustomDateFilter;
            col.cellRenderer = DateTimeRenderer;
            break;
          }
          case 'select': {
            col.filter = CustomSelectFilter;
            break;
          }
          // case 'textAutocomplete': {
          //   col.filter = CustomTextAutocompleteFilter;
          //   return;
          // }
          case 'text': {
            col.filter = CustomTextFilter;
            break;
          }
          /*default: {
            col.filter = CustomTextFilter;
            return;
          }*/
        }
        col.headerCellTemplate = _this.getHeaderCellTemplate();
      });

      
      if(_this.gridOptions.rowSelection === 'multiple'){
        var col = {
          minWidth: 40,
          maxWidth: 40,
          field: '',
          headerName: ''
        };
        _this.formatSelectColumn(col);
        columnDefs.unshift(col);
      }

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
      col.pinned = 'left';
      col.suppressMovable = true;
      col.checkboxSelection = true;
      col.headerCellTemplate = function() {
        var eCell = document.createElement('span');
        eCell.innerHTML = '\
            <img class="js-check-all pull-left" value="unchecked" src="./app/styles/img/unchecked.png" title="check only visible rows (after filter)" style="padding-left:10px; padding-top:7px" />\
            <div id="agResizeBar" class="ag-header-cell-resize"></div>\
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

    getHeaderCellTemplate: function() {
      var eHeader = document.createElement('span');
      eHeader.innerHTML =
        '<div id="agResizeBar" class="ag-header-cell-resize"></div>'+
        '<span id="agMenu" class="ag-header-icon ag-header-cell-menu-button" style="opacity: 0; transition: opacity 0.2s, border 0.2s;"><svg style="padding-top: 5px;" width="24" height="24" viewBox="0 0 24 24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg></span>'+
        '<div id="agHeaderCellLabel" class="ag-header-cell-label">'+
        '<span id="agSortAsc" class="ag-header-icon ag-sort-ascending-icon ag-hidden"><svg width="10" height="10"><polygon points="0,10 5,0 10,10"></polygon></svg></span>'+
        '<span id="agSortDesc" class="ag-header-icon ag-sort-descending-icon ag-hidden"><svg width="10" height="10"><polygon points="0,0 5,10 10,0"></polygon></svg></span>'+
        '<span id="agNoSort" class="ag-header-icon ag-sort-none-icon ag-hidden"><svg width="10" height="10"><polygon points="0,4 5,0 10,4"></polygon><polygon points="0,6 5,10 10,6"></polygon></svg></span>'+
        '<span id="agFilter" class="ag-header-icon ag-filter-icon ag-hidden"></span>'+
        '<span id="agText" class="ag-header-cell-text"></span>'+
        '</div>';
      return eHeader;
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

    fetchColumns: function(){
      this.columnDeferred = $.ajax({
        url: this.model.get('url') + 'getFields',
        method: 'GET',
        context: this,
        data: {
          typeObj: this.model.get('objectType'),
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
      var data = {};
      if(this.model.get('objectType')){
        data.objectType = this.model.get('objectType');
      }
  
      this.deferred = $.ajax({
        url: this.model.get('url'),
        method: 'GET',
        context: this,
        data: data,
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
            typeObj: _this.model.get('objectType')
          };

          //mm
          if(this.startDate){
            status.startDate = this.startDate;
          }
          if(this.history){
            status.history = this.history;
          }

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
      $(window).off('resize', this.onResize);
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


    swal: function(opt, type, callback) {
      var btnColor;
      switch (type){
        case 'success':
          btnColor = 'green';
          opt.title = 'Success';
          break;
        case 'error':
          btnColor = 'rgb(147, 14, 14)';
          opt.title = 'Error';
          break;
        case 'warning':
          if (!opt.title) {
            opt.title = 'warning';
          }
          btnColor = 'orange';
          break;
        default:
          return;
          break;
      }

      Swal({
        title: opt.title,
        text: opt.text || '',
        type: type,
        showCancelButton: true,
        confirmButtonColor: btnColor,
        confirmButtonText: 'OK',
        closeOnConfirm: true,
      },
      function(isConfirm) {
        //could be better
        if (isConfirm && callback) {
          callback();
        }
      });
    },

    deleteSelectedRows: function(callback){
      var _this = this;
      var selectedNodes = this.gridOptions.api.getSelectedNodes();
      if(!selectedNodes.length){
        return;
      }

      var opt = {
        title: 'Are you sure?',
        text: 'selected rows will be deleted'
      };
      this.swal(opt, 'warning', function() {
        _this.destroySelectedRows(callback);
      });

    },

    getRowDataAndErrors: function(){
      this.gridOptions.api.stopEditing();

      var rowData = [];
      var errors = [];
      

      this.gridOptions.api.forEachNode( function(node) {
        var empty;
      
        var keys = Object.keys(node.data);
        
        if(keys.length === 0 || (keys.length === 1 && keys[0] === '_errors' ) ){
          empty = true;
          return;
        } else {
          for( var key in node.data ){
            if(key == '_errors' && node.data._errors) {
              if(node.data._errors.length){
                errors.push(node.data._errors);
              }
              continue;
            }

            if(node.data[key] != null || node.data[key] != 'undefined' || node.data[key] != ''){
              empty = false;
              if(node.data[key] instanceof Object){
                node.data[key] = node.data[key].value;
              }
            }
          }
        }
        if(!empty){
          rowData.push(node.data);
        }

      });

      return {
          rowData: rowData,
          errors: errors
      }
    },

    destroySelectedRows: function(callback){
      var _this = this;
      var rowData = [];
      
      var selectedNodes = this.gridOptions.api.getSelectedNodes();

      for (var i = 0; i < selectedNodes.length; i++) {
        var node = selectedNodes[i];
        if(node.data.ID) {
          rowData.push(node.data);
        } else {
          this.gridOptions.api.removeItems([node]);
        }
      }

      if(rowData.length){
        var data = JSON.stringify({
          rowData: rowData,
          delete: true
        });
        $.ajax({
          url: this.model.get('url') + '/batch',
          method: 'POST',
          contentType: 'application/json',
          data: data,
          context: this,
        }).done(function(resp) {
          this.gridOptions.api.removeItems(this.gridOptions.api.getSelectedNodes());
          if(callback)
            callback();
        }).fail(function(resp) {
          console.log(resp);
        });
        if(callback)
          callback();
      }

    },

    extendAgGrid: function(){
      var _this = this;

      if(AgGrid.extended){
        return;
      }

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
