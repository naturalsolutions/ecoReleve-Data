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

      label: 'individuals',
      single: 'individual',
      type: 'individuals',
      
      icon: 'reneco-bustard',
      subincon: 'reneco-bustard',

      formConfig: {
        modelurl: 'individuals',
        displayMode: 'display',
        reloadAfterSave: true,
        displayDelete: false,
      },

      uiTabs: [
        {
          name: 'standard',
          label: 'Standard'
        },
        {
          name: 'unidentified',
          label: 'Unidentified'
        }
      ],

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
          name: 'locations',
          label: 'Locations'
        },
      ],

      historyColumnDefs: [{
        field: 'Name',
        headerName: 'Name',
      },{
        field: 'value',
        headerName: 'Value',
      },{
        field: 'StartDate',
        headerName: 'Start Date',
      }],

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

      locationsColumnDefs: [{
        field: 'ID',
        headerName: 'ID',
        hide: true,
      },{
        field: 'Date',
        headerName: 'date',
        checkboxSelection: true,
        filter: 'text',
        pinned: 'left',
        minWidth: 200,
        cellRenderer: function(params){
          if(params.data.type_ === 'station'){
            //params.node.removeEventListener('rowSelected', params.node.eventService.allListeners.rowSelected[0]);
            $(params.eGridCell).find('.ag-selection-checkbox').addClass('hidden');
          }
          return params.value;
        }
      },{
        field: 'LAT',
        headerName: 'latitude',
        filter: 'number',
      }, {
        field: 'LON',
        headerName: 'longitude',
        filter: 'number',
      },{
        field: 'region',
        headerName: 'Region',
        filter: 'text',
      },{
        field: 'type_',
        headerName: 'Type',
        filter: 'text',
      },{
        field: 'fieldActivity_Name',
        headerName: 'FieldActivity',
        filter: 'text',
        cellRenderer: function(params){
          if(params.data.type_ === 'station'){
            //ex: sta_44960
            var url = '#stations/' + params.data.ID.split('_')[1];
            return  '<a target="_blank" href="'+ url +'" >' + 
            params.value + ' <span class="reneco reneco-info right"></span>' +
            '</a>';
          } else {
            return ''; 
          }
        }
      }]
    }
  });
});