define([
  'modules/objects/manager.view',
  './station.model',
  'ns_filter/filters',
  'ns_map/ns_map',

], function(
	ManagerView,
  StationModel,
	NsFilter,
	NsMap
) {
  'use strict';

  return ManagerView.extend({
    model: new StationModel(),

    populateCurrentData: function(currentData){
      this.defaultFilters = currentData.filters;
      if(this.defaultFilters.length){
        if(this.defaultFilters[0].Column == 'LastImported'){
          this.extraFilters = this.defaultFilters[0];
          this.model.set('lastImported', true);
        }
      }

      // if(currentData.index !== 'undefined'){
      //   this.goTo = {
      //     index: currentData.index,
      //     page: currentData.status.page
      //   }
      // }
    },

    toggleTab: function(e) {
      if(!$(e.currentTarget).hasClass('active')){
        this.$el.find('.tab-ele').each(function(){
          $(this).toggleClass('active');
        })
        if(this.$el.find('#lastImported').hasClass('active')) {
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
    		});
    	}
    },

    onShow: function() {
      this.$el.find('.js-date-time').datetimepicker({format : "DD/MM/YYYY HH:mm:ss"});
      this.displayFilter();
      this.displayGridView();
      if(this.displayMap){
        this.displayMap();
      }
      this.$el.find('.js-nav-tabs').removeClass('hide');
    },

    displayFilter: function() {
      this.filters = new NsFilter({
        url: this.model.get('type') +'/',
        com: this.com,
        filterContainer: this.ui.filter,
        name: this.moduleName,
        filtersValues: this.defaultFilters,
        name: 'StationGrid',
      });
    },

    displayMap: function() {
      this.map = new NsMap({
        url: this.model.get('type') + '/?geo=true',
        cluster: true,
        com: this.com,
        zoom: 3,
        element: 'map',
        popup: true,
      });
    },
  });
});
