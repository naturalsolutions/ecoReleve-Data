define([
    'underscore',
    'jquery',
    'jqueryui',
    'backbone',
    'backbone_forms',
    'autocompTree',
], function (
    _, $, $ui, Backbone, Form, autocompTree
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
            'hide': "hasChanged",
            'keyup': 'inputChange',
            'changeEditor':'inputChange',
        },
        
        editable:false,


        //for global form prevent
        hasChanged: function (currentValue) {
            if (currentValue !== this.previousValue) {
                this.previousValue = currentValue;
                this.trigger('change', this);
            }
        },

        inputChange: function(e){
            this.isTermError = true;
        },

        initialize: function (options) {
            Form.editors.Base.prototype.initialize.call(this, options);

            this.formGrid = options.formGrid;
            this.id = this.cid;

            this.validators = options.schema.validators || [];
            this.validators.push({ type: 'Thesaurus', parent: this });
            if(this.validators && this.validators[0] == 'required'){
              options.schema.editorClass += ' required';
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
            this.lng = options.schema.options.lng;
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
                    timeout: _this.timeout,

                    onItemClick: function (options) {
                        _this.$el.find('input').trigger('thesaurusChange');

                        var value = _this.$el.find('#' + _this.id).val();
                        _this.validateValue(value);
                    },

                });

                //on blur, manual because focus on three trigger blur on input
                _this.$el.find('#' + _this.id).blur(function (options) {

                    var value = _this.$el.find('#' + _this.id).val();
                    _this.validateValue(value);

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

            //set inital values
            if (_this.value) {
                _this.$el.find('#' + _this.id).val(_this.value.displayValue);
                _this.$el.find('#' + _this.id + '_value').val(_this.value.value);
            }

            }).defer();

            return this;
        },

        isEmptyVal: function(value){
            if (value == null || value == '') {
                return true;
            } else {
                return false;
            }

        },

        getValue: function () {
            //if error
            if (this.isTermError) {
                return this.$el.find('#' + this.id).val();
            }

            //if empty val
            if(!this.$el.find('#' + this.id).val()){
                return '';
            }

            if ( this.$el.find('#' + this.id + '_value') ){
                return this.$el.find('#' + this.id + '_value').val();
            }
        },

        validateValue: function (displayValue, isTranslated) {
            this.isTermError = true;

            if (this.isEmptyVal(displayValue)) {
                this.displayError(false);
                this.isTermError = false;                
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
        <span id="errorMsg" class="error hidden">Invalid term</span>\
        </div>',
    });


});
