define([
    'i18n'
], function() {

    var template = '<div>' +
        '<div class="js-select">' +
        '<select class="ag-filter-filter js-select-filter form-control input-sm" name="selectedVal">' +
        '<option value="-1"></option>'+
        '</select>' +
        '</div>' +
        '<div class="ag-filter-apply-panel" id="applyPanel">' +
        '<button class="btn btn-block" type="button" id="applyButton">'+i18n.translate('aggrid.filter.btn.apply')+'</button>' +
        '<div class="bottom clearfix" />' +
        '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="reneco reneco-close"></span> '+i18n.translate('aggrid.filter.btn.clear')+'</button>' +
        '</div>' +
        '</div>';

    'use strict';

    function SelectFilter() {

    };

    SelectFilter.prototype.init = function(params) {
      
        if (typeof(params) === 'undefined' || typeof(params.selectList) === 'undefined') {
            console.error("Select filter need filterParams : { selectList : [{value : '' , label: ' ' }] } ");
            return null;
        }

        this.filterParams = params;
        this.applyActive = params.apply === true;
        this.newRowsActionKeep = params.newRowsAction === 'keep';
        this.filterSelect = null;
        this.filterType = "EQUALS";
        this.tabSelect = [];
        this.createGui();

    };

    SelectFilter.prototype.createGui = function() {

        var _this = this;

        this.templateDiv = document.createElement("div")
        this.templateDiv.innerHTML = template;
        this.eFilterSelectField = this.getGui().querySelector(".js-select-filter");
        this.eFilterSelectField.addEventListener('change', this.onFilterChanged.bind(this));
        for (var i = 0; i < this.filterParams.selectList.length; i++) {
            var tmpElem = document.createElement("option");
            tmpElem.setAttribute("value", this.filterParams.selectList[i].value);
            tmpElem.textContent = this.filterParams.selectList[i].label;
            this.eFilterSelectField.appendChild(tmpElem);
        }

        this.cleanBtn = this.getGui().querySelector('#cleanBtn');
        this.cleanBtn.addEventListener('click', this.clean.bind(this));
        this.setupApply();
    };

    SelectFilter.prototype.getGui = function() {
        return this.templateDiv;
    };

    SelectFilter.prototype.isFilterActive = function() {
        return this.filterSelect != null;
    };

    SelectFilter.prototype.doesFilterPass = function(params) {

        var valTmp = this.filterParams.valueGetter(params.node);

        if (!this.filterSelect) {
            return true;
        } else {
            return (valTmp == this.filterSelect);
        }
    };

    SelectFilter.prototype.getModel = function() {

        if (this.isFilterActive()) {
            return {
                type: "EQUALS",
                filter: this.filterSelect
            };
        } else {
            return null;
        }
    };

    SelectFilter.prototype.setupApply = function() {

        var _this = this;
        if (this.applyActive) {
            this.eApplyButton = this.getGui().querySelector('#applyButton');
            this.eApplyButton.addEventListener('click', function() {
                _this.filterParams.filterChangedCallback();
            });
        }
    };

    SelectFilter.prototype.setModel = function(model) {

        if (model) {
            this.setType(model.type);
            this.setFilter(model.filter);
        } else {
            this.setFilter(null);
        }
    };

    SelectFilter.prototype.setFilter = function(filter) {

        if (filter) {
            this.filterSelect = filter;
        } else {
            this.filterSelect = null;
            this.eFilterSelectField.value = "";
        }
    };

    SelectFilter.prototype.setType = function(type) {

        this.filterType = type;
        this.eTypeSelect.value = type;
    };

    SelectFilter.prototype.clean = function() {
        this.eFilterSelectField.value = -1;
        this.onFilterChanged();
        this.filterParams.filterChangedCallback();
    };

    SelectFilter.prototype.onFilterChanged = function() {

        var newFilter = this.eFilterSelectField.options[this.eFilterSelectField.selectedIndex].value;

        if (newFilter === "-1") {
            newFilter = null;
            this.eFilterSelectField.value = -1;
        };

        if (this.filterSelect !== newFilter) {

            var newLowerCase = newFilter ? newFilter.toLowerCase() : null;
            var previousLowerCase = this.filterSelect ? this.filterSelect.toLowerCase() : null;
            this.filterSelect = newFilter;
            this.filterChanged();
        }

    };

    SelectFilter.prototype.filterChanged = function() {

        this.filterParams.filterModifiedCallback();
        if (!this.applyActive) {
            this.filterParams.filterChangedCallback();
        }
    };



    return SelectFilter;
});
