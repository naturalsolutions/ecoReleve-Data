/**
 * ag-grid - Advanced Data Grid / Data Table supporting Javascript / React / AngularJS / Web Components
 * @version v5.4.0
 * @link http://www.ag-grid.com/
 * @license MIT
 */

 define([
 ], function () {
   'use strict';

    // var utils_1 = require('../utils');

   var utils_1 = {
     Utils: {}
   };

   utils_1.Utils.loadTemplate = function (template) {
     var tempDiv = document.createElement('div');
     tempDiv.innerHTML = template;
     return tempDiv.firstChild;
   };

   utils_1.Utils.addChangeListener = function (element, listener) {
     element.addEventListener('changed', listener);
     element.addEventListener('paste', listener);
     element.addEventListener('input', listener);
        // IE doesn't fire changed for special keys (eg delete, backspace), so need to
        // listen for this further ones
     element.addEventListener('keydown', listener);
     element.addEventListener('keyup', listener);
   };

   utils_1.Utils.removeElement = function (parent, cssSelector) {
     this.removeFromParent(parent.querySelector(cssSelector));
   };

   utils_1.Utils.makeNull = function (value) {
     if (value === null || value === undefined || value === '') {
       return null;
     }

     return value;
   };
   var clear = 'Clear';
   var template = '<div>' +
    '<div>' +
    '<select class="ag-filter-select form-control input-sm" id="filterType">' +
    '<option value="1">[EQUALS]</option>' +
    '<option value="2">[NOT EQUAL]</option>' +
    '<option value="3">[LESS THAN]</option>' +
    '<option value="4">[LESS THAN OR EQUAL]</option>' +
    '<option value="5">[GREATER THAN]</option>' +
    '<option value="6">[GREATER THAN OR EQUAL]</option>' +
    '<option value="7">In</option>' +
    '</select>' +
    '</div>' +
    '<div>' +
    '<input class="ag-filter-filter form-control input-sm" id="filterText" type="text" placeholder="[FILTER...]"/>' +
    '</div>' +
    '<div class="ag-filter-apply-panel" id="applyPanel">' +
    '<button type="button" class="btn btn-block" id="applyButton">[APPLY FILTER]</button>' +
    '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="reneco reneco-close"></span> ' + clear + '</button>' +
    '</div>' +
    '</div>';
   var EQUALS = 1;
   var NOT_EQUAL = 2;
   var LESS_THAN = 3;
   var LESS_THAN_OR_EQUAL = 4;
   var GREATER_THAN = 5;
   var GREATER_THAN_OR_EQUAL = 6;
   var IN = 7;
   return (function () {
     function NumberFilter() {
     }
     NumberFilter.prototype.init = function (params) {
       this.filterParams = params.filterParams;
       this.applyActive = this.filterParams && this.filterParams.apply === true;
       this.filterChangedCallback = params.filterChangedCallback;
       this.filterModifiedCallback = params.filterModifiedCallback;
       this.localeTextFunc = params.localeTextFunc;
       this.valueGetter = params.valueGetter;
       this.createGui();
       this.filterNumber = null;
       this.filterType = EQUALS;
       this.createApi();
     };
     NumberFilter.prototype.onNewRowsLoaded = function () {
       var keepSelection = this.filterParams && this.filterParams.newRowsAction === 'keep';
       if (!keepSelection) {
         this.api.setType(EQUALS);
         this.api.setFilter(null);
       }
     };

     NumberFilter.prototype.afterGuiAttached = function () {
       this.eFilterTextField.focus();
       this.cleanBtn = this.eGui.querySelector('#cleanBtn');
       this.cleanBtn.addEventListener('click', this.clean.bind(this));
     };

     NumberFilter.prototype.clean = function () {
       $(this.eGui).find('input').val('');
       this.onFilterChanged();
       this.filterChangedCallback();
     };

     NumberFilter.prototype.doesFilterPass = function (node) {
       if (this.filterNumber === null) {
         return true;
       }
       var value = this.valueGetter(node);
       if (!value && value !== 0) {
         return false;
       }
       var valueAsNumber;
       if (typeof value === 'number') {
         valueAsNumber = value;
       }
       else {
         valueAsNumber = parseFloat(value);
       }
       switch (this.filterType) {
       case EQUALS:
         return valueAsNumber === this.filterNumber;
       case LESS_THAN:
         return valueAsNumber < this.filterNumber;
       case GREATER_THAN:
         return valueAsNumber > this.filterNumber;
       case LESS_THAN_OR_EQUAL:
         return valueAsNumber <= this.filterNumber;
       case GREATER_THAN_OR_EQUAL:
         return valueAsNumber >= this.filterNumber;
       case NOT_EQUAL:
         return valueAsNumber != this.filterNumber;
       case IN:
         var tab = this.filterText.split(',');
         if (tab.length <= 1) {
           tab = this.filterText.split(';');
         }
         if (tab.length <= 1) {
           tab = this.filterText.split(' ');
         }

         for (var i = 0; i < tab.length; i++) {
           if ((tab[i].toLowerCase() == valueAsNumber)) {
             return true;
           }
         }
         return false;
       default:
                // should never happen
         console.warn('invalid filter type ' + this.filterType);
         return false;
       }
     };
     NumberFilter.prototype.getGui = function () {
       return this.eGui;
     };
     NumberFilter.prototype.isFilterActive = function () {
       return this.filterNumber !== null;
     };
     NumberFilter.prototype.createTemplate = function () {
       return template
            .replace('[FILTER...]', this.localeTextFunc('filterOoo', 'Filter...'))
            .replace('[EQUALS]', this.localeTextFunc('equals', 'Equals'))
            .replace('[LESS THAN]', this.localeTextFunc('lessThan', 'Less than'))
            .replace('[GREATER THAN]', this.localeTextFunc('greaterThan', 'Greater than'))
            .replace('[LESS THAN OR EQUAL]', this.localeTextFunc('lessThanOrEqual', 'Less than or equal'))
            .replace('[GREATER THAN OR EQUAL]', this.localeTextFunc('greaterThanOrEqual', 'Greater than or equal'))
            .replace('[NOT EQUAL]', this.localeTextFunc('notEqual', 'Not equal'))
            .replace('[APPLY FILTER]', this.localeTextFunc('applyFilter', 'Apply Filter'));
     };
     NumberFilter.prototype.createGui = function () {
       this.eGui = utils_1.Utils.loadTemplate(this.createTemplate());
       this.eFilterTextField = this.eGui.querySelector('#filterText');
       this.eTypeSelect = this.eGui.querySelector('#filterType');
       utils_1.Utils.addChangeListener(this.eFilterTextField, this.onFilterChanged.bind(this));
       this.eTypeSelect.addEventListener('change', this.onTypeChanged.bind(this));
       this.setupApply();
     };
     NumberFilter.prototype.setupApply = function () {
       var _this = this;
       if (this.applyActive) {
         this.eApplyButton = this.eGui.querySelector('#applyButton');
         this.eApplyButton.addEventListener('click', function () {
           _this.filterChangedCallback();
         });
       }
       else {
         utils_1.Utils.removeElement(this.eGui, '#applyPanel');
       }
     };
     NumberFilter.prototype.onTypeChanged = function () {
       this.filterType = parseInt(this.eTypeSelect.value);
       this.filterChanged();
     };
     NumberFilter.prototype.filterChanged = function () {
       this.filterModifiedCallback();
       if (!this.applyActive) {
         this.filterChangedCallback();
       }
     };
     NumberFilter.prototype.onFilterChanged = function () {
       var filterText = utils_1.Utils.makeNull(this.eFilterTextField.value);
        // mjaouen
       this.filterText = filterText;
        //
       if (filterText && filterText.trim() === '') {
         filterText = null;
       }
       var newFilter;
       if (filterText !== null && filterText !== undefined) {
         newFilter = parseFloat(filterText);
       }
       else {
         newFilter = null;
       }
       if (this.filterNumber !== newFilter) {
         this.filterNumber = newFilter;
         this.filterChanged();
       }
     };
     NumberFilter.prototype.createApi = function () {
       var that = this;
       this.api = {
         EQUALS: EQUALS,
         NOT_EQUAL: NOT_EQUAL,
         LESS_THAN: LESS_THAN,
         GREATER_THAN: GREATER_THAN,
         LESS_THAN_OR_EQUAL: LESS_THAN_OR_EQUAL,
         GREATER_THAN_OR_EQUAL: GREATER_THAN_OR_EQUAL,
         setType: function (type) {
           that.filterType = type;
           that.eTypeSelect.value = type;
         },
         setFilter: function (filter) {
           filter = utils_1.Utils.makeNull(filter);
           if (filter !== null && !(typeof filter === 'number')) {
             filter = parseFloat(filter);
           }
           that.filterNumber = filter;
           that.eFilterTextField.value = filter;
         },
         getType: function () {
           return that.filterType;
         },
         getFilter: function () {
           return that.filterNumber;
         },
         getModel: function () {
           if (that.isFilterActive()) {
             return {
               type: that.filterType,
               filter: that.filterNumber
             };
           }

           return null;
         },
         setModel: function (dataModel) {
           if (dataModel) {
             this.setType(dataModel.type);
             this.setFilter(dataModel.filter);
           }
           else {
             this.setFilter(null);
           }
         }
       };
     };
     NumberFilter.prototype.getApi = function () {
       return this.api;
     };
     return NumberFilter;
   }());
 });
