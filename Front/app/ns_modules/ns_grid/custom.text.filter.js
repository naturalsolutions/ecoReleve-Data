
define([
  'i18n'
], function() {
  var clear ='Clear';
  var CONTAINS = 'contains';
  var NOT_CONTAINS = 'notContains';
  var EQUALS = 'equals';
  var NOT_EQUALS = 'notEquals';
  var STARTS_WITH = 'startsWith';
  var ENDS_WITH = 'endsWith';
  var IN = 'in';
  var template = '<div>' +
      '<div>' +
      '<select class="ag-filter-select form-control input-sm" id="filterType">' +
      '<option value="'+CONTAINS+'">'+i18n.translate('aggrid.filter.type.CONTAINS')+'</option>' +
      '<option value="'+NOT_CONTAINS+'">'+i18n.translate('aggrid.filter.type.NOT_CONTAINS')+'</option>' +
      '<option value="'+EQUALS+'">'+i18n.translate('aggrid.filter.type.EQUALS')+'</option>' +
      '<option value="'+NOT_EQUALS+'">'+i18n.translate('aggrid.filter.type.NOT_EQUALS')+'</option>' +
      '<option value="'+STARTS_WITH+'">'+i18n.translate('aggrid.filter.type.STARTS_WITH')+'</option>' +
      '<option value="'+ENDS_WITH+'">'+i18n.translate('aggrid.filter.type.ENDS_WITH')+'</option>' +
      '<option value="'+IN+'">'+i18n.translate('aggrid.filter.type.IN')+'</option>' +
      '</select>' +
      '</div>' +
      '<div>' +
      '<input class="ag-filter-filter form-control input-sm" id="filterText" type="text" placeholder="'+i18n.translate('aggrid.filter.placeholder.text')+'"/>' +
      '</div>' +
      '<div class="ag-filter-apply-panel" id="applyPanel">' +
      '<button type="button" class="btn btn-block" id="applyButton">'+i18n.translate('aggrid.filter.btn.apply')+'</button>' +
      '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="reneco reneco-close"></span> '+i18n.translate('aggrid.filter.btn.clear')+'</button>' +
      '</div>' +
      '</div>';

  'use strict';
  function TextFilter() {
  }
  TextFilter.CONTAINS = 'contains'; // 1;
  TextFilter.NOT_CONTAINS = 'notContains'; //2;
  TextFilter.EQUALS = 'equals'; //3;
  TextFilter.NOT_EQUALS = 'notEquals'; //4;
  TextFilter.STARTS_WITH = 'startsWith'; //5;
  TextFilter.ENDS_WITH = 'endsWith'; //6;
  TextFilter.IN = 'in'; //7


  TextFilter.prototype.init = function(params){
    this.filterParams = params;
    this.applyActive = params.apply === true;
    this.newRowsActionKeep = params.newRowsAction === 'keep';
    this.filterText = null;
    this.filterType = TextFilter.CONTAINS;
    this.createGui();
  };

  TextFilter.prototype.onNewRowsLoaded = function () {
      if (!this.newRowsActionKeep) {
          this.setType(TextFilter.CONTAINS);
          this.setFilter(null);
      }
  };

  TextFilter.prototype.setFilter = function(filter) {
    if (filter) {
      this.filterText = filter;
      this.eFilterTextField.value = filter;
    }
    else {
      this.filterText = null;
      this.eFilterTextField.value = null;
    }
  }


  TextFilter.prototype.setType = function (type) {
      this.filterType = type;
      this.eTypeSelect.value = type;
  };

  TextFilter.prototype.getGui = function(){
    return   this.templateDiv;
  }

  TextFilter.prototype.isFilterActive = function(){
        return this.filterText != null;
  }

  TextFilter.prototype.getModel = function() {
    if (this.isFilterActive()) {
        return {
            type: this.filterType,
            filter: this.filterText
        };
    }
    else {
        return null;
    }
  }

  TextFilter.prototype.doesFilterPass = function(params) {
    if (this.filterText === null) {
        return true;
    }
    var value = this.filterParams.valueGetter(params.node);
    if (!value) {
        if (this.filterType === TextFilter.NOT_CONTAINS) {
            // if there is no value, but the filter type was 'not equals',
            // then it should pass, as a missing value is not equal whatever
            // the user is filtering on
            return true;
        }
        else {
            // otherwise it's some type of comparison, to which empty value
            // will always fail
            return false;
        }
    }
    var filterTextLoweCase = this.filterText.toLowerCase();
    var valueLowerCase = value.toString().toLowerCase();
    switch (this.filterType) {
        case TextFilter.CONTAINS:
          return valueLowerCase.indexOf(filterTextLoweCase) >= 0;
        case TextFilter.NOT_CONTAINS:
          return valueLowerCase.indexOf(filterTextLoweCase) === -1;
        case TextFilter.EQUALS:
          return valueLowerCase === filterTextLoweCase;
        case TextFilter.NOT_EQUALS:
          return valueLowerCase != filterTextLoweCase;
        case TextFilter.STARTS_WITH:
          return valueLowerCase.indexOf(filterTextLoweCase) === 0;
        case TextFilter.ENDS_WITH:
          var index = valueLowerCase.lastIndexOf(filterTextLoweCase);
          return index >= 0 && index === (valueLowerCase.length - filterTextLoweCase.length);
        case TextFilter.IN: {
            var tab = this.filterText.split(/;/);
            //  var tab = this.filterText.split(/,| |;/);
            // var tab = this.filterText.split(',');
            // if(tab.length <= 1){
            //     tab = this.filterText.split(';');
            // }
            // if(tab.length <= 1){
            //     tab = this.filterText.split(' ');
            // }

            for (var i=0; i< tab.length; i++){
                if ((tab[i].toLowerCase() == valueLowerCase)) {
                    return true;
                }
            }
            return false;
        }
        default:
            // should never happen
            console.warn('invalid filter type ' + this.filterType);
            return false;
    }
  }

  TextFilter.prototype.setModel = function(model) {
    if (model) {
      this.setType(model.type);
      this.setFilter(model.filter);
    }
    else {
        this.setType(TextFilter.CONTAINS);
        this.setFilter(null);
    }
  }


  TextFilter.prototype.createGui = function() {
    this.templateDiv = document.createElement("div")
    this.templateDiv.innerHTML = template;
    this.eFilterTextField = this.getGui().querySelector("#filterText");
    this.eTypeSelect = this.getGui().querySelector("#filterType");
    this.cleanBtn =  this.getGui().querySelector('#cleanBtn');
    this.eFilterTextField.addEventListener('input', this.onFilterChanged.bind(this));
    this.eTypeSelect.addEventListener('change', this.onTypeChanged.bind(this));
    this.cleanBtn.addEventListener('click', this.clean.bind(this));
    this.setupApply();
  };

  TextFilter.prototype.onTypeChanged = function () {
      this.filterType = this.eTypeSelect.value;
      this.filterChanged();
  };

  TextFilter.prototype.setupApply = function() {
    var _this = this;
    if (this.applyActive) {
      this.eApplyButton = this.getGui().querySelector('#applyButton');
      this.eApplyButton.addEventListener('click', function() {
        _this.filterParams.filterChangedCallback();
      });
    }
  };

  TextFilter.prototype.onFilterChanged = function() {
      var newFilter = this.eFilterTextField.value;

      if( newFilter === '' ) {
        newFilter = null;
        this.eFilterTextField.value = "";
      }

      if (this.filterText !== newFilter) {
        var newLowerCase = newFilter ? newFilter.toLowerCase() : null;
        var previousLowerCase = this.filterText ? this.filterText.toLowerCase() : null;
        this.filterText = newFilter;
        this.filterChanged();
      }
  };

  TextFilter.prototype.filterChanged = function() {
    this.filterParams.filterModifiedCallback();
    if (!this.applyActive) {
        this.filterParams.filterChangedCallback();
    }
  };

  TextFilter.prototype.afterGuiAttached = function (params) {
      this.eFilterTextField.focus();

  };

  TextFilter.prototype.clean = function(){
      this.eFilterTextField.value = '';
      this.onFilterChanged();
      this.filterParams.filterChangedCallback();
  }



  return TextFilter;
});
