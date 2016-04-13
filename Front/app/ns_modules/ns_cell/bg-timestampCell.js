define([
  'jquery',
  'underscore',
  'backgrid'
], function(
  $,_, Backgrid
){
  'use strict';
  return Backgrid.TimestampCell = Backgrid.StringCell.extend({
    className: "timestamp-cell",

    formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
          fromRaw: function(rawValue, model) {
            if (rawValue!=null){
              var dd = new Date(rawValue*1000);
              var displayDate = ("0" + dd.getDate()).slice(-2)+'/'+("0" + (dd.getMonth()+ 1)).slice(-2)+'/'+dd.getFullYear()+' '+("0" + dd.getHours()).slice(-2)+':'+("0" + dd.getMinutes()).slice(-2);
              return displayDate;
            } else {
              return '';
            }
          }
        }),
    });
});
