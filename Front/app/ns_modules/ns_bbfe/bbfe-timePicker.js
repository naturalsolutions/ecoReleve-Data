define([
  'jquery',
  'backbone',
  'backbone-forms',

], function(
  $, Backbone, Form
){
  'use strict';
  return Form.editors.TimePicker = Form.editors.Base.extend({


    previousValue: '',

    events: {
      'hide': "hasChanged"
    },

    hasChanged: function(currentValue) {
      if (currentValue !== this.previousValue){
        this.previousValue = currentValue;
        this.trigger('change', this);
      }
    },

    initialize: function(options) {
      Form.editors.Base.prototype.initialize.call(this, options);
      this.template = options.template || this.constructor.template;
      this.options = options;
    },

    getValue: function() {
      var val = this.$el.find('input:first').val();
      return val;
    },

    render: function(){
      var options = this.options;
      var schema = this.schema;
      var value;
      var required;


      if (options.schema.validators) {
        required = options.schema.validators[0];
      }
      if (options.model) {
        value = options.model.get(this.options.key);
      }else {
            if (options.value) {
              value = options.value;
            }else {
              value = '';
            }
      }

      var $el = $($.trim(this.template({
        value : value,
        editorClass : schema.editorClass,
        required: required,
        editable : (options.schema.editable != false) ? '' : 'disabled',
        hidden : (options.schema.editable != false) ? '' : 'hidden',
      })));
      this.setElement($el);

      $($el[0]).datetimepicker({
        format: 'LT'
      });

      return this;
    },
    }, {
    // STATICS
      template: _.template('<div class="input-group date" id="dateTimePicker" data-editors="Date_"><input id="c24_Date_" name="Date_" class="<%= editorClass %> <%= required %>" type="text" placeholder="hh:mm:ss" data-date-format="HH:mm:ss" value="<%= value %>" <%= editable %> ><span class="input-group-addon <%= hidden %>"><span class="glyphicon-time glyphicon"></span></span></div>', null, Form.templateSettings)
  });
});
