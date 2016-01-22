define([
    'underscore',
    'jquery',
    'backbone',
    'backbone-forms',
    'config',
    'jqueryui',
], function(_, $, Backbone, Form, config
) {
    'use strict';
    return Form.editors.AutocompleteEditor = Form.editors.Base.extend({

        previousValue: '',

        events: {
            'hide': "hasChanged"
        },
        template: '<div><input type="text" id="<%=id%>" value="<%=value%>"/></div>',
        
        initialize: function (options) {
            Form.editors.Base.prototype.initialize.call(this, options);
            this.template = options.template || this.template;
            // clone options.schema to avoid modifying source object (pointer)
            this.autocompleteSource = JSON.parse(JSON.stringify(options.schema.options));
            var url = options.schema.options.source;
            var _this = this;
            if (options.schema.options) {
                if (typeof options.schema.options.source === 'string'){

                   this.autocompleteSource.source = config.coreUrl + url;
                }
                this.autocompleteSource.select = function(event,ui){
                    event.preventDefault();
                    _this.$el.find('#' + _this.id ).attr('data_value',ui.item.value).change();
                    _this.$el.find('#' + _this.id ).val(ui.item.label);
                };
                this.autocompleteSource.focus = function(event,ui){
                    event.preventDefault();
                };
                this.autocompleteSource.change = function(event,ui){
                    event.preventDefault();
                    console.log(ui.item);
                    if (ui.item) {
                        _this.$el.find('#' + _this.id ).attr('data_value',ui.item.value).change();
                        _this.$el.find('#' + _this.id ).val(ui.item.label);
                    } else {
                        _this.$el.find('#' + _this.id ).attr('data_value',_this.$el.find('#' + _this.id ).val()).change();
                    }
                };
            }
            this.options = options;
        },
        
          getValue: function() {
           return this.$el.find('#' + this.id ).attr('data_value') ;
          },

        render: function () {
            var _this = this;
            var $el = _.template(
                this.template, { id: this.id,value: this.options.model.get(this.options.schema.name) 
            });
            this.setElement($el);
            if(this.options.schema.validators && this.options.schema.validators[0] == "required"){
              this.$el.find('input').addClass('required');
            }
            _(function () {
                
                _this.$el.find('#' + _this.id).autocomplete(_this.autocompleteSource);
                _this.$el.find('#' + _this.id).addClass(_this.options.schema.editorClass) ;
                if (_this.options.schema.editorAttrs && _this.options.schema.editorAttrs.disabled) {
                    _this.$el.find('#' + _this.id).prop('disabled', true);
                }
            }).defer();
            return this;
        },
    });
});
