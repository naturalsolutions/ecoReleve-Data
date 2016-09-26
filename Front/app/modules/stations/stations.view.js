define([
  'modules/objects/manager.view',
  './station.model',
  'ns_filter/filters',
  'config',
  'ns_map/ns_map',

], function(
	ManagerView,
  StationModel,
	NsFilter,
	config,
	NsMap
) {
  'use strict';

  return ManagerView.extend({
    template: 'app/modules/stations/stations.tpl.html',
    model: new StationModel(),

		events: {
		  'click .js-btn-filter': 'filter',
		  'click .js-btn-clear': 'clearFilter',
		  'click .js-btn-new': 'new',
		  'click .js-btn-export': 'export',
		  'change .js-page-size': 'changePageSize',
      'click .js-btn-panel': 'togglePanel',
		  'click .tab-ele': 'toggleTab',

		},

    populateCurrentData: function(currentData){
      this.defaultFilters = currentData.filters;
      if(this.defaultFilters.length){
        if(this.defaultFilters[0].Column == 'LastImported'){
          this.extraFilters = this.defaultFilters[0];
          this.model.set('lastImported', true);
        }
      }

      if(currentData.index !== 'undefined'){
        this.goTo = {
          index: currentData.index,
          page: currentData.status.page
        }
      }
    },

    toggleTab: function(e) {
      if(!$(e.currentTarget).hasClass('active')){
        this.$el.find('.tab-ele').each(function(){
          $(this).toggleClass('active');
        })
        if(this.$el.find('#lastImportedStations').hasClass('active')) {
          this.filters.extraFilters = [{
            Column: 'LastImported',
            Operator: '=',
            Value: true
          }];
        } else {
          this.filters.extraFilters = false;
        }
        this.filters.update();
      }      
    },

    togglePanel: function(e) {
    	if(!$(e.currentTarget).hasClass('active')){
    		this.$el.find('.js-btn-panel,.dyn-panel').each(function(){
    			$(this).toggleClass('active');
    		})
    	}
    },

    displayFilter: function() {
      this.filters = new NsFilter({
        url: config.coreUrl + this.model.get('type') +'/',
        com: this.com,
        filterContainer: this.ui.filter,
        name: this.moduleName,
        filtersValues: this.defaultFilters,
        name: 'StationGrid',
      });
    },

    displayMap: function() {
      this.map = new NsMap({
        url: config.coreUrl + this.model.get('type') + '/?geo=true',
        cluster: true,
        com: this.com,
        zoom: 3,
        element: 'map',
        popup: true,
      });
    },
  });
});
