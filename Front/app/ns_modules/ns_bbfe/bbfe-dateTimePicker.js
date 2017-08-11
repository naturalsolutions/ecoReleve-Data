define([
  'jquery',
  'backbone',
  'backbone_forms',
 'dateTimePicker',
 'popper',
 'moment',
], function(
  $, Backbone, Form,datetimepicker,Popper,moment
){
  'use strict';
  return Form.editors.DateTimePickerEditor = Form.editors.Base.extend({

    previousValue: '',

    events: {
        'hide': "hasChanged",
        'dblclick' : 'handleDblClick'
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

        this.id = this.cid;

        this.dictFormat = {
            'DD/MM/YYYY HH:mm:ss' : 'datetime',
            'DD/MM/YYYY' : 'date',
            'HH:mm:ss' : 'time'
        }
        if (options.schema.options){
            this.format = options.schema.options.format;
            this.maxDate = options.schema.options.maxDate || false;
            this.defaultDate = options.schema.options.defaultValue || false;
        } else {
            this.format = "DD/MM/YYYY HH:mm:ss";
        }
        // datetimepicker options
        this.datetimepickerOptions = {format : this.format};
        if (this.defaultDate) {
            this.datetimepickerOptions.defaultDate = moment(this.defaultDate,this.format);
        }
        if (this.maxDate ) {
            this.datetimepickerOptions.maxDate = moment(this.maxDate,this.format) ;
        }

        this.classIcon = 'reneco-calendar reneco';
        if (this.format && (this.format.toLowerCase() == 'hh:mm:ss')) {
            this.classIcon = 'glyphicon-time glyphicon';
        }
    },
    
    handleDblClick : function(e){
      e.stopPropagation();
    },

    getValue: function() {
        return this.$el.find('#' + this.id).val();
    },

    remove : function() {
      if( this.datePickerTest ) {
        $(this.datePickerTest).data("DateTimePicker").destroy(); //to be sure datepicker is destroy
        this.datePickerTest = null;
      }

    },

    render: function(){
        var _this = this;
        var options = this.options;
        var schema = this.schema;
        var value;
        var required;

        if(options.schema.validators){
            required = options.schema.validators[0];
        }

        if (options.model && this.format && this.format.toLowerCase() == 'hh:mm:ss') {
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
                if (options.model) {
                  value = options.model.get(this.options.key);
                }else {
                  value = '';
                }
          }

         // _this.datetimepickerOptions.debug = true;
          _this.datetimepickerOptions.widgetParent ='body';

        var $el = $($.trim(this.template({
            value : value,
            editorClass : schema.editorClass,
            required: required,
            editable : (options.schema.editable != false) ? '' : 'disabled',
            hidden: (options.schema.editable != false) ? '' : 'hidden',
            inputID: _this.id,
            iconClass: _this.classIcon
        })));
        this.setElement($el);
        this.datePickerTest = $($el[0]).datetimepicker(_this.datetimepickerOptions);
        $($el[0]).on('dp.show' , function() {
            this.popper = new Popper($($el[0]), $(".bootstrap-datetimepicker-widget"), {
            placement: 'bottom-start',
            modifiers: {
                        preventOverflow: {
                            enabled: true, 
                            boundariesElement: 'window'
                        },
                        flip : {
                          enabled : true,
                          boundariesElement : 'window'
                        }
                    }
            });
          
        });
        $($el[0]).on('dp.change', function(){
            _this.$el.find('input').trigger('change');
            _this.trigger('change', this);
        });

        //tmp solution ? datetimepicker remove the value
        /*
        if(this.options){
            var value = this.options.model.get(this.options.key);
            $el.find('input').val(value);
        }*/

        return this;
    },
    }, {
        template: _.template('<div class="input-group date dateTimePicker"'
            +'data-editors="Date_"><span class="input-group-addon <%= hidden %>">'
            +'<span class="<%= iconClass %> "></span></span><input id="<%=inputID%>" '
            +'name="Date_" class="<%= editorClass %> <%= required %>" type="text" '
            +' value="<%= value %>" <%= editable %> ></div>', null, Form.templateSettings) //data-date-format="DD/MM/YYYY HH:mm:ss" placeholder="jj/mm/aaaa hh:mm:ss"
    });
});
