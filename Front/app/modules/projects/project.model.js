define([
  'jquery',
  'underscore',
  'backbone',
  'ns_grid/customCellRenderer/decimal5Renderer',
  'ns_grid/customCellRenderer/dateTimeRenderer',
], function(
  $, _, Backbone, Decimal5Renderer, DateTimeRenderer
){
  'use strict';

  return Backbone.Model.extend({
    defaults: {
      label: 'projets',
      single: 'projet',
      type: 'projects',

      icon: 'reneco-site',

      fk: 'FK_Project',

      formConfig: {
        modelurl: 'projects',
        displayMode: 'display',
        reloadAfterSave: true,
        afterShow: function() {
          $('#dateTimePicker').on('dp.change', function(e) {
            $('#dateTimePicker').data('DateTimePicker').maxDate(e.date);
          });
          console.log(this)
        }
      },

      uiGridConfs: [

        {
          name: 'stations',
          label: 'Stations'
        },
      ],

      stationsColumnDefs: [{
        field: 'ID',
        headerName: 'ID',
        hide: true,
      },{
        field: 'Name',
        headerName: 'Name',
        cellRenderer: function(params){
            var url = '#stations/' + params.data.ID;
            return  '<a target="_blank" href="'+ url +'" >' +
            params.value + ' <span class="reneco reneco-info right"></span>' +
            '</a>';
        }
      },{
        field: 'StationDate',
        headerName: 'date',
        cellRenderer: DateTimeRenderer
      },{
        field: 'LAT',
        headerName: 'latitude',
      }, {
        field: 'LON',
        headerName: 'longitude',
      }]

      //MonitoredSiteGridHistory
    }
  });
});
