define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone_forms',
  'backbone.list',
  'requirejs-text!./Templates/ListOfNestedModel.html',
  'requirejs-text!./Templates/ListOfNestedModelDisabled.html'
  ], function ($, _, Backbone, Marionette, BackboneForm, List,tpl,tpldisabled) {


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

            editors.Base.prototype.initialize.call(this, options);

            var schema = this.schema;
            if (!schema) throw new Error("Missing required option 'schema'");
            var curtpl = tpl;
            if (options.schema.editorAttrs && options.schema.editorAttrs.disabled) {
                curtpl = tpldisabled ;
            }
            
            this.template = options.template || _.template(curtpl);

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
    });

    editors.List.InlineNestedModel = editors.List.NestedModel.extend({
        events: {},
        initialize: function (options) {
            options = options || {};

           
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
        },

        render: function () {
            var self = this,
                ModalForm = this.form.constructor;

            var form = this.modalForm = new ModalForm({
                schema: this.nestedSchema,
                data: this.value
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
