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
            'changeEditor':'inputChange'
        },
        editable:false,

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

            this.FirstRender = true;
            this.languages = {
                'fr': '',
                'en': 'En'
            };

            this.ValidationRealTime = true;
            if (options.schema.options.ValidationRealTime == false) {
                this.ValidationRealTime = false;
            }

            var iconFont = options.schema.options.iconFont || 'hidden';

            this.validators = options.schema.validators || [];

            this.isTermError = false;

            this.template = options.template || this.constructor.template;
            this.id = this.cid;
            var editorAttrs = "";

            this.editable = options.schema.editable || true;
            if (options.schema.editorAttrs && options.schema.editorAttrs.disabled)  {
                this.editable = false;
            }
            if (this.editable!=null && !this.editable) {
                editorAttrs += 'disabled="disabled"';
                this.ValidationRealTime = false;
                iconFont += ' no-border';
            }

            if(this.validators && this.validators[0] == 'required'){
              options.schema.editorClass += ' required';
            }

            var tplValeurs = {
                inputID: this.id,
                editorAttrs: editorAttrs,
                editorClass: options.schema.editorClass,
                iconFont: iconFont,
                inputGroup: (this.formGrid) ? '' : 'input-group'
            }

            this.template = _.template(this.template, tplValeurs);
            this.startId = options.schema.options.startId;
            this.wsUrl = options.schema.options.wsUrl;
            this.lng = options.schema.options.lng;
            this.timeout = options.schema.options.timeout;
            this.displayValueName = options.schema.options.displayValueName || 'fullpathTranslated';
            this.storedValueName = options.schema.options.storedValueName || 'fullpath';
            if (this.ValidationRealTime) {
                this.validators.push({ type: 'Thesaurus', startId: this.startId, wsUrl: this.wsUrl, parent: this });
            }
            this.translateOnRender = options.translateOnRender || true;
        },

        getValue: function () {
            if (this.isTermError) {
                return this.$el.find('#' + this.id).val();
            }
            if (this.$el.find('#' + this.id + '_value') && this.editable){
                return this.$el.find('#' + this.id + '_value').val();
            } else {
                return this.$el.find('#' + this.id).attr('data_value');
            }
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
                            var value = _this.$el.find('#' + _this.id + '_value').val();
                            _this.$el.find('input').trigger('changeEditor');
                            _this.$el.find('input').trigger('thesaurusChange');
                            $('#' + _this.id).removeClass('error');
                            _this.isTermError = false;
                        }
                    });
                }

                if (_this.FirstRender && _this.value) {
                    _this.$el.find('#' + _this.id).val(_this.value.displayValue);
                    _this.$el.find('#' + _this.id + '_value').val(_this.value.value);
                    if (_this.value.displayValue === '' && _this.value.value){
                        _this.isTermError = true;
                        _this.$el.find('#' + _this.id).val(_this.value.value);
                    }
                }
                _this.$el.find('#' + _this.id).blur(function (options) {
                    var value = _this.$el.find('#' + _this.id + '_value').val();
                    if(_this.isEmptyVal(value)){
                        return;
                    }

                    setTimeout(function (options) {
                        var value = _this.$el.find('#' + _this.id).val();
                        _this.onEditValidation(value);
                    }, 15);
                });
                _this.FirstRender = false;
            }).defer();
            return this;
        },

        isEmptyVal: function(value){
            if (value == null || value == '') {
                this.displayErrorMsg(false);
                this.$el.find('#' + this.id ).attr('data_value','');
                return true;
            } else {
                return false;
            }
        },

        validateAndTranslate: function (displayValue, isTranslated) {
            var _this = this;

            if (this.isEmptyVal(displayValue)) {
                return;
            }
            var erreur;

            valueFound = _this.$el.find('#treeView' + _this.id).fancytree('getTree').findFirst(function(node){
                    if(node.data.valueTranslated == displayValue){
                        return true;
                    }
                });
            
            if(valueFound){
                value = valueFound.data.fullpath
                _this.$el.find('#' + _this.id + '_value').val(value);
                this.isTermError = false;
                $('#' + _this.id).removeClass('error');

            } else{
                if (_this.editable) {
                    $('#' + _this.id).addClass('error');
                    _this.displayErrorMsg(true);
                }
            }
        },

        onEditValidation: function (value) {
            var _this = this;
            if (!this.ValidationRealTime) {
                this.isTermError = false;
                return;
            }
            _this.isTermError = true;
            _this.validateAndTranslate(value, true);
        },

        displayErrorMsg: function (bool) {
            if (!(this.editable == false)) {
                this.isTermError = bool;
                if (this.isTermError) {
                    this.termError = "Invalid term";
                    this.$el.find('#' + this.id).addClass('error');
                    this.$el.find('#' + this.id).attr('title','Invalid term');
                } else {
                    this.termError = "";
                    $('#' + this.id).removeClass('error');
                    this.$el.find('#errorMsg').addClass('hidden');
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
