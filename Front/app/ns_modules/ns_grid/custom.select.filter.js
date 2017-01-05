define([
    'jquery',
], function($) {

    'use strict';

    function SelectFilter() {}

    SelectFilter.prototype = {
        init: function(params) {
            if (typeof(params.filterParams) === 'undefined' || typeof(params.filterParams.selectList) === 'undefined') {
                console.error("Select filter need filterParams : { selectList : [{value : '' , label: ' ' }] } ");
                return null;
            }
            var _this = this;
            var apply = "Apply Filter";
            var clear = "Clear";

            this.eGui = document.createElement('div');
            this.eGui.innerHTML =
                '<div class="js-select">' +
                '<select class="ag-filter-filter js-select-filter form-control input-sm" name="selectedVal">' +
                '<option value=""></option>' +
                '</select>' +
                '</div>' +
                '<div class="ag-filter-apply-panel" id="applyPanel">' +
                '<button class="btn btn-block" type="button" id="applyButton">' + apply + '</button>' +
                '<div class="bottom clearfix" />' +
                '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="reneco reneco-close"></span> ' + clear + '</button>' +
                '</div>';
            this.$eGui = $(this.eGui);


            this.cleanBtn = this.eGui.querySelector('#cleanBtn');
            this.$select = this.eGui.querySelector('.js-select-filter');
            this.cleanBtn.addEventListener('click', this.dateClean.bind(this));
            this.filterSelect = null;

            this.applyActive = true;
            this.filterChangedCallback = params.filterChangedCallback;
            this.filterModifiedCallback = params.filterModifiedCallback;
            this.valueGetter = params.valueGetter;
            this.tabSelect = [];
            this.params = params;
            for (var i = 0; i < params.filterParams.selectList.length; i++) {
                $(_this.$select).append('<option disabled value="' + params.filterParams.selectList[i].value + '">' + params.filterParams.selectList[i].label + '</option>')
            }

            this.fillOptionsList();

            $(this.$select).on("mousedown", function(e) {
                _this.fillOptionsList();
            });
            this.createGui();
        },

        isPresent: function(tab, val) {
            for (var j = 0; j < tab.length; j++) {
                if (tab[j] === val) {
                    return true;
                }
            }
            return false;
        },

        fillOptionsList() {
            var tabUniqVal = [];
            $(this.$select).find("option[value!='']").attr('disabled', true);
            for (var i = 0; i < this.params.rowModel.rowsToDisplay.length; i++) {
                var valeur = this.valueGetter(this.params.rowModel.rowsToDisplay[i]);
                if (!this.isPresent(tabUniqVal, valeur)) {
                    tabUniqVal.push(valeur);
                    $(this.$select).find("option[value=" + valeur + "]").attr('disabled', false);
                }
            }
        },

        dateClean: function() {
            $(this.$select).val("");

            this.onFilterChanged();
            this.filterChangedCallback();
            if ($('.ag-filter').length) {
                $('body').trigger('click'); // simule un clique sur le body fermera le popup :p
            }
        },

        afterGuiAttached: function() {
            var self = this;
            $(this.$select).on("change", function(e) {
                self.onFilterChanged();
            })
        },

        isFilterValid: function() {
            // var optSel = $(this.$select).val();
            // var isValid = (optSel > 0)
            // return isValid;
            return true;
        },

        onFilterChanged: function() {
            this.filterSelect = $(this.$select).val()
            this.filterChanged();
        },

        filterChanged: function() {
            this.filterModifiedCallback();
            if (!this.applyActive) {
                this.filterChangedCallback();
            }
        },

        getGui: function() {
            return this.eGui;
        },

        createGui: function() {
            this.setupApply();
        },

        isFilterActive: function() {
            return this.filterSelect;
            //  return this.filterDate && (this.filterDate.dateFrom || this.filterDate.dateTo);
        },

        setupApply: function() {
            var _this = this;
            if (this.applyActive) {
                this.eApplyButton = this.eGui.querySelector('#applyButton');
                this.eApplyButton.addEventListener('click', function() {
                    if (_this.isFilterValid()) {
                        _this.filterChangedCallback();
                    }
                });
            }
        },

        getApi: function() {
            var that = this;
            return {
                getModel: function() {
                    if (that.isFilterActive()) {
                        return {
                            type: 1,
                            filter: that.filterSelect
                        };
                    } else {
                        return null;
                    }
                },
                setModel: function(model) {
                    if (model) {
                        this.setType(model.type);
                        this.setFilter(model.filter);
                    } else this.setFilter(null);
                }
            };
        },

        doesFilterPass: function(params) {
            var valTmp = this.valueGetter(params);

            if (!this.filterSelect) {
                return true;
            } else {
                return (valTmp == this.filterSelect);
            }

        },
    }

    return SelectFilter;
});
