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

], function (
    $, _, Backbone, Marionette, Swal, Translater,
    Com, GridView, NsFilter, Config
) {

    'use strict';

    return Marionette.LayoutView.extend({

        template: 'app/modules/importHistory/history.tpl.html',
        className: 'full-height animated white rel',

        events: {
            'click .js-btn-filter': 'filter',
            'click .js-btn-clear': 'clearFilter',
            //   'click .js-btn-new': 'new',
            //   'click .js-btn-export': 'export',
            'click .js-link-back': 'back',
            //   'click .js-link-new': 'new',
            'change .js-page-size': 'changePageSize',
            //   'click .js-btn-panel': 'togglePanel',
            //   'click .tab-ele': 'toggleTab',
        },

        ui: {
            'filter': '.js-filters',
            //   'btnNew': '.js-btn-new',
            'totalRecords': '.js-total-records'
        },

        regions: {
            rgGrid: '.js-rg-grid'
        },

        translater: Translater.getTranslater(),

        ModelPrototype: Backbone.Model,

        initialize: function (options) {
            //   this.model = new this.ModelPrototype();
            this.rootURL = 'importHistory/';
            this.com = new Com();
            //   if( window.app.currentData ){
            //     this.populateCurrentData(window.app.currentData);
            //   }
        },

        back: function () {},

        onRender: function () {
            this.$el.i18n();
        },

        onShow: function () {
            this.com = new Com();
            this.displayFilter();
            this.displayGridView();
            this.afterShow();
        },

        afterShow: function () {
            //console.warn('method not implemented');
        },

        changePageSize: function (e) {
            this.gridView.changePageSize($(e.target).val());
        },

        // onRowClicked: function(row){
        //   window.app.currentData = this.gridView.serialize();
        //   window.app.currentData.index = row.rowIndex;

        //   var url = '#' + this.gridView.model.get('type') + '/' + (row.data.id || row.data.ID);
        //   Backbone.history.navigate(url, {trigger: true});
        // },

        displayGridView: function () {
            var _this = this;
            var afterGetRows = function () {
                _this.ui.totalRecords.html(this.model.get('totalRecords'));
            };

            this.rgGrid.show(this.gridView = new GridView({
                url: this.rootURL,
                com: this.com,
                //objectType: this.model.get('objectType'),
                afterGetRows: afterGetRows,
                filters: this.defaultFilters,
                gridOptions: {
                    //onRowClicked: this.onRowClicked.bind(this),
                    rowModelType: 'pagination'
                },
                //goTo: (this.goTo || false)
            }));
        },

        displayFilter: function () {
            this.filters = new NsFilter({
                url: this.rootURL,
                com: this.com,
                filterContainer: this.ui.filter,
                // objectType: this.model.get('objectType'),
                filtersValues: this.defaultFilters,
                // firstOperator: this.firstOperator,
            });
        },

        filter: function () {
            this.filters.update();
        },

        clearFilter: function () {
            this.filters.reset();
        },

    });
});
