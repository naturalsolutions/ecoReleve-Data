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
            'change': 'onChange',
        },

        onChange: function(e){
            var value = this.$el.find('#' + this.id).val();
            if (!value){
              value = null;
              this.$el.find('#' + _this.id + '_value').val(value);

            }
            this.validateValue(value);
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
            this.schema = options.schema;
            if(this.value instanceof Object){
                this.value = this.value.value;
            }

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
              if(_this.value){
                _this.$el.find('#' + _this.id).addClass('error');
                }
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

                        var value = _this.$el.find('#' + _this.id).val();
                        _this.validateValue(value);
                    },

                    onInputInitialize: function(options){
                        if(_this.value != null){
                          if(_this.value instanceof Object){
                              _this.translateValue(_this.value.value);
                          } else {

                            _this.$el.find('#' + _this.id + '_value').val(_this.value);
                            _this.translateValue(_this.value);
                          }
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

                if (_this.value != null) {
                  if(_this.value instanceof Object){
                    var displayValue = _this.value.displayValue;
                  } else {
                    var displayValue = _this.translateValue(_this.value);
                  }
                  _this.$el.find('#' + _this.id).val(displayValue);
                  // _this.$el.find('#' + _this.id + '_value').val(_this.value.value);
                }
            } else {

              var TypeField = 'FullPath';
              if (_this.value && _this.value.indexOf('>') == -1) {
                TypeField = 'Name';
              }
              var data = {
                sInfo: _this.value,
                sTypeField: TypeField,
                iParentId: _this.startId,
                lng: _this.lng //language
              };

              var url = _this.wsUrl + '/getTRaductionByType';

              $.ajax({
                url: url,
                data: JSON.stringify(data),
                dataType: 'json',
                type: 'POST', //should be a GET
                contentType: 'application/json; charset=utf-8',
                context: this,
                success: function (data){
                  if(data['TTop_FullPath'] != null){
                    var values = {
                      value: data['TTop_FullPath'],
                      displayValue: data['TTop_NameTranslated']
                    };
                    _this.$el.find('#' + _this.id).val(values.displayValue);
                    _this.$el.find('#' + _this.id + '_value').val(values.value);
                  } else {
                    _this.$el.find('#' + _this.id).val(_this.value);
                    _this.$el.find('#' + _this.id + '_value').val(_this.value);
                  }
                }
              });
            }
            //set inital values

            }).defer();

            return this;
        },

        isEmptyVal: function(value){
            if (value == null ) {
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

            if(displayValue =='' || valueFound){
                //set value
                value = '';
                if(displayValue != '' ) {
                  value = valueFound.data.fullpath
                }
                this.$el.find('#' + this.id + '_value').val(value);

                this.isTermError = false;
                this.displayError(false);

            } else{
                this.displayError(true);
            }
        },

        translateValue: function(value) {
          var valueFound = this.$el.find('#treeView' + this.id).fancytree('getTree').findFirst(function(node){
              if(node.data.fullpath == value){
                  return true;
              }
          });

          if(valueFound) {
              //set value
              value = valueFound.data.valueTranslated;
              this.$el.find('#' + this.id + '_value').val(value);

              this.isTermError = false;
              this.displayError(false);

          } else {
              this.displayError(true);
          }
          return value;
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
