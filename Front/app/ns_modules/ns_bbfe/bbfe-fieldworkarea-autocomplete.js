define([
  'underscore',
  'jquery',
  'backbone',
  'backbone-forms',
  'jqueryui',
], function(_, $, Backbone, Form
) {
  'use strict';
  return Form.editors.FieldworkingAreaEditor = Form.editors.Base.extend({

    previousValue: '',

    events: {
        'hide': 'hasChanged',
        'keyup input': 'onKeyup',
        'change': 'onChange'
        
    },
    template: '<div>\
    <div class="input-group">\
        <span class="input-group-addon <%=iconFont%>"></span>\
        <input class="form-control" type="text" data_value="<%= data_value %>" name="<%= key %>" id="<%=id%>" value="<%=value%>" data_value="<%=data_value%>" initValue="<%=initValue%>"/></div>\
        </div>\
    </div>',

    onKeyup: function(e){
       // this.$input.attr('data_value', this.$input.val());
    },

    onChange: function(e){
     // this.isTermError = true;
    },

    initialize: function (options) {
        Form.editors.Base.prototype.initialize.call(this, options);
        var _this = this;
        this.url = 'regions';
        this.template = options.template || this.template;

        // clone options.schema to avoid modifying source object (pointer)
        this.autocompleteSource = JSON.parse(JSON.stringify(options.schema.options));
        var url = options.schema.options.source;

        this.iconFont = options.schema.options.iconFont || 'hidden';
        if (options.schema.editorAttrs && options.schema.editorAttrs.disabled)  {
            this.iconFont = 'hidden';
        }

        this.validators.push({ type: 'Thesaurus', parent: this}); //?

        if (options.schema.options) {
          this.autocompleteSource.source = 'regions/autocomplete';
            if (typeof options.schema.options.source === 'string'){
                this.autocompleteSource.source = 'regions/autocomplete';
            }
            this.autocompleteSource.select = function(event,ui){
              event.preventDefault();
              _this.setValue(ui.item.value,ui.item.displayLabel,true);
              _this.matchedValue = ui.item;
              _this.isTermError = false;
              _this.displayErrorMsg(false);
            };
            this.autocompleteSource.focus = function(event,ui){
                event.preventDefault();
            };
            this.autocompleteSource.blur = function(event,ui){
              event.preventDefault();
          };

            this.autocompleteSource.change = function(event,ui){
              if (_this.$input.val() !== '' && !_this.matchedValue){
                _this.isTermError = true;
                _this.displayErrorMsg(true);
              }
              else {
                if (_this.$input.val() === ''){
                  _this.$input.attr('data_value','');
                }
                _this.isTermError = false;
                _this.displayErrorMsg(false);
              }
              _this.$input.change();
          };

            // this.autocompleteSource.response = function(event,ui){
            //   event.preventDefault();
            //   if (ui.content.length == 1){
            //     var item = ui.content[0];
            //     //_this.setValue(item.value,item.displayLabel,false);
            //     _this.matchedValue = item;
            //     _this.isTermError = false;

            //   } else {
            //     var val = _this.$input.val();
            //     var valueFound = ui.content.find(function(item){
            //       return val == item.displayLabel;
            //     });
            //     if (valueFound){
            //       _this.setValue(valueFound.value,valueFound.displayLabel,false);
            //       _this.matchedValue = valueFound;
            //       _this.isTermError = false;
            //     } else {
            //       _this.matchedValue = undefined;
            //     }
            //   }
            // };
        }
        this.options = options;
        var required;
        if(options.schema.validators){
          required = options.schema.validators[0];
        }else{
          required = '';
        }
        this.model.set('required', required);
  
    },

    setValue: function(value, displayValue, confirmChange) {
      if (displayValue || displayValue === ''){
        this.$input.val(displayValue);
      } else {
        this.fetchDisplayValue(value);
      }
      if (this.target){
        this.model.set(this.target,value);
      }
      this.$input.attr('data_value',value);
      this.matchedValue = value;

      if(confirmChange){
        this.$input.change();
      }
    },

    getValue: function() {
      if (this.isTermError) {
        return null ;
      }
      if (this.noAutocomp){
        return this.$input.val();
      }
      return this.$input.attr('data_value');
    },

    getDisplayValue: function() {
      if (this.isTermError) {
        return null ;
      }
      return this.$input.val();
    },

    fetchDisplayValue: function(val){
      var _this = this;
      if (val instanceof Object && val.displayValue){
        val = val.displayValue;
      }
      $.ajax({
        url : _this.url+val,
        success : function(data){
          // _this.$input.attr('data_value',val);
          // _this.$input.val(data[_this.usedLabel]);
          _this.setValue(val,data[_this.usedLabel],false);
          _this.displayErrorMsg(false);
          _this.isTermError = false;
        }
      });
    },

    displayErrorMsg: function (bool) {
      if (this.isTermError) {
        this.$input.addClass('error');
      } else {
        this.$input.removeClass('error');
      }
    },


    render: function () {
      var _this = this;

      var value = this.model.get(this.key);
      var data_value;

      if (value) {
          var initValue = this.model.get(this.key);
          $.ajax({
              url : this.url+'/'+this.model.get(this.key),
              context: this,
              success : function(data){
                this.$input.val(data.Name);
              }
          });
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
