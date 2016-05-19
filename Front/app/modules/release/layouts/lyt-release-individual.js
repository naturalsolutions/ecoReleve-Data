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
  'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',

], function($, _, Backbone, Marionette, Swal, Translater, config,
  Com, NsGrid, NsFilter, ObjectPicker
) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/release/templates/tpl-release-individual.html',
    className: 'full-height animated white rel',
    ui: {
      'grid': '#grid',
      'paginator': '#paginator',
      'filters': '#indiv_filters',
      'detail': '#detail',
      'totalEntries': '#totalEntries',
      'nbSelected': '#nbSelected',
      'release':'#release',
      'nbTotal': '.js-nb-total'
    },

    events: {
      'click #btnFilterRel': 'filter',
      'click #back': 'hideDetails',
      'click button#clear': 'clearFilter',
      'click #release': 'toolTipShow',
      'click #addSensor': 'addSensor',
      'click #test': 'test'
    },


    regions: {
      modal: '#modal',
    },

    initialize: function(options) {
      this.translater = Translater.getTranslater();
      this.com = new Com();

      this.station = options.station;
      this.model = options.station;

      this.releaseMethod = null;
      this.getReleaseMethod();
      var _this = this;

      
      //todo: fix
      var MySensorPicker = ObjectPicker.extend({
        rowClicked: function(row) {
          var id = row.model.get('ID');
          var unicName = row.model.get('UnicIdentifier');
          _this.currentRow.model.set({unicSensorName: unicName});
          this.setValue(id,unicName);
        },
        getValue: function() {
        },
        setValue: function(value,unicName) {
          _this.currentRow.model.set({unicSensorName: unicName});
          _this.currentRow.model.set({FK_Sensor: value});
          this.hidePicker();
        },
      });
      this.sensorPicker = new MySensorPicker({
        key : 'FK_Sensor',
        schema: {
          title : 'sensors',
        }
      });
      this.sensorPicker.render();

      this.initGrid();
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {

      this.displayFilter();
      this.displayGrid();
      //Backbone.history.navigate('release/individuals',{trigger: false});
    },

    getReleaseMethod: function(){
      var _this = this;
      $.ajax({
        url:config.coreUrl+'release/individuals/getReleaseMethod'
      }).done(function(data){
        _this.releaseMethodList=data;
      });
    },

    initGrid: function() {
      var myGrid = NsGrid.extend({
      });

      var _this = this;
      this.grid = new myGrid({
        pageSize: 1400,
        pagingServerSide: false,
        com: this.com,
        url: config.coreUrl + 'release/individuals/',
        urlParams: this.urlParams,
        rowClicked: true,
        onceFetched: function(params) {
          _this.totalEntries(this.grid);
          console.log(this.grid);
          console.log('passed');
        }
      });
      this.grid.rowClicked = function(args) {
        _this.rowClicked(args.row);
      };
      this.grid.rowDbClicked = function(args) {
        _this.rowDbClicked(args.row);
      };

      this.grid.collection.on('backgrid:selected', function(model, selected) {
        _this.updateSelectedRow();
      });
    },

    displayGrid: function() {

      this.ui.grid.html(this.grid.displayGrid());
      /*      this.ui.paginator.html(this.grid.displayPaginator());*/
    },

    displayFilter: function() {
      var _this = this;
      this.filters = new NsFilter({
        url: config.coreUrl + 'release/individuals/',
        com: this.com,
        filterContainer: this.ui.filters,
      });

      this.filters.update = function(){
        _this.$el.find(_this.ui.nbSelected).html(0);
        NsFilter.prototype.update.call(this);
      };
    },

    rowClicked: function(row) {
      if (this.currentRow) {
        this.currentRow.$el.removeClass('active');
      }
      row.$el.addClass('active');
      this.currentRow = row;
    },

    rowDbClicked: function(row) {
      this.currentRow = row;
      var curModel = row.model;
      curModel.trigger('backgrid:select', curModel, true);

    },
    updateSelectedRow: function() {
      var mds = this.grid.grid.getSelectedModels();
      for (var i = 0; i < mds.length; i++) {
        if (mds[i] == undefined) {         
          mds.splice(i, 1);
          i--;
        }
      }
      var nbSelected = mds.length;
      this.$el.find(this.ui.nbSelected).html(nbSelected);
    },

    test: function() {
      console.log(this.grid.grid.collection);
      this.grid.grid.collection = new Backbone.Collection(this.grid.grid.collection.where({Sex: 'femelle'}));
    },

    filter: function() {
      this.filters.update();
    },

    clearFilter: function() {
      this.filters.reset();
    },

    totalEntries: function(grid) {
      this.total = grid.collection.state.totalRecords;
      $(this.ui.nbTotal).html(this.total);
    },


    release: function(releaseMethod) {
      var mds = this.grid.grid.getSelectedModels();
      if (!mds.length) {
        return;
      } else {
        for (var i = 0; i < mds.length; i++) {
          if (mds[i] == undefined) {         
            mds.splice(i, 1);
            i--;
          }
        }
      }
      var _this = this;
      var col = new Backbone.Collection(mds);
      $.ajax({
        url: config.coreUrl + 'release/individuals/',
        method: 'POST',
        data: {IndividualList: JSON.stringify(col),StationID: this.station.get('ID'),releaseMethod: releaseMethod},
        context: this,
      }).done(function(resp) {
        if (resp.errors) {
          resp.title = 'An error occured';
          resp.type = 'error';
          var callback = function() {};
        }else {
          resp.title = 'Success';
          resp.type = 'success';
          var callback = function() {
            Backbone.history.navigate('stations/' + _this.station.get('ID'), {trigger: true});
            //$('#back').click();
          };

        }
        resp.text = 'release: ' + resp.release;

        //remove the model from the coll once this one is validated
        this.swal(resp, resp.type, callback);

      }).fail(function(resp) {
        var callback = function() {
           return true;
            //$('#back').click();
          };
        this.swal(resp, 'error',callback);
      });
    },

    addSensor: function() {
      this.modal.show(this.sensorPicker);
      this.sensorPicker.showPicker();
    },

    hidePicker: function() {
      this.sensorPicker.hidePicker();
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
  //could be better
        if (isConfirm && callback) {
          callback();
        }else {
          Backbone.history.loadUrl(Backbone.history.fragment);
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
          _this.release(liClickValue);
        }, 
      });
      this.ui.release.tooltipster('show');
    }
  });
});
