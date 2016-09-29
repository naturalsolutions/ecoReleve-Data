define([
  'jquery',
  'underscore',
  'backbone',
], function(
  $, _, Backbone
){
  'use strict';

  return Backbone.Model.extend({
    defaults: {
      label: 'monitored sites',
      single: 'monitored site',
      type: 'monitoredSites',

      icon: 'reneco-site',

      fk: 'FK_MonitoredSite',

      formConfig: {
        modelurl: 'monitoredSites',
        displayMode: 'display',
        reloadAfterSave: true,
        afterShow: function() {
          $('#dateTimePicker').on('dp.change', function(e) {
            $('#dateTimePicker').data('DateTimePicker').maxDate(e.date);
          });
        }
      },
      
      uiGridConfs: [
        {
          name: 'history',
          label: 'History'
        },
        {
          name: 'equipment',
          label: 'Equipment'
        },
        {
          name: 'stations',
          label: 'Stations'
        },
      ],

      equipmentColumnDefs: [{
        field: 'StartDate',
        headerName: 'Start Date',
      },{
        field: 'EndDate',
        headerName: 'End Date',
      },{
        field: 'Type',
        headerName: 'Type',
      },{
        field: 'UnicIdentifier',
        headerName: 'Identifier',
      }],

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
        //cell: 'stringDate'
      },{
        field: 'LAT',
        headerName: 'latitude',
      }, {
        field: 'LON',
        headerName: 'longitude',
      },{
        field: 'fieldActivity_Name',
        headerName: 'FieldActivity',
      }]

      //MonitoredSiteGridHistory
    }
  });
});