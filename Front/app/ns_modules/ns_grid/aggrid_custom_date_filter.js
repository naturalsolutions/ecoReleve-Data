define([
  'jquery',
  '../ns_filter/filters',
  'moment'
], function($, NsFilter,moment) {

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
      '<div class="testbbfe">'+
      '</div>'+
      '<div class="ag-filter-apply-panel" id="applyPanel">' +
        '<button class="btn btn-lg btn-block btn-filter" type="button" id="applyButton">'+apply+'</button>' +
        '<div class="bottom clearfix" />'+
        '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="icon material-icon">close</span>' + clear + '</button>'+
      '</div>'+
      '</div>';
      this.$eGui = $(this.eGui);
      var testOptions = {
        schema: {
          "options": {
            "isInterval": 1
          },
          "validators": [],
          "type": "DateTimePickerEditor",
          "editable": true,
          "name": "StationDate",
          "label": "Date",
          "fieldClass": [
            "col-md-12"
          ],
          "title": "Date"
        }
      }

      var nsfilter = new NsFilter({});
      this.theform = nsfilter.initFilter(testOptions.schema,null);
      this.theform.render();

      this.cleanBtn = this.eGui.querySelector('#cleanBtn');
      this.cleanBtn.addEventListener('click', this.dateClean.bind(this));

      this.filterActive = false;
      this.applyActive = true;
      this.filterChangedCallback = params.filterChangedCallback;
      this.filterModifiedCallback = params.filterModifiedCallback;
      this.valueGetter = params.valueGetter;

      this.createGui();
    },

    afterGuiAttached : function() {
      $('.testbbfe').append(this.theform.el);
    },

    getGui : function () {
      return this.eGui;
    },
    isFilterActive : function () {
      return true;//this.filterActive;
    },
    doesFilterPass : function (params) {
      var valTmp = this.valueGetter(params);
      if (!this.filterModel) {
        return true;
      } else if ( this.filterModel.From && this.filterModel.To  ) {
        return (valTmp > this.filterModel.From && valTmp < this.filterModel.To);
      }else if( this.filterModel.From ) {
        return valTmp > this.filterModel.From;
      }else if (this.filterModel.To) {
        return valTmp < this.filterModel.To;
      }
    },
    getModel : function() {
      var value = this.theform.getValue();
      var model = {
        "From" : null,
        "To" : null,
      }
      if ( this.isFilterActive() ) {
        if ( value.From != '' ) {
          model.From = moment(value.From, "DD/MM/YYYY HH:mm:SS").unix();
        }
        if (value.To != '' ) {
          model.To = moment(value.To, "DD/MM/YYYY HH:mm:SS").unix();
        }
        //  console.log("test value bbfe",this.dateTimePick.getValue());
        //var model = {value: this.rbSince2010.checked};
        console.log(model);
        return model;
      }
      else {
        return model;
      }
    },
    setModel : function(model) {
      console.log(model);
      //this.rbSince2010.checked = model.value;
    },

    /**************************************   OPTIONAL METHOD  **************************************/
    createGui : function () {
      this.setupApply();
    },

    onFilterChanged: function () {
      console.log("onfilterchanged");
      this.getModel();
      this.filterChanged();
    },

    filterChanged: function() {
      //this.filterChangedCallback();
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
      return this.filterModel !== null;
    },

    setupApply : function () {
      var _this = this;
      this.filterActive = true;
      if (this.applyActive) {
        this.eApplyButton = this.eGui.querySelector('#applyButton');
        this.eApplyButton.addEventListener('click', function () {
          _this.filterModel = null;
          _this.filterModel = _this.getModel();
          if (_this.isFilterValid()) {
            _this.filterChangedCallback();
          }
        });
      }
    },

    dateClean : function() {
       var tabToClean =$("input[name='Date_']")
       for (var i=0 ; i < tabToClean.length ; i+=1) {
         $(tabToClean[i]).val('');
       }
       this.filterModel = null;
       this.filterActive = false;
        this.onFilterChanged();
        this.filterChangedCallback();
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
