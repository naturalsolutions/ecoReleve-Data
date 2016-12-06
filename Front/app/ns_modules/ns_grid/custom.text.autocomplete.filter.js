define([
    'jquery',
], function($) {

    'use strict';
    var CONTAINS = 1;
    var EQUALS = 2;
    var NOT_EQUALS = 3;
    var STARTS_WITH = 4;
    var ENDS_WITH = 5;
    var IN = 7;

    function TextFilter() {}

    TextFilter.prototype = {
        init: function(params) {
            if (typeof(params.filterParams) === 'undefined' || typeof(params.filterParams.tabToOrder) === 'undefined') {
                console.error("Text filter autocom need filterParams : { tabToOder : ['string'] } ");
                return null;
            }
            var _this = this;
            var apply = "APPLY";
            var clear = "CLEAR";

            this.eGui = document.createElement('div');
            this.eGui.innerHTML =
                '<div class="js-autocomp">' +
                '<div>' +
                '<select class="ag-filter-select" id="filterType">' +
                '<option value="1">Contains</option>' +
                '<option value="2">Equals</option>' +
                '<option value="3">Not equals</option>' +
                '<option value="4">Starts with</option>' +
                '<option value="5">Ends with</option>' +
                '<option value="7">In</option>' +
                '</select>' +
                '</div>' +
                '<div>'+
                '<input type="text" class="ag-filter-filter js-text-input" >'+
                '</div>' +
                '<div class="ag-filter-apply-panel" id="applyPanel">' +
                '<button class="btn btn-lg btn-block btn-filter" type="button" id="applyButton">' + apply + '</button>' +
                '<div class="bottom clearfix" />' +
                '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="icon material-icon">close</span>' + clear + '</button>' +
                '</div>';
            this.$eGui = $(this.eGui);

            this.$autoComp = this.eGui.querySelector('.js-autocomp');
            this.$applyBtn = this.eGui.querySelector('#applyButton');
            this.cleanBtn = this.eGui.querySelector('#cleanBtn');
            this.$filterType = this.eGui.querySelector('#filterType');
            this.$autoComp = this.eGui.querySelector('.js-text-input');

            this.cleanBtn.addEventListener('click', this.dateClean.bind(this));
            this.$filterType.addEventListener("change", this.onTypeChanged.bind(this));
            this.filterSelect = null;
            this.filterAutocomp = {
              type : CONTAINS,
              text : null
            };


            this.applyActive = true;
            this.filterChangedCallback = params.filterChangedCallback;
            this.filterModifiedCallback = params.filterModifiedCallback;
            this.valueGetter = params.valueGetter;
            this.tabOrdered = params.filterParams.tabToOrder.sort();

            $( this.$autoComp ).autocomplete({
              source: function(req, responseFn) {
                  var re = $.ui.autocomplete.escapeRegex(req.term);
                  var matcher = new RegExp( "^" + re, "i" );
                  var a = $.grep( _this.tabOrdered, function(item,index){
                      return matcher.test(item);
                  });
                  responseFn( a );
              }
            });
            $(this.$autoComp).keydown(function(event){
              if(event.keyCode == 13) { //press enter
                $(_this.$autoComp).blur();
              }
           });
            this.params = params;

            this.createGui();
        },


        dateClean: function() {
            $(this.$autoComp).val("");
            this.filterAutocomp.text = null
            this.onFilterChanged();
            this.filterChangedCallback();
            if ($('.ag-filter').length) {
                $('body').trigger('click'); // simule un clique sur le body fermera le popup :p
            }
        },

        afterGuiAttached: function() {
            var self = this;
            $(this.$autoComp).on("change", function(e) {
                self.onFilterChanged();
            })
            $(this.$filterType).on("change", function(e) {
                self.onFilterChanged();
            })
        },

        isFilterValid: function() {
            var optSel = $(this.$autoComp).val();
            console.log(optSel);
            var isValid = (optSel > 0)
            console.log(isValid);
            return isValid;
        },

        onFilterChanged: function() {
            this.filterAutocomp.text = $(this.$autoComp).val().toLowerCase()
            this.filterChanged();
        },

        onTypeChanged: function() {
          this.filterAutocomp.type = parseInt($(this.$filterType).val());
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
            return this.filterAutocomp;
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
                            filter: that.filterAutocomp
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
            if (!this.filterAutocomp) {
              console.log("null");
                return true;
            }
            var valTmp = this.valueGetter(params);
            if( !valTmp ) {
              console.log("pas de val");
              return false;
            }
            var valTmpLowCase = valTmp.toString().toLowerCase();

            switch (this.filterAutocomp.type) {
                case CONTAINS:
                    console.log("contains");
                    return valTmpLowCase.indexOf(this.filterAutocomp.text) >= 0;
                case EQUALS:
                    console.log("equals");
                    return valTmpLowCase === this.filterAutocomp.text;
                case NOT_EQUALS:
                    console.log("not equals");
                    return valTmpLowCase != this.filterAutocomp.text;
                case STARTS_WITH:
                    console.log("start with");
                    return valTmpLowCase.indexOf(this.filterAutocomp.text) === 0;
                case ENDS_WITH:
                    console.log("end with");
                    var index = valTmpLowCase.lastIndexOf(this.filterAutocomp.text);
                    return index >= 0 && index === (valTmpLowCase.length - this.filterAutocomp.text.length);
                case IN:
                    console.log("in");
                    var tab = this.filterAutocomp.text.split(',');
                    if(tab.length <= 1){
                        tab = this.filterAutocomp.text.split(';');
                    }
                    if(tab.length <= 1){
                        tab = this.filterAutocomp.text.split(' ');
                    }

                    for (var i=0; i< tab.length; i++){
                        if ((tab[i].toLowerCase() == valTmpLowCase)) {
                            return true;
                        }
                    }
                    return false;
                default:
                    // should never happen
                    console.warn('invalid filter type ' + this.filterType);
                    return false;
            }

            //
            // else {
            //     return (valTmp == this.filterAutocomp);
            // }

        },
    }

    return TextFilter;
});
