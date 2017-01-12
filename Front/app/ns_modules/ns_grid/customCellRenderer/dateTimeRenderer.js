define([

], function() {

  'use strict';
  function dateTimeRenderer(params) {
  }
  var dateTimeRenderer = function(params){

    var valueDate = params.data[params.column.colId];
    var displayDate = '';
    if (valueDate !== null && valueDate !== ''){
      var hours_ = valueDate.split(' ');
      var date_ = hours_[0].split('-');
      displayDate = date_[2]+'/'+date_[1]+'/'+date_[0]+' '+hours_[1];
    }
    return displayDate;
  };
  return dateTimeRenderer;
});
