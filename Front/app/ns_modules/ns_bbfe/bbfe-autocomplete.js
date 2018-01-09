define([
    'underscore',
    'jquery',
    'backbone',
    'backbone-forms',
    'jqueryui',
], function(_, $, Backbone, Form
) {
    'use strict';
    return Form.editors.AutocompleteEditor = Form.editors.Base.extend({

        previousValue: '',

        events: {
            'hide': 'hasChanged',
            'keyup input': 'onKeyup'
        },
        template: '<div>\
        <div class="input-group">\
            <span class="input-group-addon <%=iconFont%>"></span>\
            <input class="form-control" type="text" name="<%= key %>" id="<%=id%>" value="<%=value%>" data_value="<%=data_value%>" initValue="<%=initValue%>"/></div>\
            </div>\
        </div>',

        onKeyup: function(e){
            this.$input.attr('data_value', this.$input.val());
        },

        initialize: function (options) {
            Form.editors.Base.prototype.initialize.call(this, options);
            var _this = this;

            this.template = options.template || this.template;

            // clone options.schema to avoid modifying source object (pointer)
            this.autocompleteSource = JSON.parse(JSON.stringify(options.schema.options));
            var url = options.schema.options.source;

            this.iconFont = options.schema.options.iconFont || 'hidden';
            if (options.schema.editorAttrs && options.schema.editorAttrs.disabled)  {
                this.iconFont = 'hidden';
            }

            if (options.schema.options) {
                if (typeof options.schema.options.source === 'string'){
                   this.autocompleteSource.source = url;
                }
                this.autocompleteSource.select = function(event,ui){
                    event.preventDefault();
                    _this.$input.attr('data_value',ui.item.value).change();
                    _this.$input.val(ui.item.label);
                };
                this.autocompleteSource.focus = function(event,ui){
                    event.preventDefault();
                };

                this.autocompleteSource.change = function(event,ui){
                    event.preventDefault();
                    if (ui.item) {
                        _this.$input.attr('data_value',ui.item.value).change();
                        _this.$input.val(ui.item.label);
                    } else {
                        if (!_this.$input.attr('initValue') && _this.$input.attr('data_value') != _this.$input.val()){
                            _this.$input.attr('data_value',_this.$input.val()).change();
                        }
                        if (_this.$input.val() === ''){
                            _this.$input.attr('data_value','');
                        }
                    }
                };
            }
            this.options = options;
        },

      getValue: function() {
       return this.$input.attr('data_value');
      },

    render: function () {
        var _this = this;

        var value = this.model.get(this.key);
        var data_value;

        if (value && this.options.schema.options.label != this.options.schema.options.value && this.options.schema.options.object) {
            
            //value = null;

            var initValue = this.model.get(this.key);
            $.ajax({
                url : this.options.schema.options.object+'/'+this.model.get(this.key),
                context: this,
                success : function(data){
                    if (typeof data.fullname != 'undefined') {
                        this.$input.val(data.fullname)
                    }else {
                        this.$input.val(data[_this.options.schema.options.label]);
                    }
                }
            })
        }
        var $el = _.template( this.template, {
            id: this.cid,
            value: value,
            data_value :_this.model.get(_this.key),
            initValue:initValue,
            iconFont:_this.iconFont,
            key : this.options.schema.title
        });

        this.setElement($el);
        if(this.options.schema.validators && this.options.schema.validators[0] == "required"){
          this.$el.find('input').addClass('required');
        }

        this.$input = _this.$el.find('#' + _this.cid);

        _(function () {
            
            _this.$input.autocomplete(_this.autocompleteSource); // HERE

            if (_this.options.schema.editorAttrs && _this.options.schema.editorAttrs.disabled) {
                _this.$input.prop('disabled', true);
            }
        }).defer();
        return this;
    },


    });
});
