define([
    'jquery','autocompTree',
], function( $, autocompTree) {

    'use strict';

    function SelectFilter() {}

    SelectFilter.prototype = {
        init: function(params) {
            var _this = this;
            var apply = "Apply Filter";
            var clear = "Clear";
            var placeholder = "Input thésau";

            this.eGui = document.createElement('div');
            this.eGui.innerHTML =
                '<div class="js-select">' +
                '<input type="text" class="ag-filter-filter js-autocomp-input form-control input-sm" id="prout" placeholder="'+placeholder+'">'+
                '</div>' +
                '<div class="ag-filter-apply-panel" id="applyPanel">' +
                '<button class="btn btn-block" type="button" id="applyButton">' + apply + '</button>' +
                '<div class="bottom clearfix" />' +
                '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="reneco reneco-close">close</span> ' + clear + '</button>' +
                '</div>';
            this.$eGui = $(this.eGui);


            this.cleanBtn = this.eGui.querySelector('#cleanBtn');
            this.$autoComp = this.eGui.querySelector('.js-autocomp-input');
            this.cleanBtn.addEventListener('click', this.dateClean.bind(this));
            this.filterThesau = null;

            this.applyActive = true;
            this.filterChangedCallback = params.filterChangedCallback;
            this.filterModifiedCallback = params.filterModifiedCallback;
            this.valueGetter = params.valueGetter;


            $(this.$autoComp).autocompTree({
                wsUrl: "http://localhost/ThesaurusCore/api/Thesaurus",
                webservices: 'fastInitForCompleteTree',
                language: { hasLanguage: true, lng: "fr" },
                display: {
                    isDisplayDifferent: false,
                    // suffixeId: '_value',
                    // displayValueName: "valueTranslated",
                    // storedValueName: "fullpath"
                },
                inputValue: null,
                startId: "204089",
                timeout: undefined,

                onItemClick: function (options) {
                    _this.onFilterChanged();

                }
            });

            this.createGui();
        },

        dateClean: function() {
            $(this.$autoComp).val("");

            this.onFilterChanged();
            this.filterChangedCallback();
            if ($('.ag-filter').length) {
                $('body').trigger('click'); // simule un clique sur le body fermera le popup :p
            }
        },

        afterGuiAttached: function() {
            var self = this;
            $(this.$autoComp).on("changeThe", function(e) {
                self.onFilterChanged();
            })
        },

        isFilterValid: function() {
            var optSel = $(this.$autoComp).val();
            var isValid = (optSel != "")
            return isValid;
        },

        onFilterChanged: function() {
            this.filterThesau = $(this.$autoComp).val()
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
            return this.filterThesau;
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
                            filter: that.filterThesau
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

            if (!this.filterThesau) {
                return true;
            } else {
                return (valTmp == this.filterThesau);
            }

        },
    }

    return SelectFilter;
});
