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
  'i18n'

], function($, _, Backbone, Marionette, Swal,  config,
  Step, Com, GridView
) {

  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/camTrap/templates/tpl-step1-camtrap.html',

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
      this.model = new Backbone.Model();
      this.com = new Com();
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
    // initGrid: function(id) {
    //   var _this = this;
    //   var columns = [{
    //     name: 'ID',
    //     label: 'ID',
    //     editable: false,
    //     renderable: false,
    //     cell: Backgrid.IntegerCell.extend({
    //       orderSeparator: ''
    //     }),
    //     headerCell : null
    //   },{
    //     name: 'UnicIdentifier',
    //     label: 'Identifier',
    //     editable: false,
    //     cell: 'string',
    //   },{
    //     name: 'StartDate',
    //     label: 'Start date',
    //     editable: false,
    //     cell : 'stringDate',
    //     headerCell : null
    //   },
    //   {
    //     name: 'EndDate',
    //     label: 'End Date',
    //     editable: false,
    //     cell : 'stringDate',
    //     headerCell : null
    //   },{
    //     name: 'FK_MonitoredSite',
    //     label: 'FK_MonitoredSite',
    //     editable: false,
    //     renderable:false,
    //     cell: 'string',
    //     headerCell : null
    //   },{
    //     name: 'Name',
    //     label: 'Site Name',
    //     editable: false,
    //     cell: 'string',
    //   },{
    //     name: 'Deploy',
    //     label: 'Deploy',
    //     editable: false,
    //     renderable:false,
    //     cell: 'string',
    //     headerCell : null
    //   }];
    //   this.grid = new NsGrid({
    //     columns: columns,
    //     url: config.coreUrl + 'sensors/' + id + '/history',
    //     pageSize: 20,
    //     pagingServerSide: false,
    //     rowClicked: true,
    //     //com: _this.com,
    //   });
    //   this.grid.rowClicked = function(args) {
    //     _this.rowClicked(args.row);
    //   };
    //   this.grid.rowDbClicked = function(args) {
    //     _this.rowClicked(args.row);
    //   };
    //   console.log(this.grid.columns)
    //   this.ui.grid.html(this.grid.displayGrid());
    //   this.ui.paginator.html(this.grid.displayPaginator());
    // },
    // rowClicked: function(row) {
    //   if (this.currentRow) {
    //     this.currentRow.$el.removeClass('active');
    //   }
    //   row.$el.addClass('active');
    //   this.currentRow = row;
    //   this.model.set('row', row);
    //   this.ui.requirement.val('check').change();
    // },
    validate: function() {
      return this.model;
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
