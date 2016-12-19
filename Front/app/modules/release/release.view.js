define([
  'modules/stations/stations.view',
  'ns_grid/grid.view'
  
], function(
	StationsView,
	GridView
) {
  'use strict';

  return StationsView.extend({
    displayGridView: function(){
      var _this = this;
      var onRowClicked = function(row){
        window.app.currentData = _this.gridView.serialize();
        window.app.currentData.index = row.rowIndex;
        
        //var url = '#' + _this.gridView.model.get('type') + '/' + (row.data.id || row.data.ID) + '/release';
        var url = '#release/' + (row.data.id || row.data.ID);
        Backbone.history.navigate(url, {trigger: true});
      };
      var afterFirstRowFetch = function(){
        _this.ui.totalRecords.html(this.model.get('totalRecords'));
      };

      this.rgGrid.show(this.gridView = new GridView({
        type: this.model.get('type'),
        com: this.com,
        afterFirstRowFetch: afterFirstRowFetch,
        filters: this.defaultFilters,
        gridOptions: {
          onRowClicked: onRowClicked,
          rowModelType: 'pagination'
        }
      }));
    },
  });
});
