define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'backgrid',
  'config',
  'ns_stepper/lyt-step',
  'ns_grid/model-grid',
  'ns_modules/ns_com',
  'i18n'

], function($, _, Backbone, Marionette, Swal, Backgrid, config, 
  Step, NsGrid, Com
) {

  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/rfid/templates/tpl-step1-rfid.html',

    name: 'RFID decoder selection',
    events: {
      'change #rfidId': 'updateGrid',
    },
    ui: {
      'rfidId': '#rfidId',
      'grid': '#grid',
      'paginator': '#paginator',
      'requirement': '#requirement'
    },
    initialize: function(options) {
      this.model = new Backbone.Model();
      this.com = new Com();
      console.log(Backgrid.Extension)
    },

    check: function() {
      if (this.ui.requirement.val()) {
        return true;
      } else {
        return false;
      }
    },

    onShow: function() {
      //this.parseOneTpl(this.template);
      var obj = {name: this.name + '_RFID_identifer',required: true};
      this.stepAttributes = [obj] ;

      var content = '';
      var self = this;
      $.ajax({
        context: this,
        url: config.coreUrl + 'sensors/getUnicIdentifier',
        data: {sensorType: 3},
      }).done(function(data) {
        var len = data.length;
        var firstId = data[0]['val'];
        for (var i = 0; i < len; i++) {
          var label = data[i]['label'];
          var val = data[i]['val'];
          content += '<option value="' + val + '">' + label + '</option>';
        }
        $('select[name="RFID_identifer"]').append(content);
        this.initGrid(firstId);
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
        this.ui.grid.removeClass('hidden');
        this.ui.paginator.removeClass('hidden');
        this.grid.collection.url = config.coreUrl + 'sensors/' + id + '/history';
        this.grid.fetchCollection();
      }else{
        this.ui.grid.addClass('hidden');
        this.ui.paginator.addClass('hidden');
      }

      this.model.set('sensorId', id);
    },
    initGrid: function(id) {
      var _this = this;
      var columns = [{
        name: 'ID',
        label: 'ID',
        editable: false,
        renderable: false,
        cell: Backgrid.IntegerCell.extend({
          orderSeparator: ''
        }),
        headerCell : null
      },{
        name: 'UnicIdentifier',
        label: 'Identifier',
        editable: false,
        cell: 'string',
      },{
        name: 'StartDate',
        label: 'Start date',
        editable: false,
        cell : Backgrid.Extension.MomentCell.extend({
          modelInUnixTimestamp: true,
          displayFormat: "DD/MM/YYYY HH:mm:ss",
          displayInUTC: false
        }),
        headerCell : null
      },
      {
        name: 'EndDate',
        label: 'End Date',
        editable: false,
        cell : Backgrid.Extension.MomentCell.extend({
          modelInUnixTimestamp: true,
          displayFormat: "DD/MM/YYYY HH:mm:ss",
          displayInUTC: false
        }),
        headerCell : null
      },{
        name: 'FK_MonitoredSite',
        label: 'FK_MonitoredSite',
        editable: false,
        renderable:false,
        cell: 'string',
        headerCell : null
      },{
        name: 'Name',
        label: 'Site Name',
        editable: false,
        cell: 'string',
      },{
        name: 'Deploy',
        label: 'Deploy',
        editable: false,
        renderable:false,
        cell: 'string',
        headerCell : null
      }];
      this.grid = new NsGrid({
        columns: columns,
        url: config.coreUrl + 'sensors/' + id + '/history',
        pageSize: 20,
        pagingServerSide: false,
        rowClicked: true,
        //com: _this.com,
      }); 
      this.grid.rowClicked = function(args) {
        _this.rowClicked(args.row);
      };
      this.grid.rowDbClicked = function(args) {
        _this.rowClicked(args.row);
      };
      console.log(this.grid.columns)
      this.ui.grid.html(this.grid.displayGrid());
      this.ui.paginator.html(this.grid.displayPaginator());
    },
    rowClicked: function(row) {
      if (this.currentRow) {
        this.currentRow.$el.removeClass('active');
      }
      row.$el.addClass('active');
      this.currentRow = row;
      this.model.set('row', row);
      this.ui.requirement.val('check').change();
    },
    validate: function() {
      return this.model;
    }
  });
});
