define([
  'jquery',
  'backbone',
  'backbone-forms'

], function (
  $, Backbone, Form
) {
  'use strict';

  return Form.editors.Select = Form.editors.Select.extend({
    getValue: function () {
      var val = this.$el.val();
      if (val == -1) {
        return '';
      }
      return this.$el.val();
    }
  });
});
