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
  

], function($, _, Backbone, Marionette, Swal, Translater,
  Com, ObjectPicker, GridView
){

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/release/templates/tpl-release-individual.html',
    className: 'full-height animated white rel',
    ui: {
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

    displayGrid: function() {
      this.rgGrid.show(this.gridView = new GridView({
        clientSide: true,
        url: 'release/individuals/',
        gridOptions: {
          enableFilter: true,
          rowSelection: 'multiple',
        }
      }));
      
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
        url: 'release/individuals/',
        method: 'POST',
        data: {IndividualList: JSON.stringify(col),StationID: this.model.get('ID'),releaseMethod: releaseMethod},
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
            Backbone.history.navigate('stations/' + _this.model.get('ID'), {trigger: true});
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
