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
            /*
            $.when(defered).done(function() {
            });*/
            return retour ;
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
            this.validators = options.schema.validators || [] ;
            
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
            var date = new Date
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
                    wsUrl: _this.wsUrl + '/ThesaurusREADServices.svc/json',
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
                    /*
                    onInputBlur : function (options) {
                        var value = $('#' + _this.id).val() ;
                        console.log(' ************ validation sur click *****************',value,_this,_this.id);
                        _this.onEditValidation(value) ;
                    },
                    */
                    onItemClick:function (options) {
                        /*var value = $('#' + _this.id).val() ;
                        console.log(' ************ validation sur click *****************',value,_this,_this.id);
                        _this.onEditValidation(value) ;*/
                        //console.log(' ************ validation sur click *****************',_this,_this.id);
                        //$('#divAutoComp_' + _this.id).removeClass('error') ;
                    }
                });
                
                
                var TypeField = "FullPath";
                if (_this.value && _this.value.indexOf(">") == -1) {
                    TypeField = 'Name';
                }
                var valeur = _this.value || '';
                $.ajax({
                    url: _this.wsUrl + "/ThesaurusReadServices.svc/json/getTRaductionByType",
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
                    
                    /*
                    _this.$el.find('#treeView' + _this.id).hide(function(options) {
                        var value = $('#' + _this.id).text() ;
                        console.log(' ************ validation sur click *****************',value);
                        _this.onEditValidation(value) ;
                    }) ;
                    */
                }
                _this.FirstRender = false ;
            }).defer();

    

            return this;
        },
        onEditValidation: function (value) {
            var _this = this ;
            console.log('Validation on edit ',value,'finvalue') ;
            console.log(value) ;
            if (value == null || value == '')  {
                $('#divAutoComp_' + _this.id).removeClass('error') ;
                return ;
            }
            console.log('Validation on edit Value pas vide ') ;
            
                var TypeField = "FullPath";
                if (value && value.indexOf(">") == -1) {
                    TypeField = 'Name';
                }
                var erreur ;

                $.ajax({
                    url: _this.wsUrl + "/ThesaurusReadServices.svc/json/getTRaductionByType",
                    timeout: 3000,
                    data: '{ "sInfo" : "' + value + '", "sTypeField" : "' + TypeField + '", "iParentId":"' + _this.startId + '" }',
                    dataType: "json",
                    type: "POST",
                    //async:false,
                    contentType: "application/json; charset=utf-8",
                    success: function (data) {
                        console.log('***************************validation OK*******************')
                        $('#divAutoComp_' + _this.id).removeClass('error') ;
                    },
                    error: function (data) {
                        console.log('***************************erreur de validation*******************')
                        $('#divAutoComp_' + _this.id).addClass('error') ;
                    }
                });
        },

    }, {
        template: '<div><input id="<%=inputID%>" name="<%=inputID%>" class="autocompTree <%=editorClass%>" type="text" placeholder="" <%=editorAttrs%>></div>',
    });


});
