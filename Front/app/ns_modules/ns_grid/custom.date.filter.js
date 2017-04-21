
define([
  'jquery',
  'dateTimePicker',
  'moment',
  'i18n'
], function($, datetimepicker,moment) {
  var EQUALS = 'equals';
  var NOT_EQUAL = 'notEqual';
  var LESS_THAN = 'lessThan';
  var LESS_THAN_OR_EQUAL = 'lessThanOrEqual';
  var GREATER_THAN = 'greaterThan';
  var GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual';
  var IN_RANGE = 'inRange';

  var template = '<div class="js-datefrom">'+
    '<input type="text" class="ag-filter-filter js-datefrom-input form-control input-sm" name="from" placeholder="'+i18n.translate('aggrid.filter.placeholder.date')+'">'+
  '</div>'+
  '<div class="js-dateto">'+
    '<input type="text" class="ag-filter-filter js-dateto-input form-control input-sm" name="to" placeholder="'+i18n.translate('aggrid.filter.placeholder.dateTo')+'">'+
  '</div>'+
  '<div class="ag-filter-apply-panel" id="applyPanel">' +
    '<button class="btn btn-block" type="button" id="applyButton">'+i18n.translate('aggrid.filter.btn.apply')+'</button>' +
    '<div class="bottom clearfix" />'+
    '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="reneco reneco-close"></span> '+i18n.translate('aggrid.filter.btn.clear')+'</button>'+
  '</div>';

  'use strict';
  function DateFilter() {
  };

  DateFilter.EQUALS = 'equals'; // 1;
  DateFilter.NOT_EQUAL = 'notEqual'; //2;
  DateFilter.LESS_THAN = 'lessThan'; //3;
  DateFilter.LESS_THAN_OR_EQUAL = 'lessThanOrEqual'; //4;
  DateFilter.GREATER_THAN = 'greaterThan'; //5;
  DateFilter.GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual'; //6;
  DateFilter.IN_RANGE = 'inRange'; //7

  DateFilter.prototype.init = function (params) {
    this.filterParams = params;
    this.applyActive = params.apply === true;
    this.newRowsActionKeep = params.newRowsAction === 'keep';
    this.filterDate = null;
    this.filterType = DateFilter.EQUALS;
    this.createGui();
  };

  DateFilter.prototype.getGui = function () {
    return this.templateDiv;
  };

  DateFilter.prototype.isFilterActive = function () {
    if (this.filterType === DateFilter.IN_RANGE) {
        return this.filterDate.dateFrom != null && this.filterDate.dateTo != null;
    }
    else {
        return this.filterDate != null;
    }
  };

  DateFilter.prototype.doesFilterPass = function (params) {
    var valTmp = this.filterParams.valueGetter(params.node);
    var format = this.getDateFormat(valTmp);
    valTmp = moment(valTmp,format).unix();

    if (!this.filterDate) {
      return true;
    } else if ( this.filterDate.dateFrom && this.filterDate.dateTo  ) {
      return (valTmp >= this.filterDate.dateFrom && valTmp <= this.filterDate.dateTo);
    }else if( this.filterDate.dateFrom ) {
      return valTmp >= this.filterDate.dateFrom;
    }else if (this.filterDate.dateTo) {
      return valTmp <= this.filterDate.dateTo;
    }else {
      return false;
    }
  };

  DateFilter.prototype.createGui = function () {
    this.templateDiv = document.createElement("div")
    this.templateDiv.innerHTML = template;
    this.eTypeSelect = this.getGui().querySelector("#filterType");
    this.cleanBtn =  this.getGui().querySelector('#cleanBtn');
    this.cleanBtn.addEventListener('click', this.clean.bind(this));

    this.$eGui = $(this.getGui());

    this.dateFrom = this.getGui().querySelector('.js-datefrom-input');
    this.dateTo = this.getGui().querySelector('.js-dateto-input');

    this.datetimepickerOptions = {
      /*locale : "fr",*/
      format      : "DD/MM/YYYY HH:mm",
      useCurrent  : false,
      showClose   : true,

      //debug: true,
      widgetPositioning: {
        horizontal: 'auto',
        vertical: 'bottom'
      }

      //focusOnShow : false
    }

    var self = this;

    $( this.dateFrom ).datetimepicker(self.datetimepickerOptions);
    $( this.dateTo ).datetimepicker(self.datetimepickerOptions);

    $(this.dateFrom ).on("mousedown", function() {
      var test = $(this).siblings('.bootstrap-datetimepicker-widget')
      if( !test.length  ) {
        $(self.dateFrom ).blur();
        $(self.dateFrom ).focus();
      }
    });
    $(this.dateTo ).on("mousedown", function() {
      var test = $(this).siblings('.bootstrap-datetimepicker-widget')
      if( !test.length  ) {
        $(self.dateTo ).blur();
        $(self.dateTo ).focus();
      }
    });
    $(this.dateFrom ).on("dp.show", function() {
      var positionHG =  $( self.dateFrom ).offset(); //pos coin haut gauche input
      var heightBtn =  $( self.dateFrom ).outerHeight(); // height input
      var widthBtn = $( self.dateFrom ).outerWidth();
      var positionBG = positionHG.top + heightBtn;
      var sizeScreen = {
                          height :$(window).height(),
                          width : $(window).width()
      };
      var datepicker = $(this).siblings('.bootstrap-datetimepicker-widget');
     var  datePickerHeight = datepicker.outerHeight();
     var  datePickerWidth = datepicker.outerWidth();
     if( (datePickerWidth+positionHG.left) > sizeScreen.width  ) { //depasse a droite
       if(!datepicker.hasClass('pull-right')) {
         datepicker.addClass('pull-right');
       }
       datepicker.css({
         'left' : "auto",
         'right': sizeScreen.width - (positionHG.left + widthBtn)
       });
     } else {
       if(datepicker.hasClass('pull-right')) {
         datepicker.removeClass('pull-right');
       }
     }
     if( datePickerHeight + positionBG > sizeScreen.height ) {
       if(datepicker.hasClass('bottom')) {
         datepicker.removeClass('bottom');
         datepicker.addClass('top');
       }
       datepicker.css({
         'position' : 'fixed',
         'top' : positionHG.top - (datePickerHeight + 4) ,
         'left' : "auto",
       });
     } else {
       datepicker.css({
         'position' : 'fixed',
         'top' : positionBG ,
         'left' : "auto"
       });
     }
    });
    $(this.dateTo ).on("dp.show", function() {
      var positionHG =  $( self.dateTo ).offset(); //pos coin haut gauche input
      var heightBtn =  $( self.dateTo ).outerHeight(); // height input
      var widthBtn = $( self.dateTo ).outerWidth();
      var positionBG = positionHG.top + heightBtn;
      var sizeScreen = {
                          height :$(window).height(),
                          width : $(window).width()
      };
      var datepicker = $(this).siblings('.bootstrap-datetimepicker-widget');
     var  datePickerHeight = datepicker.outerHeight();
     var  datePickerWidth = datepicker.outerWidth();
     if( (datePickerWidth+positionHG.left) > sizeScreen.width  ) { //depasse a droite
       if(!datepicker.hasClass('pull-right')) {
         datepicker.addClass('pull-right');
       }
       datepicker.css({
         'left' : "auto",
         'right': sizeScreen.width - (positionHG.left + widthBtn)
       });
     } else {
       if(datepicker.hasClass('pull-right')) {
         datepicker.removeClass('pull-right');
       }
     }
     if( datePickerHeight + positionBG > sizeScreen.height ) {
       if(datepicker.hasClass('bottom')) {
         datepicker.removeClass('bottom');
         datepicker.addClass('top');
       }
       datepicker.css({
         'position' : 'fixed',
         'top' : positionHG.top - (datePickerHeight + 4),
         'left': "auto"
       });
     }
     else {
       datepicker.css({
         'position' : 'fixed',
         'top' : positionBG ,
         'left': "auto"
       });
     }


    });
    $(this.dateFrom).on("dp.change", function (e) {
      $(this).data('DateTimePicker').hide();
      self.onFilterChanged();
    });
    $(this.dateTo).on("dp.change", function (e) {
      $(this).data('DateTimePicker').hide();
      self.onFilterChanged();
    });




    this.setupApply();
  };

  DateFilter.prototype.onFilterChanged = function () {
    var dateFrom = null;
    var dateTo = null;
    var format;
    if(this.dateFrom.value !== "") {
      format = this.getDateFormat(this.dateFrom.value);
      dateFrom = moment(this.dateFrom.value, format).unix();//moment(this.dateFrom.value, this.dateFormat).toDate();
    }
    else{
      dateFrom = "";
    }
    if(this.dateTo.value !== "") {
      format = this.getDateFormat(this.dateTo.value);
      dateTo = moment(this.dateTo.value,format).unix();//moment(this.dateTo.value, this.dateFormat).toDate();
    }
    else {
      dateTo = "";
    }
    if( dateFrom == '' && dateTo == '') {
      this.filterDate = null;
    }
    else {
      this.filterDate = {
        "dateFrom" : dateFrom,
        "dateTo" : dateTo
      };
    }
    this.filterChanged();
  };

  DateFilter.prototype.filterChanged = function () {
    this.filterParams.filterModifiedCallback();
    if (!this.applyActive) {
        this.filterParams.filterChangedCallback();
    }
  };

  DateFilter.prototype.onTypeChanged = function () {
      this.filterType = this.eTypeSelect.value;
      this.filterChanged();
  };

  DateFilter.prototype.setupApply = function () {
    var _this = this;
    if (this.applyActive) {
      this.eApplyButton = this.getGui().querySelector('#applyButton');
      this.eApplyButton.addEventListener('click', function() {
        _this.filterParams.filterChangedCallback();
      });
    }
  };

  DateFilter.prototype.getModel = function () {
    var _this = this;
    if (this.isFilterActive()) {
        return {
          type: 1,
          filter: _this.filterDate
        };
    }
    else {
        return null;
    }
  };

  DateFilter.prototype.setFilter = function (filter) {
    if (filter !== null && !(typeof filter === 'number')) {
        filter = parseFloat(filter);
    }
    this.filterDate.dateFrom = filter;
    this.dateFrom.value = filter;
  };

  DateFilter.prototype.setFilterTo = function (filter) {
    if (filter !== null && !(typeof filter === 'number')) {
        filter = parseFloat(filter);
    }
    this.filterDate.dateTo = filter;
    this.dateTo.value = filter;
  };

  DateFilter.prototype.setModel = function (model) {
    if (model) {
      this.setType(model.type);
      this.setFilter(model.filter);
      this.setFilterTo(model.filterTo);
    }
    else {
        this.setType(DateFilter.EQUALS);
        this.setFilter(null);
        this.setFilterTo(null);
    }
  };

  DateFilter.prototype.clean = function () {
      this.dateFrom.value = "";
      this.dateTo.value = "";
      $(this.dateFrom).data().DateTimePicker.date(null);;
      this.onFilterChanged();
      this.filterParams.filterChangedCallback();
  };

  DateFilter.prototype.getDateFormat = function (val) {
    var formats = ['DD/MM/YYYY HH:mm:ss','YYYY-MM-DD HH:mm:ss','YYYY-MM-DD HH:mm','DD/MM/YYYY HH:mm'];
    var result = formats.filter(function(format) {
      return moment(val,format, true).isValid();
    });
    return result[0];
  };

  return DateFilter;
});
