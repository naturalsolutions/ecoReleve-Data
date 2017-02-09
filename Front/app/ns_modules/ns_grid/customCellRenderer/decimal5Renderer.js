define([

], function () {
  'use strict';

  function decimal5Renderer(params) {
  }
  var decimal5Renderer = function (params) {
    var val = params.data[params.column.colId];

    var displayVal = '';
    if (val) {
      displayVal = val.toFixed(5);
    }
    return displayVal;
  };
  return decimal5Renderer;
});
