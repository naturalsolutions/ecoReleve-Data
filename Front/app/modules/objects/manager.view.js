define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'ns_modules/ns_com',
  'ns_grid/grid.view',
  'ns_filter/filters',
  
  'tooltipster-list',
  'i18n'

], function(
  $, _, Backbone, Marionette, Swal, Translater,
  Com, GridView, NsFilter
) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/objects/manager.tpl.html',
    className: 'full-height animated white rel',

    events: {
      'click .js-btn-filter': 'filter',
      'click .js-btn-clear': 'clearFilter',
      'click .js-btn-new': 'new',
      'click .js-btn-export': 'export',
      'click .js-link-back': 'back',
      'click .js-link-new': 'new',
      'change .js-page-size': 'changePageSize',
    },

    ui: {
      'filter': '.js-filters',
      'btnNew': '.js-btn-new',
      'totalRecords': '.js-total-records'
    },

    regions: {
      rgGrid: '.js-rg-grid'
    },

    translater: Translater.getTranslater(),

    initialize: function(options) {
      this.com = new Com();
      if( window.app.currentData ){
        this.populateCurrentData(window.app.currentData);
      }
    },

    new: function(){},
    back: function(){},


    populateCurrentData: function(currentData){
      this.defaultFilters = currentData.filters;

      if(currentData.index !== 'undefined'){
        this.goTo = {
          index: currentData.index,
          page: currentData.status.page
        }
      }
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      this.$el.find('.js-date-time').datetimepicker({format : "DD/MM/YYYY HH:mm:ss"});
      this.displayFilter();
      this.displayGridView();
      if(this.displayMap){
        this.displayMap();
      }
    },

    changePageSize: function(e){
      this.gridView.changePageSize($(e.target).val());
    },

    onRowClicked: function(row){
      window.app.currentData = this.gridView.serialize();
      window.app.currentData.index = row.rowIndex;

      var url = '#' + this.gridView.model.get('type') + '/' + (row.data.id || row.data.ID);
      Backbone.history.navigate(url, {trigger: true});
    },

    displayGridView: function(){
      var _this = this;
      var afterFirstRowFetch = function(){
        _this.ui.totalRecords.html(this.model.get('totalRecords'));
      };

      this.rgGrid.show(this.gridView = new GridView({
        type: this.model.get('type'),
        com: this.com,
        afterFirstRowFetch: afterFirstRowFetch,
        filters: this.defaultFilters,
        gridOptions: {
          onRowClicked: this.onRowClicked.bind(this),
          rowModelType: 'pagination'
        },
        goTo: (this.goTo || false)
      }));

    },

    displayFilter: function() {
      this.filters = new NsFilter({
        url: this.model.get('type') +'/',
        com: this.com,
        filterContainer: this.ui.filter,
        name: this.moduleName,
        filtersValues: this.defaultFilters,
      });
    },

    filter: function() {
      this.filters.update();
    },

    clearFilter: function() {
      this.filters.reset();
    },

    export: function(){
        var url = this.model.get('type') + '/export?criteria=' + JSON.stringify(this.gridView.filters);
        var link = document.createElement('a');
        link.classList.add('DowloadLinka');
        
        link.href = url;
        link.onclick = function () {
            var href = $(link).attr('href');
            window.location.href = link;
            document.body.removeChild(link);
        };
       document.body.appendChild(link);
       link.click();
    },

    new: function(e) {
      var _this = this;
      this.ui.btnNew.tooltipList({
        availableOptions: this.model.get('availableOptions'),
        liClickEvent: function(liClickValue) {
          var url = '#' + _this.model.get('type') + '/new/' + liClickValue;
          Backbone.history.navigate(url, {trigger: true});
        },
        position: 'top'
      });
    },
    
  });
});
