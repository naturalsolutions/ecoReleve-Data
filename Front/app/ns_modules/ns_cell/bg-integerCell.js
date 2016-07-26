define([
  'jquery',
  'underscore',
  'backgrid'
], function(
  $,_, Backgrid
){
  'use strict';
  return Backgrid.IntegerCell = Backgrid.IntegerCell.extend({
    orderSeparator:' ',
    });
});