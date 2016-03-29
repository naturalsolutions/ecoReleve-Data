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
            console.log('validateur', 'value', value, 'options', options);
            console.log(options.parent);
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
            'hide': "hasChanged"
        },
        editable:false,
        hasChanged: function (currentValue) {
            if (currentValue !== this.previousValue) {
                this.previousValue = currentValue;
                this.trigger('change', this);
            }
        },

        initialize: function (options) {
            Form.editors.Base.prototype.initialize.call(this, options);
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
            this.id = options.id;
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
            var tplValeurs = {
                inputID: this.id,
                editorAttrs: editorAttrs,
                editorClass: options.schema.editorClass,
                iconFont:iconFont
            }

            this.template = _.template(this.template, tplValeurs);
            this.startId = options.schema.options.startId;
            this.wsUrl = options.schema.options.wsUrl;
            this.lng = options.schema.options.lng;
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

        render: function () {

            var $el = $(this.template);
            this.setElement($el);
            var _this = this;
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
     /*                   onInputBlur: function (options) {
                            var value = _this.$el.find('#' + _this.id + '_value').val();
                            _this.onEditValidation(value);
                        },*/

                        onItemClick: function (options) {
                            var value = _this.$el.find('#' + _this.id + '_value').val();
                            _this.onEditValidation(value);
                        }
                    });
                }
                if (_this.translateOnRender) {
                    _this.validateAndTranslate(_this.value, true);
                }
                if (_this.FirstRender) {
                    _this.$el.find('#' + _this.id).blur(function (options) {
                        setTimeout(function (options) {
                            var value = _this.$el.find('#' + _this.id + '_value').val();
                            _this.onEditValidation(value);
                        }, 150);
                    });

                    //console.log(_this.$el.find('#treeView' + _this.id));
                }
                _this.FirstRender = false;
            }).defer();
            return this;
        },
        validateAndTranslate: function (value, isTranslated) {
            //console.log('validateAndTranslate', value);
            var _this = this;

            if (value == null || value == '') {
                _this.displayErrorMsg(false);
                _this.$el.find('#' + _this.id ).attr('data_value','');
                return;
            }
            var TypeField = "FullPath";
            if (value && value.indexOf(">") == -1) {
                TypeField = 'Name';
            }
            var erreur;

            $.ajax({
                url: _this.wsUrl + "/getTRaductionByType",
                //timeout: 3000,
                data: '{ "sInfo" : "' + value + '", "sTypeField" : "' + TypeField + '", "iParentId":"' + _this.startId + '",lng:"' + _this.lng + '"  }',
                dataType: "json",
                type: "POST",
                //async:false,
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    $('#divAutoComp_' + _this.id).removeClass('error');
                    _this.displayErrorMsg(false);

                    var translatedValue = data["TTop_FullPathTranslated"];
                    if (isTranslated) {
                        if (_this.displayValueName == 'valueTranslated') {
                            translatedValue = data["TTop_NameTranslated"];
                        }
                        //_this.$el.find('#' + _this.id).val(translatedValue);
                        _this.$el.find('#' + _this.id + '_value').val(data["TTop_FullPath"]);
                        _this.$el.find('#' + _this.id ).attr('data_value',value);
                        _this.$el.find('#' + _this.id).val(translatedValue);
                    }

                    _this.displayErrorMsg(false);


                },
                error: function (data) {
                    _this.$el.find('#' + _this.id).val(_this.value);
                    if (_this.editable) {
                        $('#divAutoComp_' + _this.id).addClass('error');
                        _this.displayErrorMsg(true);
                    }
                }
            });



        },
        onEditValidation: function (value) {
            var _this = this;
            if (!this.ValidationRealTime) {
                this.isTermError = false;
                return;
            }
            //console.log('Validation on edit ', value, 'finvalue');
            //console.log(value);
            /*if (value == null || value == '') {
                $('#divAutoComp_' + _this.id).removeClass('error');
                return;
            }*/

            _this.isTermError = true;
            //console.log('Validation on edit Value pas vide ');
            _this.validateAndTranslate(value, true);


        },

        displayErrorMsg: function (bool) {
            if (!(this.editable ==false)) {
                //console.log('boooooool', bool);
                this.isTermError = bool;
                //console.log('this.$el', this.$el);
                if (this.isTermError) {

                    //console.log('Term Error');
                    this.termError = "Invalid term";
                    this.$el.find('#divAutoComp_' + this.id).addClass('error');
                    //this.$el.find('#errorMsg').removeClass('hidden');
                } else {
                    this.termError = "";
                    this.$el.find('#divAutoComp_' + this.id).removeClass('error');
                    this.$el.find('#errorMsg').addClass('hidden');
                }
            }
        },

    }, {
        template: '<div id="divAutoComp_<%=inputID%>" >\
        <div class="input-group">\
            <span class="input-group-addon <%=iconFont%>"></span>\
            <input id="<%=inputID%>" name="<%=inputID%>" class="autocompTree <%=editorClass%>" type="text" placeholder="" <%=editorAttrs%>>\
        </div>\
        <span id="errorMsg" class="error hidden">Invalid term</span>\
        </div>',
    });


});