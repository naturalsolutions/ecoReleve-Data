define([
 'underscore',
 'jquery',
 'backbone',
 'backbone-forms',
], function (
 _, $, Backbone, Form) {
    'use strict';
    return Form.editors.LatitudeEditor = Form.editors.Number.extend({

  defaultValue: '',
  events:{
    'keyup':'onKeyUp',
    'keydown':'onKeyPress'
  },

  initialize: function(options) {
    Form.editors.Number.prototype.initialize.call(this, options);

    var schema = this.schema;

    this.$el.attr('type', 'number');

    if (!schema || !schema.editorAttrs || !schema.editorAttrs.step) {
      //this.$el.attr('step', 'any');
      this.$el.attr('min', -90);
      this.$el.attr('max', 90);
    }
  },

  /**
   * Check value is numeric
   */
  onKeyPress: function(event) {
    this.oldValue = this.$el.val();
  },

    /**
   * Check value is numeric ==> onKeyUp is better
   */
  onKeyUp : function(e){
    var self = this,
        delayedDetermineChange = function() {
          setTimeout(function() {
            self.determineChange();
          }, 0);
        };
    console.log(e)
    var newVal = this.$el.val();
    var numeric = /^\-?[^\-][0-9]*\.?[0-9]{0,5}$/.test(newVal);

    if (!numeric){
      if (e.keyCode!=8 && e.keyCode != 110 && this.oldValue!='') {
        this.$el.val(this.oldValue);
      }
    }

    if (newVal > 90 || newVal <-90 ){
      if (newVal+90 <0){
        this.$el.val(-90);
      }
      else{
        this.$el.val(90);
      }
      this.$el.addClass('error');
    } else {
      this.$el.removeClass('error');
    }
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



