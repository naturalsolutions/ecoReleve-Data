define([
  'jquery',
  'underscore',
  'backgrid'
], function(
  $,_, Backgrid
){
  'use strict';
  return Backgrid.StringDateCell = Backgrid.StringCell.extend({
    className: "stringDate-cell",

    formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
          fromRaw: function(rawValue, model) {
            if (rawValue!=null && rawValue!=''){
              var hours_ = rawValue.split(' ');
              var date_ = hours_[0].split('-');
              var displayDate = date_[2]+'/'+date_[1]+'/'+date_[0]+' '+hours_[1];

              return displayDate;
            } else {
              return '';
            }
          }
        }),
    });
});
