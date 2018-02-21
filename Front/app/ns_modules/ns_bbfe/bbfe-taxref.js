define([
  'underscore',
  'jquery',
  'backbone',
  'backbone-forms',
  'jqueryui',
], function(_, $, Backbone, Form
) {
  'use strict';
  return Form.editors.TaxRefEditor = Form.editors.Base.extend({

    previousValue: '',

    events: {
        'hide': 'hasChanged',
        'change select':'selectChange'
    },
    template: 
    '<div style="width:100%;" class="input-group">\
            <input style="width:75%;" class="form-control" type="text" data_value="<%= data_value %>" name="<%= key %>" id="<%=id%>" value="<%=value%>" data_value="<%=data_value%>" initValue="<%=initValue%>"/>\
            <select style="width:25%;background-color: #eeeeee;" id=typeList class="selectpicker form-control" data-live-search="true">\
                <option value="latin">lat.</option>\
                <option value="vernaculaire">vern.</option>\
            </select>\
    </div>',

    initialize: function (options) {
        Form.editors.Base.prototype.initialize.call(this, options);
        var _this = this;
        this.url = 'taxon';
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
            this.type = options.schema.options.type;
            this.taxaList = options.schema.options.taxaList;
            this.autocompleteSource.source = 'autocomplete/taxon?protocol='+this.taxaList+'&type='+this.type;
            // if (typeof options.schema.options.source === 'string'){
            //     this.autocompleteSource.source = 'regions/autocomplete';
            // }
            this.autocompleteSource.select = function(event,ui){
              event.preventDefault();
              _this.setValue(ui.item.taxref_id,ui.item.label,true);
              _this.matchedValue = ui.item;
              _this.isTermError = false;
              _this.displayErrorMsg(false);
            };
            this.autocompleteSource.focus = function(event,ui){
                event.preventDefault();
            };

            this.autocompleteSource.change = function(event,ui){
              var valueFound = ui.item;
              if (!valueFound){
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
        }
        this.options = options;
        var required;
        if(options.schema.validators){
          required = options.schema.validators[0];
        }else{
          required = '';
        }
    },

    selectChange: function(e, v ){
        this.type = $(e.target).val();
        console.log('select change', e, this.typeList)
        this.autocompleteSource.source = 'autocomplete/taxon?protocol='+this.taxaList+'&type='+this.type;
        this.$input.autocomplete(this.autocompleteSource);
        this.fetchDisplayValue(this.getValue());
        
    },

    setValue: function(value, displayValue, confirmChange) {

      this.$input.val(displayValue);

      this.$input.attr('data_value',value);
      this.matchedValue = value;
      this.form.model.set('CD_NOM', value);
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
        url : _this.url+'/'+val,
        success : function(data){
          // _this.$input.attr('data_value',val);
          // _this.$input.val(data[_this.usedLabel]);
          _this.setValue(val,data[_this.type],false);
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
                  if(!data[this.type]){
                    this.$input.val(data.latin);
                    this.$el.find('#typeList').val('latin');
                  } else{
                    this.$input.val(data[this.type]);
                  }
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
          _this.$el.find('#typeList').val(_this.type);
          if (_this.options.schema.editorAttrs && _this.options.schema.editorAttrs.disabled) {
              _this.$input.prop('disabled', true);
          }
      }).defer();
      return this;
  },


  });
});
