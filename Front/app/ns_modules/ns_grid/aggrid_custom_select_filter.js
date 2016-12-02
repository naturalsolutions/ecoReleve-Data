define([
    'jquery',
], function($) {

    'use strict';

    function SelectFilter() {}

    SelectFilter.prototype = {
        init: function(params) {
            var _this = this;
            var apply = "APPLY";
            var clear = "CLEAR";

            this.eGui = document.createElement('div');
            this.eGui.innerHTML =
                '<div class="js-select">' +
                '<select class="ag-filter-filter js-select-filter" name="selectedVal">' +
                '<option value=""></option>' +
                '</select>' +
                '</div>' +
                '<div class="ag-filter-apply-panel" id="applyPanel">' +
                '<button class="btn btn-lg btn-block btn-filter" type="button" id="applyButton">' + apply + '</button>' +
                '<div class="bottom clearfix" />' +
                '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="icon material-icon">close</span>' + clear + '</button>' +
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
            for (var i = 0; i < params.filterParams.selectList.length; i++) {
                $(_this.$select).append('<option value="' + params.filterParams.selectList[i].value + '">' + params.filterParams.selectList[i].label + '</option>')
            }

            this.createGui();
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
            var optSel = $(this.$select).val();
            var isValid = (optSel > 0)
            return isValid;
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
