
define([
  'jquery',
  'dateTimePicker',
  'moment'
], function($, datetimepicker,moment) {

  'use strict';
  function DateFilter() {
  }

  DateFilter.prototype = {
    /**************************************   MANDORTY METHOD  **************************************/
    init : function (params) {
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
      var apply = "Apply Filter";
      var clear = "Clear";
      var placeholderFrom = "date de début";
      var placeholderTo =  "date de fin";
      this.eGui = document.createElement('div');
      this.eGui.innerHTML =
      '<div class="js-datefrom">'+
        '<input type="text" class="ag-filter-filter js-datefrom-input form-control input-sm" name="from" placeholder="'+placeholderFrom+'">'+
      '</div>'+
      '<div class="js-dateto">'+
        '<input type="text" class="ag-filter-filter js-dateto-input form-control input-sm" name="to" placeholder="'+placeholderTo+'">'+
      '</div>'+
      '<div class="ag-filter-apply-panel" id="applyPanel">' +
        '<button class="btn btn-block" type="button" id="applyButton">' + apply + '</button>' +
        '<div class="bottom clearfix" />'+
        '<button class="btn btn-link btn-xs pull-right" type="button" id="cleanBtn"><span class="reneco reneco-close"></span> ' + clear + '</button>'+
      '</div>';
      this.$eGui = $(this.eGui);

      this.dateFrom = this.eGui.querySelector('.js-datefrom-input');
      this.dateTo = this.eGui.querySelector('.js-dateto-input');

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

      this.cleanBtn = this.eGui.querySelector('#cleanBtn');
      this.cleanBtn.addEventListener('click', this.dateClean.bind(this));
      this.filterDate = null;

      this.applyActive = true;
      this.filterChangedCallback = params.filterChangedCallback;
       this.filterModifiedCallback = params.filterModifiedCallback;
       this.valueGetter = params.valueGetter;
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

      this.createGui();
    },

    dateClean : function() {
      this.dateFrom.value = "";
      this.dateTo.value = "";
      $(this.dateFrom).data().DateTimePicker.date(null);;
      this.onFilterChanged();
      this.filterChangedCallback();
      if ( $('.ag-filter').length ) {
        $('body').trigger('click'); // simule un clique sur le body fermera le popup :p
      }
    },

    afterGuiAttached : function() {

    },

    isFilterValid : function() {
      var from = $(this.dateFrom).data("DateTimePicker").date();
      var to = $(this.dateTo).data("DateTimePicker").date();
      var isValid = (!from || !to) || from <= to;
      var $container = $(this.eGui).parent();
      if (isValid) {
        $container.removeClass('has-error');
      } else {
        $container.addClass('has-error');
      }

      return isValid;
    },

    onFilterChanged: function () {
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
      this.filterDate = {
        "dateFrom" : dateFrom,
        "dateTo" : dateTo
      };
      this.filterChanged();
    },

    filterChanged: function() {
      this.filterModifiedCallback();
      if (!this.applyActive) {
        this.filterChangedCallback();
      }
    },

    getGui : function () {
      return this.eGui;
    },

    createGui : function () {
      this.setupApply();
    },

    isFilterActive : function () {
      return this.filterDate && (this.filterDate.dateFrom || this.filterDate.dateTo);
    },

    setupApply : function () {
      var _this = this;
      if (this.applyActive) {
        this.eApplyButton = this.eGui.querySelector('#applyButton');
        this.eApplyButton.addEventListener('click', function () {
          if (_this.isFilterValid()) {
            _this.filterChangedCallback();
          }
        });
      }
    },

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
    },

    getDateFormat: function(val){
      var formats = ['DD/MM/YYYY HH:mm:ss','YYYY-MM-DD HH:mm:ss','YYYY-MM-DD HH:mm','DD/MM/YYYY HH:mm'];
      var result = formats.filter(function(format){
        return moment(val,format, true).isValid();
      });
      return result[0];
    },

    doesFilterPass : function (params) {
      var valTmp = this.valueGetter(params);
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
    },
}

  return DateFilter;
});
