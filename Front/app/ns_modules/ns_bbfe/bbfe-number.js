define([
  'jquery',
  'backbone',
  'backbone-forms',

], function(
  $, Backbone, Form
){
  'use strict';
  return Form.editors.Number = Form.editors.Number.extend({
    defaultValue: '',

    //var lat = /^\-?([1-8]?[0-9]|[1-9]0)(\.[0-9]{0,6})?$/.test(newVal);
    //long = /^\-?([1]?[1-7][1-9]|[1]?[1-8][0]|[1-9]?[0-9])(\.[0-9]{0,6})?$/.test(newVal);
    initialize: function(options){
      Form.editors.Number.prototype.initialize.call(this, options);
      // this.options = options.schema.options;
      
    },
    // onKeyPress: function(event) {
    //   var self = this,
    //       delayedDetermineChange = function() {
    //         setTimeout(function() {
    //           self.determineChange();
    //         }, 0);
    //       };

    //   //Allow backspace
    //   if (event.charCode === 0) {
    //     delayedDetermineChange();
    //     return;
    //   }



    //   //Get the whole new value so that we can prevent things like double decimals points etc.
    //   var newVal = this.$el.val()
    //   if( event.charCode != undefined ) {
    //     newVal = newVal + String.fromCharCode(event.charCode);
    //   }

    //   var numeric = /^\-?[0-9]*\.?[0-9]*?$/.test(newVal);

    //   if (numeric) {
    //     delayedDetermineChange();
    //   } else {
    //     event.preventDefault();
    //   }
    // },
  });
});
