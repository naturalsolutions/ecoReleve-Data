define([
  'jquery',
  'backbone',
  'backbone-forms',

], function(
  $, Backbone, Form
){
  'use strict';
  Form.editors.Number.prototype.initialize = function(options) {
      Form.editors.Text.prototype.initialize.call(this, options);

      console.log(options);

      var schema = this.schema;

      this.$el.attr('type', 'number');

      if (!schema || !schema.editorAttrs || !schema.editorAttrs.step) {
        // provide a default for `step` attr,
        // but don't overwrite if already specified
        this.$el.attr('step', 'any');
      }
    };
    
/*    onKeyPress: function(event) {
      var self = this,
          delayedDetermineChange = function() {
            setTimeout(function() {
              self.determineChange();
            }, 0);
          };

      //Allow backspace
      if (event.charCode === 0) {
        delayedDetermineChange();
        return;
      }

      //Get the whole new value so that we can prevent things like double decimals points etc.
      var newVal = this.$el.val()
      if( event.charCode != undefined ) {
        newVal = newVal + String.fromCharCode(event.charCode);
      }

      var numeric = /^\-?[0-9]*\.?[0-9]*?$/.test(newVal);

      if (numeric) {
        delayedDetermineChange();
      } else {
        event.preventDefault();
      }
    },*/
  // });
});
