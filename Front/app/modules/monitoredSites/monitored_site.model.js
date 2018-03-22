define([
  'jquery',
  'underscore',
  'backbone',
  'ns_grid/customCellRenderer/decimal5Renderer',
  'ns_grid/customCellRenderer/dateTimeRenderer',
  'config'
], function(
  $, _, Backbone, Decimal5Renderer, DateTimeRenderer, config
){
  'use strict';

  return Backbone.Model.extend({
    defaults: {
      label: 'monitored sites',
      single: 'monitored site',
      type: 'monitoredSites',

      icon: 'reneco-site',

      fk: 'FK_MonitoredSite',
      authorisationLvl: {
        create_new: 'js-user',
      },
      
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
        {
          name: 'camera_trap',
          label: 'Camera Trap'
        },
      ],

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
      }],

      cameraTrapColumnDefs: [{
        field: 'sessionID',
        headerName: 'ID',
        minWidth: 70,
      },{
        field: 'UnicIdentifier',
        headerName: 'IDENTIFIER',
        minWidth: 90,
      },{
        field: 'StartDate',
        headerName: 'START DATE',
        minWidth: 155,
      },{
        field: 'EndDate',
        headerName: 'END DATE',
        minWidth: 155,
      },{
        field: 'nbPhotos',
        headerName: 'NB PHOTOS',
        minWidth: 60,
      },
      {
        field : 'link',
        headerName : '',
        minWidth: 220,
        headerCellTemplate: function () {
          var eCell = document.createElement('span');
          var eBtn = document.createElement('button');
          eBtn.className = 'js-btndetailssession btn btn-success start'
          var eIcone = document.createElement('i');
          eIcone.className = 'glyphicon glyphicon-download-alt'
          var eSpan = document.createElement('span');
          eSpan.innerText = " Download all sessions"
          eIcone.appendChild(eSpan);
          eBtn.appendChild(eIcone);

          eCell.innerHTML =
            // '<div class="ag-header-cell">'+
            '<div id="agResizeBar" class="ag-header-cell-resize"></div>' +
            '<span id="agMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
            '<div id="agHeaderCellLabel" class="ag-header-cell-label">' +
            eBtn.outerHTML +
            '<span id="agSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
            '<span id="agSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
            '<span id="agNoSort" class="ag-header-icon ag-sort-none-icon"></span>' +
            '<span id="agFilter" class="ag-header-icon ag-filter-icon"></span>' +
            '<span id="agText" class="ag-header-cell-text"></span>' +
            // '</div>'+
            '</div>'
            eCell.onclick =  function () {
              // var siteID = _this.model.get('id');
              var path = window.location.href.split('/');

              var siteID = path[ path.length - 1 ];
              var url = config.coreUrl + 'photos/export/?siteID='+siteID

              window.open(url);
          };

          return eCell;
        },
        cellRenderer: function (params) {
          var eCell = document.createElement('span');
          var eBtn = document.createElement('button');
          eBtn.className = 'js-btndetailssession btn btn-success start'
          var eIcone = document.createElement('i');
          eIcone.className = 'glyphicon glyphicon-download-alt'
          var eSpan = document.createElement('span');
          eSpan.innerText = " Download session"
          eIcone.appendChild(eSpan);
          eBtn.appendChild(eIcone);
          eCell.appendChild(eBtn);
          eCell.onclick =  function () {
            var path = window.location.href.split('/');
            var siteID = path[ path.length - 1 ];
            var sessionID = params.data['sessionID'];
            var url = config.coreUrl + 'photos/export/?siteid='+siteID+'&sessionid='+sessionID;

            window.open(url);
          };

          return eCell;
        }
      }

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
      },{
        field: 'fieldActivity_Name',
        headerName: 'FieldActivity',
      }]

      //MonitoredSiteGridHistory
    }
  });
});
