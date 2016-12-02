define([

], function() {

  'use strict';
  function decimal5Renderer(params) {
  }
  var decimal5Renderer = function(params){
    return params.data[params.column.colId].toFixed(5);
  };
  return decimal5Renderer;
});
