//radio
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',

  'ns_modules/ns_com',
  'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',
  'ns_grid/grid.view',
  'ns_filter/filters',


], function($, _, Backbone, Marionette, Swal, Translater,
  Com, ObjectPicker, GridView, NsFilter
){

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/release/release.individual.tpl.html',
    className: 'full-height animated white rel',
    ui: {
      'totalEntries': '#totalEntries',
      'nbSelected': '#nbSelected',
      'release':'#release',
      'nbTotal': '.js-nb-total',
      'filter': '#filtersRelease',
      'iconrelease' : '#iconbtnrelase'
    },

    events: {
      'click button#btnFilterRel': 'filter',
      'click #back': 'hideDetails',
      'click button#clearRel': 'clearFilter',
      'click #release': 'toolTipShow',
      'click #addSensor': 'addSensor',
      'click #test': 'test'
    },

    regions: {
      rgGrid: '.js-rg-grid'
    },

    initialize: function(options) {
      this.translater = Translater.getTranslater();
      this.com = new Com();

      this.model = new Backbone.Model();
      this.model.set('ID', options.id);
      this.model.url = 'stations/' + options.id;

      this.releaseMethod = null;
      this.getReleaseMethod();
      this.errors = 0;
      this.sensorPicker = null;
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      var _this=this;
      this.model.fetch({success: function(model){
        _this.$el.find('.js-station-name').html(model.get('Name'));
        _this.$el.find('.js-station-date').html(model.get('StationDate'));
      }});
      this.displayFilter();
      this.displayGrid();
    },

    getReleaseMethod: function(){
      var _this = this;
      $.ajax({
        url: 'release/individuals/getReleaseMethod'
      }).done(function(data){
        _this.releaseMethodList=data;
      });
    },

    displayFilter: function() {
      this.filters = new NsFilter({
        url: 'release/individuals/',
        com: this.com,
        filterContainer: this.ui.filter,
        objectType: 'individus',
        filtersValues: this.defaultFilters,
      });
    },

    filter: function() {
      var criterias = this.filters.update();
      var _this=this;
      var aggridCriteria = {};

      criterias.map(function(model){
        aggridCriteria[model.Column] = {type:1 ,filter:model.Value};
      });
      this.gridView.gridOptions.api.setFilterModel(aggridCriteria);
      this.gridView.gridOptions.api.onFilterChanged();
    },

    clearFilter: function() {
      this.gridView.gridOptions.api.setFilterModel(null);
      this.gridView.gridOptions.api.onFilterChanged();
      this.filters.reset();
    },

    displayGrid: function() {
      var _this = this;
      this.rgGrid.show(this.gridView = new GridView({
        clientSide: true,
        url: 'release/individuals/',
        gridOptions: {
          enableFilter: true,
          editType: 'fullRow',
          singleClickEdit : true,
          rowSelection: 'multiple',
          onCellValueChanged : _this.checkAll.bind(_this),
          overlayLoadingTemplate: '<span class="loading" ></span><span class="ag-overlay-loading-center">Loading .....</span>',

        },
        afterFetchColumns: function(options) {
          var colDefs = options.gridOptions.columnDefs;
          colDefs.map(function(colDef){
            if (colDef.field == 'UnicIdentifier'){
              colDef.cellRenderer = _this.sensorCellRenderer.bind(_this);
              colDef.cellClassRules = {
                'error': function(params){
                  return params.node.error === true;},
                'ag-error-highlight': function(params){
                  return params.node.errorDuplicated === true;
                },
                'no-error':function(params){
                  return params.node.error === false;
                },
                'no-duplicated':function(params){
                   return params.node.errorDuplicated === false;
                }
                };
              }
          });
        }
      }));
    },

    checkAll: function(options){
      var _this = this;
      var error = false;
      var duplicatedSensors = _this.checkDuplicateSensor(options);
      if (!duplicatedSensors && options.data.UnicIdentifier){
        var availableDeffered = _this.checkSensorAvailability(options);
        availableDeffered.always(function(){
          options.api.refreshView();
        });
      } else {
        options.node.error = false;
      }
      options.api.refreshView();
    },

    sensorCellRenderer : function(params){
      var _this = this;
      if (params.value){
        var displayVal = params.value.label;
      }
      if (params.value && params.value != 'undefined') {
        return displayVal;
      } else {
        return '';
      }
    },

    checkSensorAvailability: function(options){
      var resp;
      options.data.sta_date = this.model.get('StationDate');
      options.data.FK_Sensor = options.data.UnicIdentifier.value;
       return $.ajax({
        type : 'POST',
        url : 'release/individuals/',
        data : options.data,
      }).success(function(){
        options.node.error = false;
      }).fail(function(){
        options.node.error = true;
      });
    },

    checkDuplicateSensor: function(options){
      var nodeList = options.api.rowModel.rowsToDisplay;
      var nodeListGrouped = _.groupBy(nodeList,function(node){
          if (node.data.UnicIdentifier) {
            return node.data.UnicIdentifier.label;
          } else {
            return node.data.UnicIdentifier;
          }
      });

      _.each(nodeListGrouped,function(listNode,key){
        if (key!='undefined' && key!='' && listNode.length > 1 ){
          _.map(listNode,function(node){
            node.errorDuplicated = true;
          });
        } else {
          _.map(listNode,function(node){
            node.errorDuplicated = false;
          });
        }
      });
    },

    release: function(releaseMethod){
      var _this = this;
      var visibleSelectedRows = [];
      var model = this.gridView.gridOptions.api.getModel();
      for (var i = 0; i < model.getRowCount(); i++) {
        var visibleRowNode = model.getRow(i);
        if(visibleRowNode.selected){
          if(visibleRowNode.error || visibleRowNode.errorDuplicated){
            return this.swal({text:'unavailable sensor or duplicated sensor is equiped',title:'sensor error'}, 'error',null);
          }
          visibleSelectedRows.push(visibleRowNode.data);
        }
      }

      $.ajax({
        url: 'release/individuals/',
        method: 'POST',
        data: {
          IndividualList: JSON.stringify(visibleSelectedRows),
          StationID: this.model.get('ID'),
          releaseMethod: releaseMethod
        },
        context: this
      }).always(function() {
        console.log("call finish ");
        //this.ui.release.removeClass('Loading');
        this.ui.release.prop('disabled', false);
        this.ui.iconrelease.removeClass();
        this.ui.iconrelease.addClass("icon reneco reneco-to_release");
        this.gridView.gridOptions.api.hideOverlay()
      }).done(function(resp) {
        console.log("bim bam boom ok ");
        if (resp.errors) {
          resp.title = 'An error occured';
          resp.type = 'error';
          var callback = function() {};
        }else {
          resp.title = 'Success';
          resp.type = 'success';
          var callback = function() {
            Backbone.history.navigate('stations/' + _this.model.get('ID'), {trigger: true});
          };
        }
        resp.text = 'release: ' + resp.release;
        this.swal(resp, resp.type, callback);

      }).fail(function(resp) {
        console.log("bim bam boom pas ok du tout");
        var callback = function() {
           return true;
        };
        this.swal(resp, 'error', callback);
      });
    },


    swal: function(opt, type, callback) {
      var btnColor;
      var confirmText;
      var showCancel;
      switch (type){
        case 'success':
          btnColor = 'green';
          confirmText = 'See Station';
          showCancel = true;
          break;
        case 'error':
          btnColor = 'rgb(147, 14, 14)';
          confirmText = 'Ok';
          showCancel = false;
          break;
        case 'warning':
          btnColor = 'orange';
          break;
        default:
          return;
          break;
      }

      Swal({
        title: opt.title || opt.responseText || 'error',
        text: opt.text || '',
        type: type,
        showCancelButton: showCancel,
        confirmButtonColor: btnColor,
        confirmButtonText: confirmText,
        cancelButtonColor: 'grey',
        cancelButtonText: 'New Release',
        closeOnConfirm: true,
      },
      function(isConfirm) {
        if (isConfirm && callback) {
          callback();
        }else {
          //Backbone.history.loadUrl(Backbone.history.fragment);
        }
      });
    },

    toolTipShow: function(e) {
      var _this = this;
      this.ui.release.tooltipList({
        position: 'top',
        //  pass avalaible options
        availableOptions: _this.releaseMethodList,
        liClickEvent:function(liClickValue) {
          _this.ui.release.tooltipster('hide');
          _this.ui.release.prop('disabled', true);
          _this.ui.iconrelease.removeClass();
          _this.ui.iconrelease.addClass('loading');
          _this.gridView.gridOptions.api.showLoadingOverlay();
          _this.release(liClickValue);

        }
      });
      this.ui.release.tooltipster('show');
    }
  });
});
