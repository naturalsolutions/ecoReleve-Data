
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'config',
  'ns_modules/ns_com',
  'ns_grid/model-grid',
  'ns_filter_bower',
  'dateTimePicker',
  'ns_grid/grid.view',
  'ns_filter/filters',

  'i18n'

], function($, _, Backbone, Marionette, Swal, Translater, config,
  Com, NsGrid, NsFilterBower, dateTimePicker, GridView, NsFilter
) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/individuals/templates/tpl-individuals.html',
    className: 'full-height animated white rel',

    events: {
      'click .js-btn-filter': 'filter',
      'click .js-btn-clear': 'clearFilter',

      'click .js-btn-new': 'newIndividual',
      'click .js-btn-export': 'export',
      'click .js-indiv-tabs a.tab-link' : 'indivSearchTabs',
      'click .js-hist-val' : 'resetDate',
      'change .js-page-size': 'changePageSize',
      'dp.change .js-date-time' : 'resetHist'
    },

    ui: {
      'filter': '.js-filters',
      'btnNew': '.js-btn-new',
      'totalRecords': '.js-total-records'
    },

    regions: {
      rgGrid: '.js-rg-grid'
    },

    type: 'individuals',

    initialize: function(options) {
      this.com = new Com();
      this.translater = Translater.getTranslater();

      if( window.app.currentData ){
        this.defaultFilters = window.app.currentData.filters;
        console.log(this.defaultFilters);
      }
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      this.$el.find('.js-date-time').datetimepicker({format : "DD/MM/YYYY HH:mm:ss"});
      this.displayFilter();
      this.displayGridView();
    },

    changePageSize: function(e){
      this.gridView.changePageSize($(e.target).val());
    },

    displayGridView: function(){
      var _this = this;
      var onRowClicked = function(row){
        /*Carefull, context is the gridView*/
        window.app.currentData = this.serialize();
        window.app.currentData.index = row.rowIndex;

        Backbone.history.navigate('#' + this.model.get('type') + '/' + (row.data.id || row.data.ID), {trigger: true});
      };
      var afterFirstGetRows = function(){
        _this.ui.totalRecords.html(this.model.get('totalRecords'));

      };

      this.rgGrid.show(this.gridView = new GridView({
        type: this.type,
        com: this.com,
        onRowClicked: onRowClicked,
        afterFirstGetRows: afterFirstGetRows,
        filters: this.defaultFilters
      }));
    },

    displayFilter: function() {
      var _this=this;
      this.$el.find('.js-filters').html('');

      this.filters = new NsFilter({
        url: config.coreUrl + this.type +'/',
        com: this.com,
        filterContainer: this.ui.filter,
        name: this.moduleName,
        filtersValues: this.defaultFilters
      });
    },

    filter: function() {
      this.filters.update();
    },

    clearFilter: function() {
      this.filters.reset();
    },

    newIndividual: function() {
      Backbone.history.navigate(this.type + '/new/', {trigger: true});
    },

    indivSearchTabs: function(e) {
      var type = $(e.target).attr('name');
      var elTab = this.$el.find('ul.js-indiv-tabs');
      elTab.find('.tab-ele').removeClass('activeTab');
      $(e.target).parent().addClass('activeTab');

      if (type == 'standard') {
        this.moduleName = 'IndivFilter';
        $('.border-bottom-filter').addClass('hide');
        this.ui.filter.removeClass('crop2');
      } else {
        this.moduleName = 'AdvancedIndivFilter';
        $('.border-bottom-filter').removeClass('hide');
        this.ui.filter.addClass('crop2');
      }

      this.com = new Com();
      this.displayGridView();
      this.displayFilter();
    },

    resetDate: function(e){
      if ($('.js-hist-val:checked').val()){
        $('.js-date-val').val(null);
      }
    },
    resetHist: function(e){
      if ($('.js-hist-val:checked').val()){
        $('.js-hist-val').prop('checked', false);
      }
    },
    
    export: function(){
      this.gridView.exportData();
    }
    
    
  });
});
