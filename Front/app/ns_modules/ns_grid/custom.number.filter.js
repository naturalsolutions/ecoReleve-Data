
define([
  'i18n'
], function() {
  var clear ='Clear';
  var EQUALS = 'equals';
  var NOT_EQUAL = 'notEqual';
  var LESS_THAN = 'lessThan';
  var LESS_THAN_OR_EQUAL = 'lessThanOrEqual';
  var GREATER_THAN = 'greaterThan';
  var GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual';
  var IN_RANGE = 'inRange';
  var template = '<div>' +
      '<div>' +
      '<select class="ag-filter-select form-control input-sm" id="filterType">' +
      '<option value="'+EQUALS+'">'+i18n.translate('aggrid.filter.type.EQUALS')+'</option>' +
      '<option value="'+NOT_EQUAL+'">'+i18n.translate('aggrid.filter.type.NOT_EQUAL')+'</option>' +
      '<option value="'+LESS_THAN+'">'+i18n.translate('aggrid.filter.type.LESS_THAN')+'</option>' +
      '<option value="'+LESS_THAN_OR_EQUAL+'">'+i18n.translate('aggrid.filter.type.LESS_THAN_OR_EQUAL')+'</option>' +
      '<option value="'+GREATER_THAN+'">'+i18n.translate('aggrid.filter.type.GREATER_THAN')+'</option>' +
      '<option value="'+GREATER_THAN_OR_EQUAL+'">'+i18n.translate('aggrid.filter.type.GREATER_THAN_OR_EQUAL')+'</option>' +
      '<option value="'+IN_RANGE+'">'+i18n.translate('aggrid.filter.type.IN_RANGE')+'</option>' +
      '</select>' +
      '</div>' +
      '<div>' +
      '<input class="ag-filter-filter form-control input-sm" id="filterText" type="text" placeholder="'+i18n.translate('aggrid.filter.placeholder.number')+'"/>' +
      '<div class="ag-filter-number-to" id="filterNumberToPanel">' +
      '<input class="ag-filter-filter form-control input-sm hide" id="filterToText" type="text" placeholder="'+i18n.translate('aggrid.filter.placeholder.numberTo')+'"/>' +
      '</div>' +
      '</div>' +
      '<div class="ag-filter-apply-panel" id="applyPanel">' +
      '<button type="button" class="btn btn-block" id="applyButton">'+i18n.translate('aggrid.filter.btn.apply')+'</button>' +
      '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="reneco reneco-close"></span> '+i18n.translate('aggrid.filter.btn.clear')+'</button>' +
      '</div>' +
      '</div>';

  'use strict';
  function NumberFilter() {
  }
  NumberFilter.EQUALS = 'equals'; // 1;
  NumberFilter.NOT_EQUAL = 'notEqual'; //2;
  NumberFilter.LESS_THAN = 'lessThan'; //3;
  NumberFilter.LESS_THAN_OR_EQUAL = 'lessThanOrEqual'; //4;
  NumberFilter.GREATER_THAN = 'greaterThan'; //5;
  NumberFilter.GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual'; //6;
  NumberFilter.IN_RANGE = 'inRange'; //7


  NumberFilter.prototype.init = function(params){
    this.filterParams = params;
    this.applyActive = params.apply === true;
    this.newRowsActionKeep = params.newRowsAction === 'keep';
    this.filterNumber = null;
    this.filterType = NumberFilter.EQUALS;
    this.createGui();
  };

  NumberFilter.prototype.onNewRowsLoaded = function () {
      if (!this.newRowsActionKeep) {
          this.setType(NumberFilter.EQUALS);
          this.setFilter(null);
      }
  };

  NumberFilter.prototype.setFilter = function(filter) {
    if (filter !== null && !(typeof filter === 'number')) {
        filter = parseFloat(filter);
    }
    this.filterNumber = filter;
    this.eFilterTextField.value = filter;
  }

  NumberFilter.prototype.setFilterTo = function(filter) {
    if (filter !== null && !(typeof filter === 'number')) {
        filter = parseFloat(filter);
    }
    this.filterNumberTo = filter;
    this.eFilterToTextField.value = filter;
  }


  NumberFilter.prototype.setType = function (type) {
      this.filterType = type;
      this.eTypeSelect.value = type;
  };

  NumberFilter.prototype.getGui = function(){
    return   this.templateDiv;
  }

  NumberFilter.prototype.isFilterActive = function(){
    if (this.filterType === NumberFilter.IN_RANGE) {
        return this.filterNumber != null && this.filterNumberTo != null;
    }
    else {
        return this.filterNumber != null;
    }
  }

  NumberFilter.prototype.getModel = function() {
    if (this.isFilterActive()) {
        return {
            type: this.filterType,
            filter: this.filterNumber,
            filterTo: this.filterTo
        };
    }
    else {
        return null;
    }
  }

  NumberFilter.prototype.doesFilterPass = function(params) {
    if (this.filterNumber === null) {
        return true;
    }
    var value = this.filterParams.valueGetter(params.node);
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
        case NumberFilter.EQUALS:
            return valueAsNumber === this.filterNumber;
        case NumberFilter.LESS_THAN:
            return valueAsNumber < this.filterNumber;
        case NumberFilter.GREATER_THAN:
            return valueAsNumber > this.filterNumber;
        case NumberFilter.LESS_THAN_OR_EQUAL:
            return valueAsNumber <= this.filterNumber;
        case NumberFilter.GREATER_THAN_OR_EQUAL:
            return valueAsNumber >= this.filterNumber;
        case NumberFilter.NOT_EQUAL:
            return valueAsNumber != this.filterNumber;
        case NumberFilter.IN_RANGE:
            return valueAsNumber >= this.filterNumber && valueAsNumber <= this.filterNumberTo;
        default:
            // should never happen
            console.warn('invalid filter type ' + this.filterType);
            return false;
    }
  }

  NumberFilter.prototype.setModel = function(model) {
    if (model) {
      this.setType(model.type);
      this.setFilter(model.filter);
      this.setFilterTo(model.filterTo);
    }
    else {
        this.setType(NumberFilter.EQUALS);
        this.setFilter(null);
        this.setFilterTo(null);
    }
    this.setVisibilityOnDateToPanel();
  }


  NumberFilter.prototype.createGui = function() {
    this.templateDiv = document.createElement("div")
    this.templateDiv.innerHTML = template;
    this.eFilterTextField = this.getGui().querySelector("#filterText");
    this.eFilterToTextField = this.getGui().querySelector("#filterToText");
    this.eTypeSelect = this.getGui().querySelector("#filterType");
    this.cleanBtn =  this.getGui().querySelector('#cleanBtn');
    this.eFilterTextField.addEventListener('input', this.onFilterChanged.bind(this));
    this.eFilterToTextField.addEventListener('input', this.onFilterChanged.bind(this));
    this.eTypeSelect.addEventListener('change', this.onTypeChanged.bind(this));
    this.cleanBtn.addEventListener('click', this.clean.bind(this));
    this.setupApply();
  };

  NumberFilter.prototype.onTypeChanged = function () {
      this.filterType = this.eTypeSelect.value;
      this.setVisibilityOnDateToPanel();
      this.filterChanged();
  };

  NumberFilter.prototype.setupApply = function() {
    var _this = this;
    if (this.applyActive) {
      this.eApplyButton = this.getGui().querySelector('#applyButton');
      this.eApplyButton.addEventListener('click', function() {
        _this.filterParams.filterChangedCallback();
      });
    }
  };

  NumberFilter.prototype.onFilterChanged = function() {
      var newFilter = parseFloat(this.eFilterTextField.value);
      var newFilterTo = parseFloat(this.eFilterToTextField.value);

      if( isNaN(newFilter) ) {
        newFilter = null;
        this.eFilterTextField.value = "";
      }
      if( isNaN(newFilterTo) ) {
        newFilterTo = null;
        this.eFilterToTextField.value= "";
      }

      if (this.filterNumber !== newFilter || this.filterNumberTo !== newFilterTo) {
        this.filterNumber = newFilter;
        this.filterNumberTo = newFilterTo;
        this.filterChanged();
        this.setVisibilityOnDateToPanel();
      }
  };

  NumberFilter.prototype.filterChanged = function() {
    this.filterParams.filterModifiedCallback();
    if (!this.applyActive) {
        this.filterParams.filterChangedCallback();
    }
  };

  NumberFilter.prototype.afterGuiAttached = function (params) {
      this.eFilterTextField.focus();

  };

  NumberFilter.prototype.clean = function(){
      this.eFilterTextField.value = '';
      this.eFilterToTextField.value = '';
      this.onFilterChanged();
      this.filterParams.filterChangedCallback();
  }

  NumberFilter.prototype.setVisibilityOnDateToPanel = function () {
      var visible = this.filterType === NumberFilter.IN_RANGE;
      if( visible ) {
        if( this.eFilterToTextField.classList.contains('hide') ) {
          this.eFilterToTextField.classList.remove('hide');
        }
      }
      else {
        if( !this.eFilterToTextField.classList.contains('hide') ) {
          this.eFilterToTextField.classList.add('hide');
        }
      }
  };


  return NumberFilter;
});
