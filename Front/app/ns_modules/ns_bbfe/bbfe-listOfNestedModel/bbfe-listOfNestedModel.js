define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone_forms',
  'backbone.list',
  'requirejs-text!./tpl-bbfe-listOfNestedModel.html',

  ], function ($, _, Backbone, Marionette, BackboneForm, List,tpl) {


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
        <div class="col-md-12 clearfix list-item">\
          <span data-editor class="col-md-10 list-content"></span>\
          <div class="list-remove col-md-2">\
            <button type="button" data-action="remove" class="btn btn-xs btn-danger list-remove <%= hidden %>"><span class="reneco reneco-close"></span></button>\
          </div>\
        </div>\
      ', null, Form.templateSettings),

      errorClassName: 'error'

    });



    editors.ListOfNestedModel = Form.editors.List.extend({

        initialize: function (options) {

            options.schema.model = Backbone.Model.extend({
                schema:
                    options.schema.subschema
            }),


            options = options || {};
            options.schema.validators = [];
            options.schema.itemType = 'InlineNestedModel';
            var editors = Form.editors;
            if (options.schema.editable == false) {
                if (options.schema.editorAttrs == null){
                  options.schema.editorAttrs = {disabled : true};
                }
                else {
                  options.schema.editorAttrs.disabled = true;
                }
            }

            editors.Base.prototype.initialize.call(this, options);

            var schema = this.schema;

            this.tplDatas = {};
            this.tplDatas.hidden = '';

            if (!schema) throw new Error("Missing required option 'schema'");
            if (options.schema.editable == false) {
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
          var self = this,
              value = this.value || [];

          //Create main element
          var $el = $($.trim(this.template(this.tplDatas)));

          //Store a reference to the list (item container)
          this.$list = $el.is('[data-items]') ? $el : $el.find('[data-items]');

          //Add existing items
          if (value.length) {
            _.each(value, function(itemValue) {
              self.addItem(itemValue);
            });
          }

          //If no existing items create an empty one, unless the editor specifies otherwise
          else {
            if (!this.Editor.isAsync) this.addItem();
          }

          this.setElement($el);
          this.$el.attr('id', this.id);
          this.$el.attr('name', this.key);

          if (this.hasFocus) this.trigger('blur', this);

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
            /*TODO default model data for new nested Model */
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

            if (this.schema.editable==false){
              for (var key in obj) {
                if (obj[key].editorAttrs == null){
                  obj[key].editorAttrs = {disabled : true};
                }
                else {
                  obj[key].editorAttrs.disabled = true;
                }

              }
            }
            obj[Object.keys(obj)[0]].editable = this.schema.editable;

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
    });
});
