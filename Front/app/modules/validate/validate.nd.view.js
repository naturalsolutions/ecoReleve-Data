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

    template: 'app/modules/validate/validate.nd.tpl.html',
    className: 'full-height animated rel white',

    events: {
      'click .js-btn-auto-validation': 'handleAutoValidation',
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
      this.columnDefs = this.model.get(this.type_ + 'ColumnDefs');
    },


    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      this.displayGrid();
      this.frequency = this.model.get('defaultFrequency')[this.type_];
      this.ui.frequency.val(this.frequency);
    },

    onRowClicked: function(row) {
      if( this.type_ != 'rfid' ) {
        Backbone.history.navigate('validate/' + this.type_ + '/' + (parseInt(row.node.id)+1 ), {trigger: true});
      }
      else {
        row.node.setSelected(!row.node.isSelected());
      }
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
        url: 'sensorDatas/' + this.type_ ,
        afterFirstRowFetch: afterFirstRowFetch,
        clientSide: true,
        gridOptions: {
          rowSelection: 'multiple',
          onRowClicked: this.onRowClicked.bind(this),
        },
      }));
    },

    handleAutoValidation: function() {
      var selectedNodes = this.gridView.gridOptions.api.getSelectedNodes();
      if(!selectedNodes.length){
        return;
      }
      var params = {
        'frequency': this.frequency,
        'toValidate': []
      };
      var selectedIds = selectedNodes.map(function(node){
        return node.data.PK_id;
      });

      if (this.type_ === 'rfid') {
        params.toValidate = selectedNodes.map(function(node){
          return {
            'equipID': node.data.equipID,
            'FK_Sensor': node.data.FK_Sensor
          };
        });
      }else {
        params.toValidate = selectedNodes.map(function(node){
          return {
            'FK_Individual': node.data.FK_Individual,
            'FK_ptt': node.data.FK_ptt
          };
        });
      }

      if (params.toValidate.length === this.gridView.gridOptions.rowData[1].length) {
        params.toValidate = 'all';
      }

      params.toValidate = JSON.stringify(params.toValidate);
      var url = 'sensorDatas/' + this.type_ + '/validate' ;
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
