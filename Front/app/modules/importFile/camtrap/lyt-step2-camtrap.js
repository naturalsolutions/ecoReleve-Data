define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'config',
  'ns_stepper/lyt-step',
  'ns_modules/ns_com',
  'ns_grid/grid.view',
  'resumable',
  'i18n'

], function($, _, Backbone, Marionette, Swal,  config,
  Step, Com, GridView, Resumable 
) {

  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/camTrap/templates/tpl-step2-camtrap.html',

    name: 'Camera Trap Device selection',
    events: {
      'change .js-select-camtrap-id': 'updateGrid',
    },
    ui: {
      'camtrapId': '#camtrapId',
      'grid': '#grid',
      'paginator': '#paginator',
      'requirement': '#requirement'
    },
    regions: {
      rgGrid: '.js-rg-grid'
    },
    initialize: function(options) {
      this.parent = options.parent;
      this.model = options.model || new Backbone.Model();
      this.com = new Com();
    
    },

    check: function() {
      // if (this.ui.requirement.val()) {
      //   return true;
      // } else {
      //   return false;
      // }
      return true;
    },

    onShow: function() {
      //this.parseOneTpl(this.template);
      var obj = {name: this.name + '_CAMTRAP_identifer',required: true};
      this.stepAttributes = [obj] ;

      var content = '';
      var self = this;
      $.ajax({
        context: this,
        url: config.coreUrl + 'sensors/getUnicIdentifier',
        data: {sensorType: 5},
      }).done(function(data) {
        var len = data.length;
        var firstId = data[0]['val'];
        for (var i = 0; i < len; i++) {
          var label = data[i]['label'];
          var val = data[i]['val'];
          content += '<option value="' + val + '">' + label + '</option>';
        }
        $('select[name="CAMTRAP_identifer"]').append(content);
        this.displayGrid(firstId);
      })
      .fail(function() {
      });
    },

    onDestroy: function() {
    },

    updateGrid: function(e) {
      this.ui.requirement.val('').change();
      var id = $(e.target).val();
      if(id){
        this.displayGrid(id);
        this.model.set('sensorId', id);
      }
    },

    sendData : function(params) {
      var _this = this;
      $.ajax({
        type: "POST",
        url: config.coreUrl + 'sensorDatas/camtrap/concat',
        data: {
          path : params.path,
          action : 0 // create folder
        }
      })
      .done( function(response,status,jqXHR){
        if( jqXHR.status === 200 ){
          this.r = _this.model.get('resumable'); // TODO mettre dans init
          this.r.updateQuery({
            path : params.path,
            id : params.sensorId,
            startDate: params.startDate,
            endDate: params.endDate
          });
          this.r.upload();
        }
      })
      .fail( function( jqXHR, textStatus, errorThrown ){
        // console.log("error");
        // console.log(errorThrown);
      });

    },
    validate: function() {
      var _this = this;
      var rowFromGrid = this.model.get('row'); 
      if(rowFromGrid) {
        var unicIdentifier = rowFromGrid.UnicIdentifier;
        var name = rowFromGrid.Name;
        var startDate = rowFromGrid.StartDate;
        var endDate = rowFromGrid.EndDate || "0000-00-00 00:00:00";
        var path = String(unicIdentifier)+"_"+String(startDate.split(" ")[0])+"_"+String(endDate.split(" ")[0])+"_"+String(name);
        var sensorId = this.model.get('sensorId');
        var listOfResumableFile = this.model.get('resumableFile');
  
        var params = {
          unicIdentifier : unicIdentifier,
          name : name,
          startDate : startDate,
          endDate : endDate,
          path : path,
          sensorId : sensorId
        };
  
        this.r = _this.model.get('resumable'); // TODO mettre dans init
        this.r.updateQuery({
          path : params.path,
          id : params.sensorId,
          startDate: params.startDate,
          endDate: params.endDate
        });
        return this.model;
      }
      else {
        Swal({
          title: 'Warning',
          html: 'You need to select one session before going to the next step.<BR>', 
          type: 'warning',
          showCancelButton: false,
          confirmButtonText: 'OK',
         // closeOnCancel: true
        })
      }

      //this.sendData(params);
    },
    displayGrid: function(id) {
      var _this = this;
      _this.ui.requirement.val('').change();
      this.model.set('sensorId', id);

      var columnsDefs = [{
        field: 'ID',
        headerName: 'ID',
        hide: true
      },{
        field: 'UnicIdentifier',
        headerName: 'Identifier',
      },{
        field: 'StartDate',
        headerName: 'Start date',
        filter: 'date'
      },
      {
        field: 'EndDate',
        headerName: 'End Date',
        filter: 'date'
      },{
        field: 'MonitoredSiteID',
        headerName: 'Monitored Site',
      },{
        field: 'Name',
        headerName: 'Site Name',
      }];

      this.rgGrid.show(this.gridView = new GridView({
        url: 'sensors/' + id + '/equipment',
        columns: columnsDefs,
        clientSide: true,
        gridOptions: {
          skipFocus: true,
          enableFilter: true,
          rowSelection: 'single',
          suppressRowClickSelection: false,
          onRowSelected: function(row){
            _this.model.set('row', row.node.data);
            _this.ui.requirement.val('check').change();
          }
        }
      }));
    },
  });
});
