define([
  'modules/objects/manager.view',
  'ns_filter/filters',
  'config',
  'ns_map/ns_map',

], function(
	ManagerView,
	NsFilter,
	config,
	NsMap
) {
  'use strict';

  return ManagerView.extend({
  	template: 'app/modules/stations/stations.tpl.html',
    model: new Backbone.Model({
      label: 'stations',
      single: 'station',
      type: 'stations',
    }),

		events: {
		  'click .js-btn-filter': 'filter',
		  'click .js-btn-clear': 'clearFilter',
		  'click .js-btn-new': 'new',
		  'click .js-btn-export': 'export',
		  'change .js-page-size': 'changePageSize',
      'click .js-btn-panel': 'togglePanel',
		  'click .tab-ele': 'toggleTab',

		},

    populateCurrentData: function(){
      this.defaultFilters = window.app.currentData.filters;
      if(this.defaultFilters.length){
        if(this.defaultFilters[0].Column == 'LastImported'){
          this.extraFilters = this.defaultFilters[0];
          this.model.set('lastImported', true);
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
