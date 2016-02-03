define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone-forms',

  ], function ($, _, Backbone, Marionette, Form, List, tpl) {

    'use strict';
    return Form.editors.ListOfNestedModel = Form.editors.Base.extend({
        events: {
            'click #addFormBtn' : 'addEmptyForm',
        },
        initialize: function(options) {
            if (options.schema.validators.length) {
                this.defaultRequired = true;
            } else {
                options.schema.validators.push('required');
                this.defaultRequired = false;
            }

            Form.editors.Base.prototype.initialize.call(this, options);

            this.template = options.template || this.constructor.template;
            this.options = options;
            this.options.schema.fieldClass = 'col-xs-12';
            this.forms = [];
            this.disabled = options.schema.editorAttrs.disabled;
            this.hidden = '';
            if(this.disabled) {
                this.hidden = 'hidden';
            }
            this.hasNestedForm = true;

            var key = this.options.key;
            this.defaultValue = this.options.model.schema[key].defaultValue['FK_ProtocoleType'];
        },

        //removeForm
        deleteForm: function() {

        },

        addEmptyForm: function() {
            var model = new Backbone.Model();
            model.schema = this.options.schema.subschema;
            model.fieldsets = this.options.schema.fieldsets;

            this.addForm(model);
        },

        addForm: function(model){
            var _this = this;
            var form = new Backbone.Form({
                model: model,
                fieldsets: model.fieldsets,
                schema: model.schema
            }).render();

            this.forms.push(form);

            if(!this.defaultRequired){
                form.$el.find('fieldset').append('\
                    <div class="' + this.hidden + ' col-xs-12 control">\
                        <button type="button" class="btn btn-warning pull-right" id="remove">-</button>\
                    </div>\
                ');
                form.$el.find('button#remove').on('click', function() {
                  _this.$el.find('#formContainer').find(form.el).remove();
                  var i = _this.forms.indexOf(form);
                  if (i > -1) {
                      _this.forms.splice(i, 1);
                  }
                  return;
                });
            }


            this.$el.find('#formContainer').append(form.el);
        },

        render: function() {
            //Backbone.View.prototype.initialize.call(this, options);
            var $el = $($.trim(this.template({
                hidden: this.hidden
            })));
            this.setElement($el);
            //init forms
            var model = new Backbone.Model();
            model.schema = this.options.schema.subschema;
            model.fieldsets = this.options.schema.fieldsets;
            var key = this.options.key;
            var data = this.options.model.attributes[key];

            if (data) {
                if (data.length) {
                    for (var i = 0; i < data.length; i++) {
                        model.attributes = data[i];
                        this.addForm(model);
                        this.defaultRequired = false;
                    };
                } else {
                    if(this.defaultRequired){
                        this.addEmptyForm();
                        this.defaultRequired = false;
                    }
                }
            }

            return this;
        },

        getValue: function() {
            var errors = false;
            for (var i = 0; i < this.forms.length; i++) {
                if (this.forms[i].commit()) {
                    errors = true;
                }
            };
            if (errors) {
                return false;
            } else {
                var values = [];
                for (var i = 0; i < this.forms.length; i++) {
                    var tmp = this.forms[i].getValue();
                    var empty = true;
                    for (var key in tmp) {
                        if(tmp[key]){
                            empty = false;
                        }
                    }
                    if(!empty){
                        if (this.defaultValue) {
                            tmp['FK_ProtocoleType'] = this.defaultValue;
                        }
                        values[i] = tmp;
                    }
                };
                return values;
            }


        },
        }, {
          //STATICS
          template: _.template('\
            <div class="required nested clearfix">\
                <button type="button" id="addFormBtn" class="<%= hidden %> btn pull-right">+</button>\
                <div class="clear"></div>\
                <div id="formContainer" class="clearfix"></div>\
                <br />\
                <button type="button" id="addFormBtn" class="<%= hidden %> btn pull-right">+</button>\
            </div>\
            ', null, Form.templateSettings),
      });

});
