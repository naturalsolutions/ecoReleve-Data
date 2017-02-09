define([
  'jquery',
  'underscore',
  'backbone'
], function (
  $, _, Backbone
) {
  'use strict';

  return Backbone.Model.extend({
    defaults: {
      defaultFrequency: {
        rfid: 60,
        gsm: 60,
        argos: 'all'
      },

      rfidColumnDefs: [
        {
          field: 'UnicIdentifier',
          headerName: 'Unic Identifier',
          checkboxSelection: true
        }, {
          field: 'FK_Sensor',
          headerName: 'FK_Sensor',
          hide: true
        }, {
          field: 'equipID',
          headerName: 'equipID',
          hide: true
        }, {
          field: 'site_name',
          headerName: 'site name'
        }, {
          field: 'site_type',
          headerName: 'site type'
        }, {
          field: 'StartDate',
          headerName: 'Start Date'
        }, {
          field: 'EndDate',
          headerName: 'End Date'
        }, {
          field: 'nb_chip_code',
          headerName: 'nb indiv'
        }, {
          field: 'total_scan',
          headerName: 'total scan'
        }, {
          field: 'first_scan',
          headerName: 'first scan'
        }, {
          field: 'last_scan',
          headerName: 'last scan'
        }
      ],

      gsmColumnDefs: [
        {
          field: 'FK_ptt',
          headerName: 'Unic Identifier',
          checkboxSelection: true
        },
        {
          field: 'FK_Individual',
          headerName: 'Individual ID',
          cellRenderer: function (params) {
            if (!params.data.FK_Individual) {
              return '<span class="bull-warn">&#x25cf;</span> No Individual attached !';
            }
            return params.value;
          }
        }, {
          field: 'Survey_type',
          headerName: 'Survey Type'
        },
        {
          field: 'FK_Sensor',
          headerName: 'FK_Sensor',
          hide: true
        },
        {
          field: 'nb',
          headerName: 'NB'
        }, {
          field: 'StartDate',
          headerName: 'Start equipment'
        }, {
          field: 'EndDate',
          headerName: 'End equipment'
        }, {
          field: 'min_date',
          headerName: 'Data from'
        }, {
          field: 'max_date',
          headerName: 'Data To'
        }
      ],

      argosColumnDefs: [
        {
          field: 'FK_ptt',
          headerName: 'Sensor Identifier',
          checkboxSelection: true
        },
        {
          field: 'FK_Individual',
          headerName: 'Individual ID',
          cellRenderer: function (params) {
            if (!params.data.FK_Individual) {
              return '<span class="bull-warn">&#x25cf;</span> No Individual attached !';
            }
            return params.value;
          }
        }, {
          field: 'Survey_type',
          headerName: 'Survey Type'
        }, {
          field: 'FK_Sensor',
          headerName: 'Sensor',
          hide: true
        }, {
          field: 'nb',
          headerName: 'NB'
        }, {
          field: 'StartDate',
          headerName: 'Start equipment'
        }, {
          field: 'EndDate',
          headerName: 'End equipment'
        }, {
          field: 'min_date',
          headerName: 'Data from'
        }, {
          field: 'max_date',
          headerName: 'Data To'
        }, {
          field: 'import',
          headerName: 'IMPORT'
        }
      ]

    }
  });
});
