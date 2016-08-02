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

      this.sensorPicker = null;

      this.initGrid();
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      var _this=this;
      this.displayFilter();
      this.displayGrid();
      var _this = this;
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

      this.grid.collection.on('backgrid:edit', function(model, selected) {
        if (model.model){
          model.model.set('sta_date',_this.station.get('StationDate'));
        } else {
          model.set('sta_date',_this.station.get('StationDate'));
        }
      });
      this.listenTo(this.grid.collection,'error',function(model,col){
        if (model.get('unicSensorName')!= null) {
          model.trigger("backgrid:error", model,_this.grid.grid.columns.findWhere({name:'unicSensorName'}));
          model.set({error:true});
          model.set({serverError:true});
        }
      });

      this.grid.collection.on('backgrid:autocompEdited',function(model,column,e,s){
        if (column && column.get('name')=='unicSensorName' && model.get('FK_Sensor')!= null && (model.get('unicSensorName')!= '' && model.get('unicSensorName')!=null) ){
          var check =  _this.grid.collection.where({FK_Sensor: model.get('FK_Sensor')});
          if (check.length>1){
            _.each(check,function(curModel){
              curModel.set('error',true);
              curModel.set('duplicated',true);
              curModel.trigger("backgrid:error",curModel,_this.grid.grid.columns.findWhere({name:'unicSensorName'}));
            });
          } else{
            var errorList = _this.ui.grid.find('.error');
          }
        }

        if (column && column.get('name')=='unicSensorName' && (model.get('unicSensorName')== '' || model.get('unicSensorName')==null)) {
          model.set('error',false);
          _this.currentRow.$el.find('.error').removeClass('error');
          var check =  _this.grid.collection.where({duplicated: true});
          var l = _.groupBy(check,function(model){
            if (model.get('FK_Sensor')!=undefined || model.get('FK_Sensor')!=null){
              return model.get('FK_Sensor');
            }
          });
          console.log(l);
          _.each(l,function(group){
            if(group.length==1){
               _.map(_this.grid.grid.body.rows,function(i){
                if (i.model == group[0] && !i.model.get('serverError')) {
                  i.$el.find('.error').removeClass('error');
                }
              });
            }
          });

        }
      });
/*
      this.listenTo(this.grid.collection,"backgrid:duplicatedError",function(model,col){
          var check =  _this.grid.collection.where({duplicated: true});
          var l = _.groupBy(check,function(model){
          if (model.get('FK_Sensor')!=undefined || model.get('FK_Sensor')!=null){
              return model.get('FK_Sensor');
          }
          });
          _.each(l,function(group){
            if(group.length>1){
               _.map(_this.grid.grid.body.rows,function(i){
                if (i.model == group[0]) {
                  i.$el.find('.autocomplete-cell').addClass('errorDuplicated');
                }
              });
            }
          });

      });*/

    },
    displayGrid: function() {
      var _this = this;
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

    release: function(releaseMethod){
      var error = this.grid.collection.findWhere({error:true});
      if (!error){
        this.releaseThem(releaseMethod);
      } else {
        Swal({
        title: 'Sensor error',
        text: 'Wrong sensor identifier',
        type: 'error',
        confirmButtonColor: 'rgb(221, 107, 85)',
        confirmButtonText: 'OK',
        closeOnConfirm: true,
      });
      }
    },
    releaseThem: function(releaseMethod) {
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
      if (!this.sensorPicker) {
            var _this = this;
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
              _this.currentRow.model.trigger('backgrid:edited',
                 _this.currentRow.model
              );
              _this.currentRow.model.trigger('backgrid:autocompEdited',
                 _this.currentRow.model,
                _this.grid.grid.columns.findWhere({name:'unicSensorName'})
              );
              /*var check =  _this.grid.collection.where({FK_Sensor:  _this.currentRow.model.get('FK_Sensor')});
              if (check.length>1){
               console.log('duplicated')
                _this.currentRow.model.trigger("backgrid:error", _this.currentRow.model,_this.grid.grid.columns.findWhere({name:'unicSensorName'}));
              }*/
              
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

      }
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
