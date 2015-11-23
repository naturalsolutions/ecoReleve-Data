define([
 'underscore',
 'jquery',
 'backbone',
 'backbone_forms',
], function (
 _, $, Backbone, Form) {
    'use strict';
    return Form.editors.LongitudeEditor = Form.editors.Number.extend({

  defaultValue: '',

  initialize: function(options) {
    Form.editors.Number.prototype.initialize.call(this, options);

    var schema = this.schema;

    this.$el.attr('type', 'number');

    if (!schema || !schema.editorAttrs || !schema.editorAttrs.step) {
      //this.$el.attr('step', 'any');
      this.$el.attr('min', -180);
      this.$el.attr('max', 180);
    }
  },

  /**
   * Check value is numeric
   */
  onKeyPress: function(event) {
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

    if (newVal > 180 || newVal <-180 ){
    	this.$el.val('');
    }
  },
  onKeyUp : function(){
  	//alert(this.val());
  },

  getValue: function() {
    var value = this.$el.val();

    return value === "" ? null : parseFloat(value, 10);
  },

  setValue: function(value) {
    value = (function() {
      if (_.isNumber(value)) return value;

      if (_.isString(value) && value !== '') return parseFloat(value, 10);

      return null;
    })();

    if (_.isNaN(value)) value = null;

    Form.editors.Number.prototype.setValue.call(this, value);
  }

});

});



