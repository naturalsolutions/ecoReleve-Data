define([
    'underscore',
    'jquery',
    'jqueryui',
    'backbone',
    'backbone_forms',
    'moment',
    'autocompTree',
    'dateTimePicker'
], function (
    _, $, $ui, Backbone, Form, moment, autocompTree
) {

    Backbone.Form.validators.Thesaurus = function (options) {
        return function Thesaurus(value) {
            //validation shloud be done here on value and not display value
            //then trigger validate() on blur or clickItem 
            //But risky for the moment if the tree is already detached

            if (!options.parent.isTermError) {
                return null;
            }
            var retour = {
                type: options.type,
                message: ''
            };
            return retour;
        };
    };

    'use strict';
    return Form.editors.AutocompTreeEditor = Form.editors.Base.extend({

        previousValue: '',

        events: {
            'change .autocompTree': 'onChange'
        },

        enableDatePicker: function() {
            // avoid double loading (and reset of value)
            if (this.dateEnabled) return;
            this.dateEnabled = true;

            // display dt picker
            this.$el.find(".date").removeClass("hidden");

            // is dateFormat available in schema?
            var format = 'DD/MM/YYYY';
            if (this.options.schema.options.dateFormat) {
                format = this.options.schema.options.dateFormat;
            }

            this.$el.find(".date input").val(moment().format(format));
            this.$el.find(".date").datetimepicker({
                format: format
            });
        },

        onChange: function(e){
            var value = this.$el.find('#' + this.id).val();
            this.validateValue(value);

            if (this.options.schema.options.date) {
                this.enableDatePicker();
            }
        },

        initialize: function (options) {
            if (options.schema.defaultValue) { //hack need because back return value and displayValue none when in nestedform 
                var tmpVal = options.model.get(options.key)
                var splitTab = options.schema.defaultValue.split('>');
                if (typeof(tmpVal) === 'undefined' ) {
                    options.model.set(options.key, { 
                                                    value :  options.schema.defaultValue,
                                                    displayValue : splitTab[splitTab.length-1]

                    });
                }
                else if ( tmpVal.value === null && tmpVal.displayValue === null ) {

                    tmpVal.displayValue = splitTab[splitTab.length-1];
                    tmpVal.value = options.schema.defaultValue;
                }
            }
            Form.editors.Base.prototype.initialize.call(this, options);

            this.options = options;
            this.formGrid = options.formGrid;
            this.id = this.cid;

            this.validators = options.schema.validators || [];
            this.validators.push({ type: 'Thesaurus', parent: this });
            if(this.validators && this.validators[0] == 'required'){
              options.schema.editorClass += ' required';
            }
            if(options.schema.options && options.schema.options.disableValidators){
                this.validators = [];
            }
            this.editable = options.schema.editable || true;
            this.isTermError = false;


            var editorAttrs = "";
            var iconFont = options.schema.options.iconFont || 'hidden';


            if (options.schema.editorAttrs && options.schema.editorAttrs.disabled)  {
                this.editable = false;
            }
            if (this.editable!=null && !this.editable) {
                editorAttrs += 'disabled="disabled"';
                iconFont += ' no-border';
            }

            var tplValeurs = {
                inputID: this.id,
                editorAttrs: editorAttrs,
                editorClass: options.schema.editorClass,
                iconFont: iconFont,
                inputGroup: (this.formGrid) ? '' : 'input-group'
            }
            this.template = options.template || this.constructor.template;
            this.template = _.template(this.template, tplValeurs);


            this.startId = options.schema.options.startId;
            this.wsUrl = options.schema.options.wsUrl;
            this.lng =  window.app.user.attributes.Language;
            this.timeout = options.schema.options.timeout;


            this.displayValueName = options.schema.options.displayValueName || 'fullpathTranslated';
            this.storedValueName = options.schema.options.storedValueName || 'fullpath';
        },

        getDisplayedValue: function(){
            return this.$el.find('#' + this.id).val();
        },

        render: function () {
            var _this = this;

            var $el = $(this.template);
            this.setElement($el);

            if(this.formGrid){
                $el.find('.input-group-addon').addClass('hide');
            }
            
            _(function () {

            if (_this.editable) {

                _this.$el.find('#' + _this.id).autocompTree({
                    wsUrl: _this.wsUrl,
                    webservices: 'fastInitForCompleteTree',
                    language: { hasLanguage: true, lng: _this.lng },
                    display: {
                        isDisplayDifferent: true,
                        suffixeId: '_value',
                        displayValueName: _this.displayValueName,
                        storedValueName: _this.storedValueName
                    },
                    inputValue: _this.value,
                    startId: _this.startId,
                    timeout: _this.timeout, // can raise an error

                    onItemClick: function (options) {
                        //for global
                        _this.$el.find('input').trigger('thesaurusChange');

                        _this.onChange();
                    },

                    onInputInitialize: function(options){
                        if(_this.value){
                            _this.validateValue(_this.value.displayValue);
                        }
                    }

                });

                // tree navigation arrow
                $('#treeView' + _this.id).on('keyup',function(e){
                    var $this = $(this);
                    if (e.keyCode == 38 || e.keyCode == 40){
                        var itemFocus = $('#treeView' + _this.id).find('.fancytree-focused');
                        var calcul =$this.scrollTop()+ $this.outerHeight()-itemFocus.height();
                        if(itemFocus.position().top >= calcul){
                            $('#treeView' + _this.id).scrollTop(itemFocus.position().top);
                        }
                        if(itemFocus.position().top < $this.scrollTop()){
                            $('#treeView' + _this.id).scrollTop(itemFocus.position().top);
                        }
                    }
                    if (e.keyCode == 27 || e.keyCode == 9){
                        $this.css('display', 'none');
                    }
                });

            }

            if((typeof _this.value === "string") && _this.value != null && _this.value != 'null' && _this.value != ''){
                var tmp = _this.value;
                _this.value = {};
                _this.value.value = tmp;
                _this.value.displayValue = _this.findDisplayedValue(tmp);
            }

            //set inital values
            if (_this.value) {
                _this.$el.find('#' + _this.id).val(_this.value.displayValue);
                _this.$el.find('#' + _this.id + '_value').val(_this.value.value);
                if(!_this.editable){
                    _this.$el.find('#' + _this.id).attr('val',_this.value.value);
                }
            }

            }).defer();

            return this;
        },

        findDisplayedValue: function(value){
            var _this = this;

            var node = this.$el.find('#treeView' + this.id).fancytree('getTree').findFirst(function(node){
                return (node.data.fullpath == value)
            });
            if(node){
                return node.data.valueTranslated;    
            } else {
                return '';
            }
            
        },

        isEmptyVal: function(value){
            if (value == null || value == '') {
                return true;
            } else {
                return false;
            }

        },

        getValue: function () {
            var val = '';

            //if error
            if (this.isTermError) {
                val = this.$el.find('#' + this.id).val();
            } else if(!this.editable && this.$el.find('#' + this.id).attr('val')){
                val = this.$el.find('#' + this.id).attr('val');
            } else if ( this.$el.find('#' + this.id + '_value') ){
                val = this.$el.find('#' + this.id + '_value').val();
            }

            // if date option is available, wrap value in json object
            if (this.options.schema.options.date) {
                val = {
                    value: val,
                    date: this.$el.find(".date input").val()
                }
            }
            return val;
        },

        validateValue: function (displayValue, isTranslated) {
            this.isTermError = true;

            if (this.isEmptyVal(displayValue)) {
                this.isTermError = false;
                this.displayError(false);
                return;
            }

            //check on/from display value
            var valueFound = this.$el.find('#treeView' + this.id).fancytree('getTree').findFirst(function(node){
                if(node.data.valueTranslated == displayValue){
                    return true;
                }
            });

            if(valueFound){
                //set value
                value = valueFound.data.fullpath
                this.$el.find('#' + this.id + '_value').val(value);

                this.isTermError = false;
                this.displayError(false);

            } else{
                this.displayError(true);
            }
        },

        displayError: function (bool) {
            if (this.editable === true) {
                if (this.isTermError) {
                    this.$el.find('#' + this.id).addClass('error');
                } else {
                    this.$el.find('#' + this.id).removeClass('error');
                }
            }
        },

    }, {
        template: '<div id="divAutoComp_<%=inputID%>" >\
        <div class="<%= inputGroup %>">\
            <span class="input-group-addon <%=iconFont%>"></span>\
            <input id="<%=inputID%>" name="<%=inputID%>" class="autocompTree <%=editorClass%>" type="text" placeholder="" <%=editorAttrs%>>\
        </div>\
        <div class="input-group date dateTimePicker hidden" data-editors="Date_">\
            <span class="input-group-addon ">\
                <span class="reneco-calendar reneco "></span>\
            </span>\
            <input name="Date" class="form-control displayInput " type="text">\
        </div>\
        <span id="errorMsg" class="error hidden">Invalid term</span>\
        </div>',
    });


});
