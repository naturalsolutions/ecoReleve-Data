define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'ns_modules/ns_com',
	//'ns_filter/model-filter_module',
  'ns_filter_bower',
	'ns_map/ns_map',
	'config',
	'i18n'
], function($, _, Backbone, Marionette, Com, NsFilter, NsMap, config
) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/export/templates/tpl-export-step2.html',

    ui: {
      'filtersList': 'select#filtersList',
      'filters': 'div#filters',
      'total': 'span#total'
    },

    events: {
      'change select#filtersList': 'addFilter',
      'click button#filter': 'filter',
    },

    name: ' Filter',

    initialize: function(options) {
      this.com = new Com();
      this.viewId = options.model.get('viewId');
      this.model.set('filters', []);
    },

    onShow: function() {
      this.getFieldsListForSelectedView();
      this.displayMap();
      this.displayFilters();
    },

    addFilter: function() {
      var option = this.ui.filtersList.find('option:selected');

      if (option.val() == 'choose')
      return false;

      var filterName = option.val();
      var filterLabel = option.text();
      var type = option.attr('type');
      var options = this.fieldsList[filterName].options;

      var filter = [{
        editable: true,
        fieldClass: [''],
        title: filterLabel,
        name: filterName,
        options:options,
        type: type,
        validators: []
      }];
      this.filters.addFilter(filter);

      this.ui.filtersList.val('choose');
    },

    displayFilters: function() {
      var myFilter = NsFilter.extend({
        getValueOptions: function (DataRow) {
            var valueOptions;
            switch (DataRow['type']) {
                case "Select": case 'Checkboxes':
                    return DataRow['options']
                    break;
                case 'AutocompTreeEditor':
                    return DataRow['options']
                    break;
                case 'AutocompleteEditor':
                    return DataRow['options']
                    break;
                case "DATETIME":
                    return valueOptions = [{
                        dateFormat: 'd/m/yyyy',
                        defaultValue: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear()
                    }];
                    break;
                default:
                    return valueOptions = DataRow['options'];
                    break;
            }
        },
      });

      this.filters = new myFilter({
        com: this.com,
        filterContainer: this.ui.filters,
        custom: true,
      });
    },

    getFieldsListForSelectedView: function() {
      var _this = this;
      var viewUrl = config.coreUrl + 'export/views/' + this.viewId + '/getFilters';
      var jqxhr = $.ajax({
        url: viewUrl,
        context: this,
        dataType: 'json'
      }).done(function(data) {
        this.fieldsList = {};
        var exportFieldsList = [];
        _this.ui.filtersList.append('<option value="choose">Add a filter</option>');
        for (var i = 0; i < data.length; i++) {
          var optionItem = '<option type=\'' + data[i].type + '\'>' + data[i].name + '</option>';
          _this.ui.filtersList.append(optionItem);
          exportFieldsList.push(data[i].name);
          this.fieldsList[data[i].name] = data[i];
        }
        $('#filter-btn').removeClass('masqued');
      }).fail(function(msg) {
			});
    },

    displayMap: function(geoJson) {
      this.map = new NsMap({
        cluster: true,
        com: this.com,
        element: 'map',
        zoom: 2,
        url: config.coreUrl + 'export/views/' + this.viewId + '/?geo=true',
        totalElt: this.ui.total,
      });
    },

    filter: function() {
      this.model.set('filters', this.filters.update());
    },

    validate: function() {
      return this.model;
    },

    check: function() {
      return true;
    },
  });
});
