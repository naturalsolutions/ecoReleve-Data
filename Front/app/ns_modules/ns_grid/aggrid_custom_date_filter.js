define([
  'jquery',
  '../ns_modules/ns_bbfe/bbfe-timePicker',
], function($, TimePicker) {

  'use strict';
  function DateFilter() {
  }

  DateFilter.prototype = {
    /**************************************   MANDORTY METHOD  **************************************/
    init : function (params) {
      var apply = "APPLY";
      var clear = "CLEAR";
      var placeholderFrom = "date de début";
      var placeholderTo =  "date de fin";
      this.eGui = document.createElement('div');
      this.eGui.innerHTML =
      '<div>' +
        '<select class="ag-filter-select" id="filterType">' +
          '<option value="1">[EQUALS]</option>' +
          '<option value="2">[NOT EQUAL]</option>' +
          '<option value="3">[LESS THAN]</option>' +
          '<option value="4">[LESS THAN OR EQUAL]</option>' +
          '<option value="5">[GREATER THAN]</option>' +
          '<option value="6">[GREATER THAN OR EQUAL]</option>' +
        '</select>' +
      '</div>' +
      '<div class="js-datefrom">'+
        '<input type="text" class="ag-filter-filter js-datefrom-input" name="from" placeholder="'+placeholderFrom+'">'+
      '</div>'+
      '<div class="js-dateto">'+
        '<input type="text" class="ag-filter-filter js-dateto-input"name="to" placeholder="'+placeholderTo+'">'+
      '</div>'+
      '<div class="ag-filter-apply-panel" id="applyPanel">' +
        '<button class="btn btn-lg btn-block btn-filter" type="button" id="applyButton">'+apply+'</button>' +
        '<div class="bottom clearfix" />'+
        '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="icon material-icon">close</span>' + clear + '</button>'+
      '</div>'+
      '</div>';
      this.$eGui = $(this.eGui);
      var timepick = new timePicker();

      this.dateFrom = this.eGui.querySelector('.js-datefrom-input');
      this.dateTo = this.eGui.querySelector('.js-dateto-input');
      this.eTypeSelect = this.eGui.querySelector("#filterType");

      this.cleanBtn = this.eGui.querySelector('#cleanBtn');
      this.cleanBtn.addEventListener('click', this.dateClean.bind(this));

      //this.filterActive = false;
      this.applyActive = true;
      this.filterChangedCallback = params.filterChangedCallback;
      this.filterModifiedCallback = params.filterModifiedCallback;
      this.valueGetter = params.valueGetter;

      this.createGui();
    },

    getGui : function () {
      return this.eGui;
    },
    isFilterActive : function () {
      return this.filterActive;
    },
    doesFilterPass : function (params) {
      console.log(params);
      //return params.data.year >= 2010;
    },
    getModel : function() {
      console.log(this.eTypeSelect);
      console.log("date from",this.dateFrom.value);
      console.log("operator", $('#filterType option:selected').text());
      console.log("date to ",this.dateTo.value);
      //var model = {value: this.rbSince2010.checked};
    //  return model;
    },
    setModel : function(model) {
      console.log(model);
      //this.rbSince2010.checked = model.value;
    },

    /**************************************   OPTIONAL METHOD  **************************************/
    createGui : function () {
      this.setupApply();
    },

    isFilterValid : function() {
      console.log("bim");
      // var from = $(this.dateFrom).data("DateTimePicker").date();
      // var to = $(this.dateTo).data("DateTimePicker").date();
      // var isValid = (!from || !to) || from <= to;
      // var $container = $(this.eGui).parent();
      // if (isValid) {
      //   $container.removeClass('has-error');
      // } else {
      //   $container.addClass('has-error');
      // }
      //
      // return isValid;
      return true;
    },

    setupApply : function () {
      var _this = this;
      if (this.applyActive) {
        this.eApplyButton = this.eGui.querySelector('#applyButton');
        this.eApplyButton.addEventListener('click', function () {
          _this.getModel();
          if (_this.isFilterValid()) {
            _this.filterChangedCallback();
          }
        });
      }
    },

    dateClean : function() {
      this.dateFrom.value = "";
      this.dateTo.value = "";
      var tabToClean = this.$eGui.find('input')
      console.log(tabToClean);
      // for (var tmp of tabToClean ) {
      //   console.log(tmp);
      // }

      // this.onFilterChanged();
        // this.filterChangedCallback();
        if ( $('.ag-filter').length ) {
          $('body').trigger('click'); // simule un clique sur le body fermera le popup :p
        }
      },

  // onRbChanged = function () {
  //     this.filterActive = this.rbSince2010.checked;
  //     this.filterChangedCallback();
  // };

  getApi : function() {
    var that = this;
    return {
      getModel: function() {
        if (that.isFilterActive()) {
          return {
            type: 1,
            filter: that.filterDate
          };
        }
        else {
          return null;
        }
      },
      setModel: function(model) {
        if(model){
          this.setType(model.type);
          this.setFilter(model.filter);
        }
        else this.setFilter(null);
      }
    };
  }









}

  return DateFilter;
});

// var DateFilter = (function () {
//
//     function DateFilter() {
//     }
//
  //   DateFilter.prototype.init = function (params) {
  //     var apply = "APPLY";
  //     var clear = "CLEAR";
  //     var placeholderFrom = "date de début";
  //     var placeholderTo =  "date de fin";
  //     this.eGui = document.createElement('div');
  //     this.eGui.innerHTML =
  //     '<div class="js-datefrom">'+
  //       '<input type="text" class="ag-filter-filter js-datefrom-input" name="from" placeholder="'+placeholderFrom+'">'+
  //     '</div>'+
  //     '<div class="js-dateto">'+
  //       '<input type="text" class="ag-filter-filter js-dateto-input"name="to" placeholder="'+placeholderTo+'">'+
  //     '</div>'+
  //     '<div class="ag-filter-apply-panel" id="applyPanel">' +
  //       '<p class="help">'+ i18n.t('grid.invalidDateRange') +'</p>' +
  //       '<button class="btn btn-lg btn-block btn-filter" type="button" id="applyButton">'+apply+'</button>' +
  //       '<div class="bottom clearfix" />'+
  //       '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="icon material-icon">close</span>' + clear + '</button>'+
  //     '</div>'+
  //     '</div>';
  //     this.cleanBtn = this.eGui.querySelector('#cleanBtn');
  //     this.cleanBtn.addEventListener('click', this.dateClean.bind(this));
  //
  //     this.filterActive = false;
  //     this.filterChangedCallback = params.filterChangedCallback;
  //     this.valueGetter = params.valueGetter;
  // };
  //
  // DateFilter.prototype.getGui = function () {
  //   return this.eGui;
  // };
  //
  // // DateFilter.prototype.onRbChanged = function () {
  // //     this.filterActive = this.rbSince2010.checked;
  // //     this.filterChangedCallback();
  // // };
  //
  //
  // DateFilter.prototype.doesFilterPass = function (params) {
  //     return params.data.year >= 2010;
  // };
  //
  // DateFilter.prototype.isFilterActive = function () {
  //     return this.filterActive;
  // };
  //
  // DateFilter.prototype.getModel = function() {
  //     var model = {value: this.rbSince2010.checked};
  //     return model;
  // };
  //
  // DateFilter.prototype.setModel = function(model) {
  //     this.rbSince2010.checked = model.value;
  // };
//
//     return DateFilter;
// })();
// //exports.DateFilter = DateFilter;
