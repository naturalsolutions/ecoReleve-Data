define([
 'underscore',
 'jquery',
 'backbone',
 'backbone_forms',
 'jqueryui',
  'requirejs-text!./AutocompleteEditorTemplate.html',
], function (
 _, $, Backbone, Form, config,Template
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
            if (options.schema.options) {
                this.autocompleteSource = options.schema.options;
            }
            this.options = options;
        },
        
          getValue: function() {
           
           return this.$el.find('#' + this.id ).val() ;
          },

        render: function () {

            
            var $el = _.template(
                this.template, { id: this.id,value:this.options.model.get(this.options.schema.name) }
            );
            this.setElement($el);
            var _this = this;
            _(function () {
                var optionsJquery = _this.autocompleteSource;
                // Adding here specific code
                //optionsJquery = { source: ["bezin","bzezzzz","beziiiii"], minLength: 3 }
                _this.$el.find('#' + _this.id).autocomplete(optionsJquery);
                _this.$el.find('#' + _this.id).addClass(_this.options.schema.editorClass) ;
            }).defer();

            return this;
        },

    });


});
