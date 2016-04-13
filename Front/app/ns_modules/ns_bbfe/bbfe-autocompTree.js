define([
    'underscore',
    'jquery',
    'jqueryui',
    'backbone',
    'backbone-forms',
    'autocompTree',
], function (
    _, $, $ui, Backbone, Form, autocompTree
) {


    Backbone.Form.validators.Thesaurus = function (options) {
        return function Thesaurus(value) {
            /*
            if (value == '') return ;
            //console.log('***************************************validateurThesaurus',options,value);

            var TypeField = "FullPath";
                if (value && value.indexOf(">") == -1) {
                    TypeField = 'Name';
                }
            var retour ;

            $.ajax({
                url: options.wsUrl + "/ThesaurusReadServices.svc/json/getTRaductionByType",
                timeout: 3000,
                data: '{ "sInfo" : "' + value + '", "sTypeField" : "' + TypeField + '", "iParentId":"' + options.startId + '" }',
                dataType: "json",
                type: "POST",
                async:false,
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    retour = null;
                },
                error: function (data) {
                    //console.log('***************************erreur de validation*******************')
                    retour = {
                            type: options.type,
                            message: 'Not-Valid Value'
                            };
                }
            });

            return retour ;
            */
        };
    };

    'use strict';
    return Form.editors.AutocompTreeEditor = Form.editors.Base.extend({


        previousValue: '',

        events: {
            'hide': "hasChanged"
        },

        hasChanged: function (currentValue) {
            if (currentValue !== this.previousValue) {
                this.previousValue = currentValue;
                this.trigger('change', this);
            }
        },

        initialize: function (options) {
            this.options = options;
            this.FirstRender = true ;
            this.languages = {
                'fr':'',
                'en':'En'
            };
            //this.validators = options.schema.validators || [] ;

            this.termError = false;
            
            Form.editors.Base.prototype.initialize.call(this, options);
            this.template = options.template || this.constructor.template;
            this.id = options.id + options.form.cid;
            var editorAttrs = "";
            if (options.schema.editorAttrs && options.schema.editorAttrs.disabled) {
                editorAttrs += 'disabled="disabled"';
            }
            var tplValeurs = {
                inputID: this.id,
                editorAttrs: editorAttrs,
                editorClass: options.schema.editorClass
            }
            this.template = _.template(this.template, tplValeurs);
            this.startId = options.schema.options.startId;
            this.wsUrl = options.schema.options.wsUrl;
            this.lng = options.schema.options.lng;
            this.displayValueName = options.schema.options.displayValueName || 'fullpathTranslated';
            this.storedValueName = options.schema.options.storedValueName || 'fullpath';
            this.validators.push({ type: 'Thesaurus', startId: this.startId, wsUrl:this.wsUrl  });
        },

        getValue: function () {
            if(this.termError){
                return false;
            }
            return this.$el.find('#' + this.id + '_value').val();

        },

        render: function () {
            var _this = this;

            var $el = $(this.template);
            this.setElement($el);

            if(this.options.schema.validators && this.options.schema.validators[0] == "required"){
              this.$el.find('input').addClass('required');
            }
            _(function () {
                _this.$el.find('#' + _this.id).autocompTree({
                    wsUrl: _this.wsUrl + '',
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
                });
                
                
                var TypeField = "FullPath";
                if (_this.value && _this.value.indexOf(">") == -1) {
                    TypeField = 'Name';
                }
                var valeur = _this.value || '';
                $.ajax({
                    url: _this.wsUrl + "/getTRaductionByType",
                    timeout: 10000,
                    data: '{ "sInfo" : "' + valeur + '", "sTypeField" : "' + TypeField + '", "iParentId":"' + _this.startId + '" }',
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    success: function (data) {
                        var translatedValue = data["TTop_FullPath" + _this.languages[_this.lng.toLowerCase()]];
                        if (_this.displayValueName  == 'valueTranslated') {
                            translatedValue = data["TTop_Name" + _this.languages[_this.lng.toLowerCase()]];
                        }
                        _this.$el.find('#' + _this.id).val(translatedValue);
                        _this.$el.find('#' + _this.id + '_value').val(data["TTop_FullPath"]);
                    },
                    error: function (data) {
                        //_this.$el.find('#' + _this.id).val('_this.value');
                        _this.$el.find('#' + _this.id + '_value').val(_this.value);
                        //$('#' + _this.id + '_value').val(this.value);
                    }
                });
                if (_this.FirstRender) {
                    _this.$el.find('#' + _this.id).blur(function(options) {
                        
                        
                        setTimeout (function(options) {
                                    var value = _this.$el.find('#' + _this.id ).val() ;
                                    _this.onEditValidation(value) ;
                                    },150) ;
                    });
                    
                }
                _this.FirstRender = false ;
            }).defer();

    

            return this;
        },
        onEditValidation: function (value) {
            var _this = this ;
            console.info('Validation on edit ',value,'finvalue') ;
            if (value == null || value == '')  {
                $('#divAutoComp_' + _this.id).find('input').removeClass('error') ;
                return ;
            }
            console.info('Validation on edit Value pas vide ') ;
            
                var TypeField = "FullPath";
                if (value && value.indexOf(">") == -1) {
                    TypeField = 'Name';
                }
                var erreur ;

                $.ajax({
                    url: _this.wsUrl + "/getTRaductionByType",
                    timeout: 6000,
                    data: '{ "sInfo" : "' + value + '", "sTypeField" : "' + TypeField + '", "iParentId":"' + _this.startId + '" }',
                    dataType: "json",
                    type: "POST",
                    //async:false,
                    contentType: "application/json; charset=utf-8",
                    success: function (data) {
                        _this.termError = false;
                        console.info('***************************validation OK*******************')
                        $('#divAutoComp_' + _this.id).find('input').removeClass('error') ;
                    },
                    error: function (data) {
                        _this.termError = true;
                        console.info('***************************erreur de validation*******************')
                        $('#divAutoComp_' + _this.id).find('input').addClass('error') ;
                    }
                });
        },

    }, {
        template: '<div class="tmp"><input id="<%=inputID%>" name="<%=inputID%>" class="autocompTree <%=editorClass%>" type="text" placeholder="" <%=editorAttrs%>></div>',
    });


});
