define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone-forms',
  'backbone.list',
  'requirejs-text!./tpl-bbfe-listOfNestedModel.html',

  ], function ($, _, Backbone, Marionette, Form, List, tpl) {

    'use strict';
    return Form.editors.ListOfNestedModel = Form.editors.Base.extend({
        className: 'nested',
        events: {
            'click #addFormBtn' : 'addFormBtn',
        },
        initialize: function(options) {
            options.schema.validators.push('required');
            Form.editors.Base.prototype.initialize.call(this, options);
            this.template = options.template || this.constructor.template;
            console.log('options: ', options);
            this.options = options;
            this.forms = [];
        },

        //removeForm
        deleteForm: function() {

        },

        addFormBtn: function(e) {
            var model = new Backbone.Model();
            model.schema = this.options.schema.subschema;
            this.addForm(model);
        },

        addForm: function(model){
            var form = new Backbone.Form({
                model: model,
                fieldsets: model.fieldsets,
                schema: model.schema
            }).render();
            this.forms.push(form);
            this.$el.find('#formContainer').append(form.el);
        },

        render: function() {
            //Backbone.View.prototype.initialize.call(this, options);
            var $el = $($.trim(this.template({})));
            this.setElement($el);
            //init forms
            var model = new Backbone.Model();
            model.schema = this.options.schema.subschema;
            var key = this.options.key;
            var data = this.options.model.attributes[key];
            if (data) {
                if (data.length) {
                    for (var i = 0; i < data.length; i++) {
                        model.attributes = data[i];
                        this.addForm(model);
                    };
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
                var tmp = [];
                for (var i = 0; i < this.forms.length; i++) {
                    tmp[i] = this.forms[i].getValue();
                    tmp[i]['FK_ProtocoleType'] = 214;
                };
                return tmp;
            }
        },
        }, {
          //STATICS
          template: _.template('\
            <div class="required">\
            <button type="button" id="addFormBtn" class="btn pull-right">+</button>\
            <div id="formContainer">\
            </div>\
            </div>\
            ', null, Form.templateSettings),
      });

    /*
    var Form = Backbone.Form,
            editors = Form.editors;

    Backbone.Form.validators.subforms = function (options) {
        return function subforms(value) {
            var errors = _.map(options.field.items, function (item) {
                return item.editor.modalForm.validate();
            });
            errors = _.compact(errors);
            if (errors.length > 0) {
                return errors;
            }
        };
    };

    Form.editors.List.Item = Form.editors.List.Item.extend({

        render: function() {
            alert('33')
            var hidden = '';
            if(this.schema.editorAttrs && this.schema.editorAttrs.disabled){
                hidden = 'hidden';
            }


        
          this.editor = new this.Editor({
            key: this.key,
            schema: this.schema,
            value: this.value,
            list: this.list,
            item: this,
            form: this.form
          }).render();
          
          //Create main element
          
          var $el = $($.trim(this.template({
            hidden : hidden
          })));

          $el.find('[data-editor]').append(this.editor.el);

          //Replace the entire element so there isn't a wrapper tag
          this.setElement($el);
            
          return this;
        },

    }, {
      //STATICS
      template: _.template('\
        <div class="col-md-12 clearfix">\
          <span data-editor class="clearfix"></span>\
          <div class="col-xs-12 clearfix">\
          <button type="button" data-action="remove" class="btn btn-xs btn-danger <%= hidden %>"><span class="reneco reneco-close"></span></button>\
          </div>\
          <br />\
        </div>\
      ', null, Form.templateSettings),

      errorClassName: 'error'

    });



    editors.ListOfNestedModel = Form.editors.Number.extend({

        initialize: function (options) {
            
            console.log('passed');
            options.schema.model = Backbone.Model.extend({
                schema:
                    options.schema.subschema
            }),


            options = options || {};
            options.schema.validators = [];
            options.schema.itemType = 'InlineNestedModel';
            var editors = Form.editors;


            editors.Base.prototype.initialize.call(this, options);

            var schema = this.schema;

            this.tplDatas = {};
            this.tplDatas.hidden = '';

            if (!schema) throw new Error("Missing required option 'schema'");
            if (options.schema.editorAttrs && options.schema.editorAttrs.disabled) {
                this.tplDatas.hidden = 'hidden';
            }
            
            this.tplDatas.label = this.schema.Name;
            this.template = options.template || _.template(tpl);

            //Determine the editor to use
            this.Editor = (function () {
                var type = schema.itemType;

                //Default to Text
                if (!type) return editors.Text;

                //Use List-specific version if available
                if (editors.List[type]) return editors.List[type];

                //Or whichever was passed
                return editors[type];
            })();

            this.items = [];
            
        },

        render: function() {
        
          //Create main element
          var $el = $($.trim(this.template()));

          this.setElement($el);
          
          return this;
          
        },

    });

    editors.List.InlineNestedModel = editors.List.NestedModel.extend({
        events: {},
        initialize: function (options) {
            options = options || {};

            this.defaultValue =  options.schema.defaultValue;
            options.schema.validators = [];
            options.list.validators = options.list.validators || []; // FIXME: Doesn't work when validators is undefined...
            options.list.validators.push({ type: 'subforms', field: options.list });
            options.list.hasNestedForm = true; // Disable field-level error handling because it is already handled in subform (see Field.setError())


            Form.editors.Base.prototype.initialize.call(this, options);

            this.form = options.form;
            if (!options.form) throw new Error('Missing required option: "form"');

            //Template
            this.template = options.template || this.constructor.template;
            
            var schema = this.schema;

            if (!schema.model) throw new Error('Missing required option "schema.model"');
            var nestedSchema = schema.model.prototype.schema;
            this.nestedSchema = (_.isFunction(nestedSchema)) ? nestedSchema() : nestedSchema;
        },

        getValue: function () {
            if (this.modalForm) {
                this.value = this.modalForm.getValue();
            }
            return this.value;

            if (this.modalForm) {
                var curValue = this.modalForm.getValue();
                var data = this.modalForm.data;
                if (data == null) {
                    this.value = this.modalForm.getValue();
                }
                else {
                    for ( var key in curValue){
                        data[key] = curValue[key];
                    }
                    this.value = data;
                }
            }
            return this.value;
        },

        render: function () {
            var self = this,
                ModalForm = this.form.constructor;


            var obj = this.nestedSchema;
            for (var key in obj) {
                obj[key].editorAttrs = this.schema.editorAttrs
            }



            obj[Object.keys(obj)[0]].editorAttrs = this.schema.editorAttrs;

            var form = this.modalForm = new ModalForm({
                schema: this.nestedSchema,
                data: this.value || this.defaultValue
            });

            var el = form.render().el;
            this.$el.html(el);

            setTimeout(function () {
                self.trigger('readyToAdd');
            }, 0);

            return this;
        }
    });*/




});
