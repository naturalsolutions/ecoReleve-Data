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
  'config',
  'tooltipster-list',
  'i18n'

], function(
  $, _, Backbone, Marionette, Swal, Translater,
  Com, GridView, NsFilter, Config
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
      'click .js-btn-panel': 'togglePanel',
      'click .tab-ele': 'toggleTab',
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

    ModelPrototype: Backbone.Model,

    initialize: function(options) {
      this.options = options;
      this.model = new this.ModelPrototype();
      this.com = new Com();
      if( window.app.currentData ){
        this.populateCurrentData(window.app.currentData);
      }

      this.xhrTypeObj = $.ajax({
        url: this.model.get('type')+'/getType',
        context: this
      }).done(function(resp) {
          this.availableTypeObj = resp;
          this.model.set('objectType',resp[0].val);
          this.model.set('objectTypeLabel',resp[0].label);

      }).fail(function(resp) {
      });
    },

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
      this.com = new Com();
      this.$el.find('.js-date-time').datetimepicker({format : "DD/MM/YYYY HH:mm:ss"});
      this.displayFilter();
      this.displayGridView();
      if(this.displayMap){
        this.displayMap();
      }
      this.$el.find('.js-nav-tabs').addClass('hide');
      this.afterShow();
    },

    afterShow: function(){
      //console.warn('method not implemented');
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
      var afterGetRows = function(){
        _this.ui.totalRecords.html(this.model.get('totalRecords'));
      };

      this.rgGrid.show(this.gridView = new GridView({
        type: this.model.get('type'),
        com: this.com,
        objectType: this.model.get('objectType'),
        afterGetRows: afterGetRows,
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
        objectType: this.model.get('objectType'),
        filtersValues: this.defaultFilters,
        firstOperator: this.firstOperator,
      });
    },

    filter: function() {
      this.filters.update();
    },

    clearFilter: function() {
      this.filters.reset();
    },

    export: function(){
        var url = Config.coreUrl+this.model.get('type') + '/export?criteria=' + JSON.stringify(this.gridView.filters);
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

      if(this.availableTypeObj && this.availableTypeObj.length>1){

        var ulElem = document.createElement("ul");
        var tabLength = this.availableTypeObj.length;
        for( var i = 0 ; i < tabLength ; i++ ) {
          var elem = this.availableTypeObj[i];
          var liElem = document.createElement('li');
          liElem.onclick = function(e) {
            _this.ui.btnNew.tooltipster('close');
            var url = '#' + _this.model.get('type') + '/new/' + this.getAttribute('data-value');
            Backbone.history.navigate(url, {trigger: true});
          };
          liElem.setAttribute('data-value' , elem.val)
          liElem.innerHTML = elem.label;
          ulElem.appendChild(liElem);
        }

        this.ui.btnNew.tooltipster({
          theme : 'tooltipList',
          position: 'top',
          interactive : true,
          content: '',
          contentAsHTML : true,
          functionReady: function(instance,helper) {
            var elemRoot = instance.elementTooltip(); //.appendChild(ulElem)
            var elemContent = elemRoot.getElementsByClassName('tooltipster-content');
            $(elemContent).append(ulElem);
            instance.reposition();
          },
          functionAfter : function( instance, helper) {
            instance.destroy();
          }
        });
        this.ui.btnNew.tooltipster('open');
      } else {
        var url = '#' + _this.model.get('type') + '/new/'+this.availableTypeObj[0].val;
        Backbone.history.navigate(url, {trigger: true});

      }
    },

  });
});
