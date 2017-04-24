define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',

  'ns_stepper/lyt-step',
  'ns_modules/ns_com',
  'ns_grid/grid.view',
  'i18n'

], function($, _, Backbone, Marionette, Swal,
  Step, Com, GridView
) {

  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/rfid/templates/tpl-step1-rfid.html',

    name: 'RFID decoder selection',
    events: {
      'change .js-select-rfid-id': 'handleRfidSelection',
    },

    ui: {
      'rfidSelectId': '.js-select-rfid-id',
      'requirement': '#requirement',
    },

    regions: {
      rgGrid: '.js-rg-grid'
    },

    initialize: function(options) {
      this.model = new Backbone.Model();
    },

    check: function() {
      if (this.ui.requirement.val()) {
        return true;
      } else {
        return false;
      }
    },

    onShow: function() {
      var obj = {name: this.name + '_RFID_identifer',required: true};
      this.stepAttributes = [obj];

      $.ajax({
        url: 'sensors/getUnicIdentifier',
        data: {sensorType: 3},
        context: this,
      }).done(function(data) {

        var firstId = data[0]['val'];
        var content = '';

        data.map(function(rfid){
          content += '<option value="' + rfid.val + '">' + rfid.label + '</option>';
        });

        this.ui.rfidSelectId.append(content);
        this.displayGrid(firstId);
      });
    },

    handleRfidSelection: function(e){
      var id = $(e.currentTarget).val();
      this.displayGrid(id);
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



    validate: function() {
      return this.model;
    },

  });
});
