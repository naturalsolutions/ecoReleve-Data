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
      defaultFrequency: {
        rfid: 60,
        gsm: 60,
        argos: 'all'
      },

      rfidColumnDefs: [
        {
          field: 'UnicIdentifier',
          headerName: 'Unique Identifier',
        },{
          field: 'FK_Sensor',
          headerName: 'FK_Sensor',
          hide: true,
        },{
          field: 'sessionID',
          headerName: 'Session ID',
          hide: true,
        }, {
          field: 'site_name',
          headerName: 'site name',
        }, {
          field: 'site_type',
          headerName: 'site type',
        }, {
          field: 'StartDate',
          headerName: 'Start Date',
        }, {
          field: 'EndDate',
          headerName: 'End Date',
        }, {
          field: 'nb_chip_code',
          headerName: 'nb indiv',
        },{
          field: 'total_scan',
          headerName: 'total scan',
        },{
          field: 'first_scan',
          headerName: 'first scan',
        },{
          field: 'last_scan',
          headerName: 'last scan',
        }
      ],

      gsmColumnDefs: [
        {
          field: 'FK_ptt',
          headerName: 'Unique Identifier',
        },
        {
          field: 'FK_Individual',
          headerName: 'Individual ID',
          cellRenderer: function(params){
            if(!params.data.FK_Individual){
              return '<span class="bull-warn">&#x25cf;</span> No Individual attached !';
            }
            return params.value;
          }
        },{
          field: 'Survey_type',
          headerName: 'Survey Type',
        },{
          field: 'sessionID',
          headerName: 'Session ID',
          hide: true,
        },
        {
          field: 'FK_Sensor',
          headerName: 'FK_Sensor',
          hide: true,
        },
        {
          field: 'nb',
          headerName: 'NB',
        }, {
          field: 'StartDate',
          headerName: 'Start equipment',
        }, {
          field: 'EndDate',
          headerName: 'End equipment',
        }, {
          field: 'min_date',
          headerName: 'Data from',
        }, {
          field: 'max_date',
          headerName: 'Data To',
        }
      ],

      argosColumnDefs: [
        {
          field: 'FK_ptt',
          headerName: 'Sensor Identifier',
        },
        {
          field: 'FK_Individual',
          headerName: 'Individual ID',
          cellRenderer: function(params){
            if(!params.data.FK_Individual){
              return '<span class="bull-warn">&#x25cf;</span> No Individual attached !';
            }
            return params.value;
          }
        },{
          field: 'sessionID',
          headerName: 'Session ID',
          hide: true,
        },{
          field: 'Survey_type',
          headerName: 'Survey Type',
        },{
          field: 'FK_Sensor',
          headerName: 'Sensor',
          hide: true,
        }, {
          field: 'nb',
          headerName: 'NB',
        }, {
          field: 'StartDate',
          headerName: 'Start equipment',
        }, {
          field: 'EndDate',
          headerName: 'End equipment',
        }, {
          field: 'min_date',
          headerName: 'Data from',
        }, {
          field: 'max_date',
          headerName: 'Data To',
        }, {
          field: 'import',
          headerName: 'IMPORT',
        }
      ],
      camtrapColumnDefs: [
        {
          field: 'UnicIdentifier',
          headerName: 'Unique Identifier',
        }, {
          field: 'site_name',
          headerName: 'site name',
        }, {
          field: 'site_type',
          headerName: 'site type',
        }, {
          field: 'StartDate',
          headerName: 'Start Date',
        }, {
          field: 'EndDate',
          headerName: 'End Date',
        },{
          field: 'FK_Sensor',
          headerName: 'FK_Sensor',
          hide: true,
        },{
          field: 'sessionID',
          headerName: 'Session ID',
          hide: true,
        },{
          field: 'FK_MonitoredSite',
          headerName: 'Monitored Site',
          hide: true,
        }, {
          field: 'nb_photo',
          headerName: 'nb photos',
        }, {
          field: 'processed',
          headerName: 'Processed',
          cellRenderer : function(params) {
            var divContainer = document.createElement('div');
            var divValue = document.createElement('div');
            var divContent = document.createElement('div');
            var valuePercent = ( (params.data.processed/params.data.nb_photo) *100);

            divContainer.style.width = '100%';
            divContainer.style.height = '100%';
            divContainer.style.boxSizing = 'border-box';
            divContainer.style.border = 'solid 1px black';
            divContent.style.height = '100%';
            switch(true) {
              default : {
                divContent.style.backgroundColor = 'Green';
                break;
              }
            }
            
            divContent.style.textAlign = 'center';
            divContent.style.width = valuePercent.toFixed(2)+'%';

            divValue.innerHTML =  params.data.processed+'/'+params.data.nb_photo;
            divValue.style.textAlign = 'center'
            divContainer.append(divValue);
            divContainer.append(divContent);
            return divContainer;
            
           // return 'toto'
          }
        }
      ],

    }
  });
});
