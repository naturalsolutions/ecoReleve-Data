define([
  'jquery',
  'backbone',
  'backbone-forms',

], function(
  $, Backbone, Form
){
  'use strict';
  return Form.editors.DateTimePicker = Form.editors.Base.extend({


    
        previousValue: '',

        events: {
            'hide': "hasChanged"
        },

        hasChanged: function(currentValue) {
            if (currentValue !== this.previousValue){
                this.previousValue = currentValue;
                this.trigger('change', this);
            }
        },

        initialize: function(options) {
            Form.editors.Base.prototype.initialize.call(this, options);
            this.template = options.template || this.constructor.template;
            this.options = options;
            this.id = options.id;
            this.dictFormat = {
                'DD/MM/YYYY HH:mm:ss' : 'datetime',
                'DD/MM/YYYY' : 'date',
                'HH:mm:ss' : 'time'
            }
            if (options.schema.options){
                this.format = options.schema.options.format;
            } else {
                this.format = "DD/MM/YYYY HH:mm:ss";
            }

            this.classIcon = 'reneco-calendar reneco';
            if (this.format.toLowerCase() == 'hh:mm:ss') {
                this.classIcon = 'glyphicon-time glyphicon';
            }
            console.log(this.format);
        },

        getValue: function() {
            var date = new Date;
            var input = this.$el.find('#' + this.id);
            return this.$el.find('#' + this.id).val();
        },

        render: function(){
            var options = this.options;
            var schema = this.schema;
            var _this = this;
            var value;
            var required;

            if(options.schema.validators){
                required = options.schema.validators[0];
            }

            if (options.model && this.format.toLowerCase() == 'hh:mm:ss') {
                //value = options.model.get(this.options.key);
                var val = options.model.get(this.options.key);
                if (val){
                  var tab = val.split(" ");
                  if (tab.length > 1){
                    value = tab[1];
                  } else {
                    value = val;
                  }
                }
                
              }else {
                    console.log(this.format)
                    console.log(options.value)
                    if (options.model) {
                      value = options.model.get(this.options.key);
                    }else {
                      value = '';
                    }
              }

            var $el = $($.trim(this.template({
                value : value,
                editorClass : schema.editorClass,
                required: required,
                editable : (options.schema.editable != false) ? '' : 'disabled',
                hidden: (options.schema.editable != false) ? '' : 'hidden',
                inputID:this.id,
                iconClass: _this.classIcon
            })));
            this.setElement($el);
            //console.log('**** HIDDEN ************** ', (options.schema.editable != false) ? '' : 'hidden', options.schema.editable);
            $($el[0]).datetimepicker({
                format : _this.format,
                //displayFormat : _this.format
            });

            //tmp solution ? datetimepicker remove the value
/*            if(this.options){
                var value = this.options.model.get(this.options.key);
                $el.find('input').val(value);
            }*/

            return this;
        },
        }, {
        // STATICS
            template: _.template('<div class="input-group date dateTimePicker"'  
                +'data-editors="Date_"><span class="input-group-addon <%= hidden %>">'
                +'<span class="<%= iconClass %> "></span></span><input id="<%=inputID%>" '
                +'name="Date_" class="<%= editorClass %> <%= required %>" type="text" ' 
                +' value="<%= value %>" <%= editable %> ></div>', null, Form.templateSettings) //data-date-format="DD/MM/YYYY HH:mm:ss" placeholder="jj/mm/aaaa hh:mm:ss"
    });
});