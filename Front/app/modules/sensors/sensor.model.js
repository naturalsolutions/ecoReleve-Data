define([
  'underscore',
  'backbone',
  'config'
], function(
  _, Backbone, config
) {
  'use strict';

  return Backbone.Model.extend({
    defaults: {
      label: 'sensors',
      single: 'sensor',
      type: 'sensors',
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
        modelurl: config.coreUrl + 'sensors',
        displayMode: 'display',
        reloadAfterSave: true,
      },

      uiGridConfs: [
        {
          name: 'history',
          label: 'History'
        }
      ],

      historyColumnsDefs: [{
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
      },
      {
        field: 'EndDate',
        headerName: 'End Date',
      }
      ]
    }
  });
});