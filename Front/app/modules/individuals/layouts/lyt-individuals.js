
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
  //'ns_filter/model-filter_module',
  'ns_filter_bower',
  './lyt-individuals-detail',
  './lyt-individuals-new',
 'dateTimePicker',

  'i18n'

], function($, _, Backbone, Marionette, Swal, Translater, config,
  Com, NsGrid, NsFilter, LytIndivDetail, LytNewIndiv,dateTimePicker
) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/individuals/templates/tpl-individuals.html',
    className: 'full-height animated white rel',

    events: {
      'click #btnFilter': 'filter',
      'click #back': 'hideDetails',
      'click button#clear': 'clearFilter',
      'click button#createNew': 'newIndividual',
      'click #btn-export': 'exportGrid',
      'click #indivSearchTabs a.tab-link' : 'indivSearchTabs',
      'click #histVal' : 'resetDate',
      'dp.change #datetimepicker2' : 'resetHist'
    },

    ui: {
      'grid': '#grid',
      'paginator': '#paginator',
      'filter': '#filter',
      'detail': '#detail',
      'btnNew': '#createNew',
      'rowSelect':'#rowSelector'
    },

    regions: {
      detail: '#detail',
    },

    rootUrl: '#individuals/',

    initialize: function(options) {
      if (options.id) {
        this.indivId = options.id;
      }
      this.com = new Com();
      this.translater = Translater.getTranslater();
      this.gridURL = config.coreUrl + 'individuals/';
    },

    onRender: function() {
      //$('#starDate2').datetimepicker({format : "DD/MM/YYYY HH:mm:ss"});
      this.$el.i18n();
    },

    onShow: function() {
      console.log(this.$el.find('#datetimepicker2'))
      this.$el.find('#datetimepicker2').datetimepicker({format : "DD/MM/YYYY HH:mm:ss"});
      this.displayFilter();
      this.displayGrid();
      if (this.indivId) {
        this.detail.show(new LytIndivDetail({indivId: this.indivId}));
        this.ui.detail.removeClass('hidden');
      }
    },

    displayGrid: function() {
      var _this = this;
      this.grid = new NsGrid({
        pageSize: 20,
        pagingServerSide: true,
        com: this.com,
        url: this.gridURL,
        urlParams: this.urlParams,
        rowClicked: true,
        totalElement: 'totalEntries',
        rowSelectorElement: 'rowSelector'
      });

      this.grid.rowClicked = function(args) {
        _this.rowClicked(args.row);
      };
      this.grid.rowDbClicked = function(args) {
        _this.rowDbClicked(args.row);
      };

      if (this.moduleName != 'IndivFilter'){
        this.grid.collection.queryParams.history = false;
      } else {
        //delete this.collection.queryParams['history'];
      }
      this.ui.grid.html(this.grid.displayGrid());
      this.ui.paginator.append(this.grid.displayPaginator());
    },

    rowClicked: function(row) {
      this.detail.show(new LytIndivDetail({
        model: row.model,
        globalGrid: this.grid
      }));
      var id = row.model.get('ID');
      Backbone.history.navigate(this.rootUrl + id, {trigger: false});
      this.grid.currentRow = row;
      this.grid.upRowStyle();
      this.ui.detail.removeClass('hidden');
    },

    rowDbClicked: function(row) {
    },

    displayFilter: function() {
      var _this=this;
      this.$el.find('#filter').html('');

      this.filters = new NsFilter({
        url: config.coreUrl + 'individuals/',
        com: this.com,
        filterContainer: this.ui.filter,
        name: this.moduleName,
      });
    },

    filter: function() {
      if (this.moduleName != 'IndivFilter'){
        this.grid.collection.queryParams.startDate =  $('#dateVal').val();
        this.grid.collection.queryParams.history =0;
        if ($('#histVal:checked').val()){
          this.grid.collection.queryParams.history =1;
        }
      }
      this.filters.update();
    },
    clearFilter: function() {
      this.filters.reset();
    },
    hideDetails: function() {
      var _this= this;
      window.checkExitForm(function(){
        Backbone.history.navigate(_this.rootUrl, {trigger: false});
        _this.ui.detail.addClass('hidden');
      });
    },
    newIndividual: function() {
      Backbone.history.navigate(this.rootUrl + 'new/', {trigger: true});
      /*
      // TODO  implementation of group creation front/end
      this.ui.btnNew.tooltipList({
        availableOptions: [{
          label: 'Individual',
          val: 'individual'
        }
        ],
        liClickEvent: function(liClickValue) {
          Backbone.history.navigate(this.rootUrl + 'new/' + liClickValue, {trigger: true});
        },
        position: 'top'
      });*/
    },

    indivSearchTabs: function(e) {
      var type = $(e.target).attr('name');
      var elTab = this.$el.find('ul#indivSearchTabs');
      elTab.find('.tab-ele').removeClass('activeTab');
      $(e.target).parent().addClass('activeTab');

      if (type == 'standard') {
        this.moduleName = 'IndivFilter';
        //this.gridURL = config.coreUrl + 'individuals/';
        $('.border-bottom-filter').addClass('hide');
        this.ui.filter.removeClass('crop2');
      } else {
        this.moduleName = 'AdvancedIndivFilter';
        //this.gridURL = config.coreUrl + 'individuals/advanced/';
        $('.border-bottom-filter').removeClass('hide');
        this.ui.filter.addClass('crop2');
      }

      this.com = new Com();
      this.displayGrid();
      this.displayFilter();
    },

    resetDate: function(e){
      if ($('#histVal:checked').val()){
        $('#dateVal').val(null);
      }
    },
    resetHist: function(e){
      if ($('#histVal:checked').val()){
        $('#histVal').prop('checked', false);
      }
    },

    exportGrid: function() {
      var url = config.coreUrl + 'individuals/export?criteria='+JSON.stringify(this.grid.collection.searchCriteria);
      var link = document.createElement('a');
      link.classList.add('DowloadLinka');
      
      //link.download = url;
      link.href = url;
      link.onclick = function () {
          //this.parentElement.removeChild(this);
          var href = $(link).attr('href');
          window.location.href = link;
          document.body.removeChild(link);
      };
     /*his.$el.append(link);*/
     document.body.appendChild(link);
     link.click();
    }
  });
});
