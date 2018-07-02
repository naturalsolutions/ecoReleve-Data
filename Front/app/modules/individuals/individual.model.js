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

      label: 'individuals',
      single: 'individual',
      type: 'individuals',
      defaultTypeObj: 1,
      icon: 'reneco-bustard',
      subincon: 'reneco-bustard',

      disabledNew: true,
      authorisationLvl: {
        create_new: 'js-admin',
      },

      formConfig: {
        modelurl: 'individuals',
        displayMode: 'display',
        reloadAfterSave: true,
        displayDelete: false,
      },

      uiTabs: [
        {
          name: 'standard',
          label: 'Standard',
          typeObj : 1
        },
        {
          name: 'Non identified',
          label: 'Unidentified',
          typeObj : 2
        }
      ],

      uiGridConfs: [
        {
          name: 'details',
          label: 'Details'
        },
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
        cellRenderer: DateTimeRenderer
      }],

      equipmentColumnDefs: [{
        field: 'StartDate',
        headerName: 'Start Date',
        cellRenderer: DateTimeRenderer
      },{
        field: 'EndDate',
        headerName: 'End Date',
        cellRenderer: DateTimeRenderer
      },{
        field: 'Type',
        headerName: 'Type',
      },{
        field: 'UnicIdentifier',
        headerName: 'Identifier',
        cellRenderer: function(params){
          if(params.data.SensorID){
            var url = '#sensors/' + params.data.SensorID;
            return  '<a target="_blank" href="'+ url +'" >' +
            params.value + ' <span class="reneco reneco-info right"></span>' +
            '</a>';
          } else {
            return '';
          }
        }
      }],

      locationsColumnDefs: [{
        field: 'Date',
        headerName: 'date',
        filter: 'date',
        pinned: 'left',
        sort: 'desc',
        minWidth: 200,
        cellRenderer: function(params){
          if(params.data.type_ === 'station'){
            //params.node.removeEventListener('rowSelected', params.node.eventService.allListeners.rowSelected[0]);
            $(params.eGridCell).find('.ag-selection-checkbox').addClass('hidden');
          }
          return DateTimeRenderer(params)
          //return params.value;
        }
      },{
        field: 'ID',
        headerName: 'ID',
        cellRenderer: function(params){
          if(params.data.type_ === 'station'){
            //ex: sta_44960
            var id = params.data.ID.split('_')[1];
            return id;
          } else {
            return params.data.ID;
          }
        }
      },{
        field: 'LAT',
        headerName: 'latitude',
        filter: 'number',
        cellRenderer: Decimal5Renderer
      },{
        field: 'LON',
        headerName: 'longitude',
        filter: 'number',
        cellRenderer: Decimal5Renderer
      },{
        field: 'precision',
        headerName: 'Precision(m)',
        filter: 'number',
      },{
        field: 'FieldworkArea',
        headerName: 'FieldWorkArea',
        filter: 'text',
      },{
        field: 'type_',
        headerName: 'Type',
        filter: 'text',
        filterParams : {selectList : [
          {value : 'argos' , label: 'argos' },
          {value : 'gps' , label: 'gps' },
          {value : 'rfid' , label: 'rfid' },
          {value : 'station' , label: 'station' },
        ]},
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
