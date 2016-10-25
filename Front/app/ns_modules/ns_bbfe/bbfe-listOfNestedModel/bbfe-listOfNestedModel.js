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

        },
        //removeForm
        deleteForm: function() {
            this.$el.trigger('change');
        },

        addEmptyForm: function() {
            var mymodel = Backbone.Model.extend({
                defaults : this.options.schema.subschema.defaultValues
            });

            var model = new mymodel();
            //model.default = this.options.model.attributes[this.key];
            model.schema = this.options.schema.subschema;
            model.fieldsets = this.options.schema.fieldsets;
            //this.$el.find('.badge').html(this.model.attributes[this.schema.name].length);
            this.addForm(model);
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
        addForm: function(model){
            var _this = this;
            var form = new Backbone.Form({
                model: model,
                fieldsets: model.fieldsets,
                schema: model.schema
            }).render();

            this.forms.push(form);
            this.$el.find('.js_badge').html(this.forms.length);

            if (this.schema.editorClass === "form-control" ) {
              form.$el.find('fieldset').append('<button type="button"  class="btn btn-default display js_index_subForm" >'+this.indexPresent(form,0,this.forms)+'</button>')
            }
            form.$el.find('fieldset').append('\
                <div class="' + this.hidden + ' col-xs-12 control">\
                    <button type="button" class="btn btn-warning pull-right" id="remove">-</button>\
                </div>\
            ');

            form.$el.find('button#remove').on('click', function() {
              _this.$el.find('#formContainer').find(form.el).remove();
              var i = _this.forms.indexOf(form);
              if (i > -1) {
                  _this.forms.splice(i, 1);
                  _this.$el.find('.js_badge').html(_this.forms.length);
              }

              _this.$el.trigger('change');
              if(!_this.forms.length){
                _this.addEmptyForm();
              }
              alert("boom on a clique sur delete");
              var tabBtn = $('.js_index_subForm');//_this.$el.find('.js_index_subForm');
              console.log(tabBtn);
              for( var tmp of tabBtn) {
                console.log(tabBtn[tmp]);
              }

              return;
            });


            this.$el.find('#formContainer').append(form.el);

            this.$el.find('#formContainer input,select,textarea').on("change", function(e) {
                 window.app.checkFormSaved = true;
            });
        },

        render: function() {
            //Backbone.View.prototype.initialize.call(this, options);
            var $el = $($.trim(this.template({
                hidden: this.hidden,
                id: this.id,
                name: this.key
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

                    };

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
            };
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
                };
                return values;
            }


        },
        }, {
          //STATICS
          template: _.template('\
            <div id="<%= id %>" name="<%= name %>" class="required nested clearfix">\
                <% if (this.schema.editorClass === "form-control" ) {  %>\
                <span>Nb Sub Protocol <span class="js_badge badge">0</span> </span>\
                <% } %>\
                <button type="button" id="addFormBtn" class="<%= hidden %> btn pull-right">+</button>\
                <div class="clear"></div>\
                <div id="formContainer"   class="clearfix"></div>\
                <br />\
                <button type="button" id="addFormBtn" class="<%= hidden %> btn pull-right">+</button>\
            </div>\
            ', null, Form.templateSettings),
      });

});
