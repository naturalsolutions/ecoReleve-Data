define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone-forms',

  ], function ($, _, Backbone, Marionette, Form, List, tpl) {

    'use strict';
    return Form.editors.ListOfNestedModel = Form.editors.Base.extend({
        events: {
            'click #addFormBtn' : 'addEmptyForm',
        },
        initialize: function(options) {

            if (options.schema.validators.length) {
                this.defaultRequired = true;
            } else {
                options.schema.validators.push('required');
                this.defaultRequired = false;
            }

            Form.editors.Base.prototype.initialize.call(this, options);

            this.template = options.template || this.constructor.template;
            this.options = options;
            this.options.schema.fieldClass = 'col-xs-12';
            this.forms = [];
            this.disabled = options.schema.editorAttrs.disabled;

            this.hidden = '';
            if(this.disabled) {
                this.hidden = 'hidden';
            }
            this.hasNestedForm = true;

            this.key = this.options.key;
            this.nbByDefault = this.options.model.schema[this.key]['nbByDefault'];
            this.addButtonClass = 'pull-right';
            if (this.options.schema.editorClass == 'nested-unstyled'){
                this.addButtonClass = '';
            }


        },
        deleteForm: function() {
            this.$el.trigger('change');
        },

        addEmptyForm: function() {
            if (this.getValue()){
                var mymodel = Backbone.Model.extend({
                    defaults : this.options.schema.subschema.defaultValues
                });
    
                var model = new mymodel();
                model.schema = this.options.schema.subschema;
                model.fieldsets = this.options.schema.fieldsets;
                this.addForm(model);

            }
        },

        indexPresent : function (elem, index, array) {
          var cpt = -1
          while (index < array.length ) {
            if (array[index].cid === elem.cid ) {
               cpt = index;
            }
            index+=1;
          }
          return cpt;
        },
        subFormChange: function(){
            this.$el.change();
        },

        bindChanges: function(form){
          var _this = this;
          form.$el.find('input').on("change", function(e) {
              _this.formChange = true;
              _this.subFormChange();

          });
          form.$el.find('select').on("change", function(e) {
              _this.formChange = true;
              _this.subFormChange();
          });
          form.$el.find('textarea').on("change", function(e) {
              _this.formChange = true;
              _this.subFormChange();

          });
        },

        addForm: function(model){
            var _this = this;
            model.set('FK_Station',this.options.model.get('FK_Station'));
            var form = new Backbone.Form({
                model: model,
                fieldsets: model.fieldsets,
                schema: model.schema
            }).render();
            this.forms.push(form);
            var labels = form.$el.find('label');

            if (this.options.schema.editorClass.indexOf("form-control")==-1 ){

                form.$el.addClass(this.options.schema.editorClass);
            }
            _.each(labels, function(label){
                if(label.innerText.trim().replace('*','') == ''){
                    $(label).remove();
                }
            });

            setTimeout( function() { //
              if (_this.schema.editorClass.indexOf("form-control") != -1 ) {
                _this.form.$el.find(".js_badge").css({'display': '','margin-left': '5px'})
              }
              _this.form.$el.find(".js_badge").html(_this.forms.length);
            },0);
            if (this.schema.editorClass.indexOf("form-control") != -1 ) {
              form.$el.find('fieldset').prepend('<div class="col-md-12 js_container_index_subForm"><a role="button"  class="js_index_subForm" >'+parseInt(this.indexPresent(form,0,this.forms)+1)+'</button></div>')
            }
            var buttonClass = 'pull-right';
            if (form.$el.hasClass('nested-unstyled')){
                buttonClass = '';
            }
            form.$el.find('fieldset').append('\
                <div class="' + this.hidden + ' control">\
                    <button type="button" class="btn btn-warning '+buttonClass+'" id="remove">-</button>\
                </div>\
            ');

            form.$el.find('button#remove').on('click', function() {
              _this.$el.find('#formContainer').find(form.el).remove();
              var i = _this.forms.indexOf(form);
              if (i > -1) {
                _this.forms.splice(i, 1);
                _this.form.$el.find(".js_badge").html(_this.forms.length);
              }
              _this.subFormChange();
              if(!_this.forms.length){
                _this.addEmptyForm();
              }

              var tabBtn = $('.js_index_subForm');
              var tmp = i;
              while( tmp <= tabBtn.length) {
                $(tabBtn[tmp]).text(tmp+1)
                tmp+=1;
              }
              return;
            });

            this.$el.find('#formContainer').append(form.el);
            this.bindChanges(form);
        },

        render: function() {
            //Backbone.View.prototype.initialize.call(this, options);
            var $el = $($.trim(this.template({
                hidden: this.hidden,
                id: this.id,
                name: this.key,
                addButtonClass: this.addButtonClass
            })));
            this.setElement($el);
            var data = this.options.model.attributes[this.key];
            if (data) {
                //data
                if (data.length) {
                    for (var i = 0; i < data.length; i++) {
                        if(i >= this.nbByDefault) {
                            this.defaultRequired = false;
                        }
                        var model = new Backbone.Model();
                        model.schema = this.options.schema.subschema;
                        model.fieldsets = this.options.schema.fieldsets;
                        model.attributes = data[i];
                        this.addForm(model);
                    }

                    if (data.length < this.nbByDefault) {
                        for (var i = 0; i < data.length; i++) {
                          this.addForm(model);
                        }
                    }
                    this.defaultRequired = false;
                }
            } else {
                //no data
                if (this.nbByDefault >= 1) {
                    for (var i = 0; i < this.nbByDefault; i++) {
                        this.addEmptyForm();
                    }
                    this.defaultRequired = false;
                }
            }
            return this;
        },

        feedRequiredEmptyForms: function() {
        },

        getValue: function() {
            var errors = false;
            for (var i = 0; i < this.forms.length; i++) {
                if (this.forms[i].commit()) {
                    errors = true;
                }
            }
            if (errors) {
                return false;
            } else {
                var values = [];
                for (var i = 0; i < this.forms.length; i++) {
                    var tmp = this.forms[i].getValue();
                    var empty = true;
                    for (var key in tmp) {
                        if(tmp[key]){
                            empty = false;
                        }
                    }
                    if(!empty){
                       /* if (this.defaultValue) {
                            tmp['FK_ProtocoleType'] = this.defaultValue;
                        }*/
                        values[i] = tmp;
                    }
                }
                return values;
            }
        },
        }, {
          //STATICS
                //<button type="button" id="addFormBtn" class="<%= hidden %> btn pull-right" style="margin-bottom:10px">+</button>\
          //
          template: _.template('\
            <div id="<%= id %>" name="<%= name %>" class="required nested clearfix">\
                <div class="clear"></div>\
                <div id="formContainer"   class="clearfix"></div>\
                <div>\
                    <div id="addDiv" class="col-md-6" ></div>\
                    <button type="button" id="addFormBtn" class="<%= hidden %> btn <%= addButtonClass %>" style="margin-top:10px">+</button>\
                </div>\
            </div>\
            ', null, Form.templateSettings),
      });

});
