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
      label: 'clients',
      single: 'client',
      type: 'clients',

      icon: 'reneco-site',

      fk: 'FK_Client',

      formConfig: {
        modelurl: 'clients',
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
          name: 'projects',
          label: 'Projets'
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
            var url = '#projects/' + params.data.ID;
            return  '<a target="_blank" href="'+ url +'" >' +
            params.value + ' <span class="reneco reneco-info right"></span>' +
            '</a>';
        }
      },{
        field: 'Project_reference',
        headerName: 'reference',
      }]

      //MonitoredSiteGridHistory
    }
  });
});
