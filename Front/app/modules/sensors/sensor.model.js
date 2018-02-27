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
      label: 'sensors',
      single: 'sensor',
      type: 'sensors',

      icon: 'reneco-emitters',

      fk: 'FK_Sensor',

      authorisationLvl: {
        create_new: 'js-superUser',
      },

      availableOptions: [{
        label: 'Argos',
        val: 'argos'
      },{
        label: 'GSM',
        val: 'gsm'
      },{
        label: 'RFID',
        val: 'rfid'
      },{
        label: 'VHF',
        val: 'vhf'
      }],

      formConfig: {
        name: 'SensorForm',
        modelurl: 'sensors',
        displayMode: 'display',
        reloadAfterSave: true,
      },

      uiGridConfs: [
        {
          name: 'history',
          label: 'History'
        },
        {
          name: 'deployment',
          label: 'Deployment'
        },
      ],

      deploymentColumnsDefs: [{
        field: 'FK_Individual',
        headerName: 'Individual id',
        cellRenderer: function(params){
          if(params.data.FK_Individual){
            var url = '#individuals/' + params.data.FK_Individual;
            return  '<a target="_blank" href="'+ url +'" >' +
            params.value + ' <span class="reneco reneco-info right"></span>' +
            '</a>';
          } else {
            return '';
          }
        }
      },
      {
        field: 'Name',
        headerName: 'Monitored site',
        cellRenderer: function(params){
          if(params.data.MonitoredSiteID) {
            var url = '#monitoredSites/' + params.data.MonitoredSiteID;
            return  '<a target="_blank" href="'+ url +'" >' +
            params.value + ' <span class="reneco reneco-info right"></span>' +
            '</a>';
          } else {
            return '';
          }
        }
      },
      {
        field: 'StartDate',
        headerName: 'Start date',
        cellRenderer: DateTimeRenderer
      },
      {
        field: 'EndDate',
        headerName: 'End Date',
        cellRenderer: DateTimeRenderer
      }
    ],
    historyColumnsDefs : [{
      field: 'Name',
      headerName: 'Name',
    }, {
      field: 'value',
      headerName: 'Value',
    }, {
      field: 'StartDate',
      headerName: 'Start Date',
      cellRenderer: DateTimeRenderer
    },]


    }
  });
});
