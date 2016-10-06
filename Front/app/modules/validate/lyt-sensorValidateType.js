//radio
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',

  'ns_modules/ns_com',
  'ns_grid/grid.view',
  './validate.model'

], function($, _, Backbone, Marionette, Swal, 
  Com, GridView, ValidateModel
){

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/validate/templates/tpl-sensorValidateType.html',
    className: 'full-height animated rel white',

    events: {
      'click .js-btn-auto-validation': 'autoValidation',
      'change .js-select-frequency': 'setFrequency',
    },

    ui: {
      'totalRecords': '.js-total-records',
      'frequency': '.js-select-frequency',
    },

    regions: {
      rgGrid: '.js-rg-grid'
    },

    model: new ValidateModel(),

    initialize: function(options) {
      this.type_ = options.type;
      this.com = new Com();
      this.columnDefs = this.model.get(this.type_ + 'ColumnDefs');
    },


    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      this.displayGrid();
      this.frequency = this.ui.frequency.val();
    },

    onRowClicked: function() {
      
    },

    setFrequency: function(e) {
      this.frequency = $(e.target).val();
    },

    displayGrid: function() {
      var _this = this;
      var afterFirstRowFetch = function(){
        _this.ui.totalRecords.html(this.model.get('totalRecords'));
      };

      this.rgGrid.show(this.gridView = new GridView({
        columns: this.columnDefs,
        com: this.com,
        url: 'sensors/' + this.type_ + '/uncheckedDatas',
        afterFirstRowFetch: afterFirstRowFetch,
        clientSide: true,        
        gridOptions: {
          onRowClicked: this.onRowClicked.bind(this),
        },
      }));
    },

    /*rowClicked: function(args) {
      {
        type: this.type_,
        frequency: this.frequency,
      }
    },
*/
    autoValidation: function() {
      var params = {
        'frequency': this.frequency,
        'toValidate': []
      };
      var tmp = {};
      if (!this.grid.grid.getSelectedModels().length) {
        return;
      }

      if (this.type_ == 'rfid') {
        _.each(this.grid.grid.getSelectedModels(), function(model) {
          params.toValidate.push({
            'equipID': model.get('equipID'),
            'FK_Sensor': model.get('FK_Sensor')
          });
        });
      }else {
        _.each(this.grid.grid.getSelectedModels(), function(model) {
          params.toValidate.push({
            'FK_Individual': model.get('FK_Individual'),
            'FK_ptt': model.get('FK_ptt')
          });
        });
      }

      if (params.toValidate.length == this.grid.collection.state.totalRecords) {
        params.toValidate = 'all';
      }
      params.toValidate = JSON.stringify(params.toValidate);
      var url = 'sensors/' + this.type_ + '/uncheckedDatas';
      $.ajax({
        url: url,
        method: 'POST',
        data : params,
        context: this
      }).done(function(resp) {
        var msg = new Object();
        msg.title='Succes';
        msg.resp = resp;
        this.swal(msg, 'success');
        this.displayGrid();
      }).fail(function(resp) {
        var msg = new Object();
        msg.title='Succes';
        msg.resp = resp;
        this.swal(msg, 'error');
      });
    },

    swal: function(opt, type){
      var btnColor;
      switch(type){
        case 'success':
          btnColor = 'green';
          break;
        case 'error':
          btnColor = 'rgb(147, 14, 14)';
          break;
        case 'warning':
          btnColor = 'orange';
          break;
        default:
          return;
          break;
      }
      Swal({
        title: opt.title || 'error',
        text: JSON.stringify(opt.resp)|| '',
        type: type,
        //timer: 2000,
        showCancelButton: false,
        confirmButtonColor: btnColor,
        confirmButtonText: 'OK',
        closeOnConfirm: true,
      },
      function(isConfirm){
      });
    },

  });
});
