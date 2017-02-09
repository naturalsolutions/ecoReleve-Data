define([
  'moment'
], function (moment) {
  'use strict';

  function dateTimeRenderer(params) {
  }

  var dateTimeRenderer = function (params) {
    var valueDate = params.data[params.column.colId];
    var formats = ['DD/MM/YYYY HH:mm:ss',
      'DD/MM/YYYY HH:mm',
      'DD/MM/YYYY',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD'
    ];
    var result = formats.filter(function (format) {
      return moment(valueDate, format, true).isValid();
    });
    var displayDate = '';
    if (valueDate !== null && valueDate !== '') {
      displayDate = moment.utc(valueDate, result[0]).format('DD/MM/YYYY HH:mm:ss');
    }
    return displayDate;
  };
  return dateTimeRenderer;
});
