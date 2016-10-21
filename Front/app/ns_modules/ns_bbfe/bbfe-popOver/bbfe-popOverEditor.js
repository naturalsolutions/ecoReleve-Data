define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone-forms',
  'ns_modules/ns_bbfe/bbfe-autocompTree',

], function ($, _, Backbone, Marionette, Form,autocompTree, List, tpl) {

    'use strict';
    return Form.editors.PopOverEditor = Form.editors.Base.extend({
        events: {
            'click span.popOverPicker':'displayPopOver',
            'hidden.bs.popover': 'unbind'
        },

        unbind : function(evt){
          $('html').unbind('click');
        },
        displayPopOver:function(ev){
          if (!this.alreadyOpen){
            var _this = this;
            //this.$el.find('#myBtn').on('click',_this.save);
            this.initForm();
            this.popForm.render().$el.append('<div class="popover-btn js-save"><button id="popOverSave" class="btn btn-success">Save</button></div>');
            var options = {
              html: true,
              content : this.popForm.el,
              placement:'bottom',
              container:'body',
              //trigger: 'focus'
            };
            this.popForm.$el.find('.popover-btn.js-save').on('click',_this.save.bind(_this));
            this.$el.popover(options);
            this.$el.popover('toggle');
            this.alreadyOpen = true;
            $('html').bind('click', _this.closePopOver.bind(_this));
          }
          // this.$el.on('blur',function(){
          //   _this.$el.popover('destroy');
          // });
        },

        closePopOver: function(e){
          var _this = this;
          console.log('closePopOver',e);
          $('span[toggle-editor="popOver_'+this.key+'"]').each(function () {
            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                _this.$el.popover('hide');

            }
          });
        },

        save: function(evt){
          evt.preventDefault();
          this.form.parentForm.butClickSave(evt);
          this.$el.popover('hide');
        },

        initForm: function(editMode) {
          var data = this.options.model.attributes[this.key];
          var model = new Backbone.Model();
          model.schema = this.options.schema.subschema;
          model.fieldsets = this.options.schema.fieldsets;

          var modelBis = _.clone(model);
          for (var i in modelBis.schema){
            if(editMode && editMode=='display'){
              modelBis.schema[i].editorAttrs = {disabled: true};
            } else {
              modelBis.schema[i].editorAttrs = {disabled: false};
            }
          }
          this.popForm = new Backbone.Form({
            model: model,
            fieldsets: model.fieldsets,
            schema: model.schema
          });
          return this.popForm;
        },
        initialize: function(options) {
          this.alreadyOpen = false;
            if (options.schema.validators.length) {
                this.defaultRequired = true;
            } else {
                options.schema.validators.push('required');
                this.defaultRequired = false;
            }
            Form.editors.Base.prototype.initialize.call(this, options);

            this.template = options.template || this.constructor.template;
            this.options = options;
            //this.options.schema.fieldClass = 'col-xs-12';
            this.forms = [];
            //this.disabled = options.schema.editorAttrs.disabled;

            this.hidden = '';
            // if(this.disabled) {
            //     this.hidden = 'hidden';
            // }
            this.hasNestedForm = true;

            this.key = this.options.key;
        },

        render: function() {
          var _this = this;
          var data = this.options.model.attributes[this.key];
          console.log(this.options.schema.options);
          if (this.options.schema.subschema.defaultValues){
            delete this.options.schema.subschema.defaultValues;
          }
          /// to TEST
          // this.options.schema.options = {
          //   target : 'Monitoring_Status'
          // };
          this.target = this.options.schema.options.target;
          // this.options.schema.subschema = {
          //   "Monitoring_Status": {
          //     "options": {
          //       "iconFont": "reneco reneco-thesaurus",
          //       "lng": "en",
          //       "startId": "1204531",
          //       "displayValueName": "valueTranslated",
          //       "wsUrl": "http://127.0.0.1/ThesaurusNew/api/thesaurus"},
          //       "fullPath": true,
          //       "validators": [],
          //       "editable": true,
          //       "editorClass": "form-control displayInput",
          //       "name": "Monitoring_Status",
          //       "type": "AutocompTreeEditor",
          //       "title": "Monitoring status",
          //       "fieldClass": "None col-md-12",
          //       "defaultValue": null,
          //       "editorAttrs": {"disabled": false},
          //       "size": 4
          //     },"StartDate":{
          //       "options": {"format": "DD/MM/YYYY"},
          //        "fullPath": true,
          //         "validators": [],
          //          "editable": true,
          //        "editorClass": "form-control displayInput",
          //         "name": "StartDate",
          //         "type": "DateTimePickerEditor",
          //          "title": "Start Date",
          //         "fieldClass": "None col-md-12",
          //         "defaultValue": null,
          //          "editorAttrs": {"disabled": false}, "size": 4
          //        }
          // };
          //   //Backbone.View.prototype.initialize.call(this, options);
            var $el = $($.trim(this.template({
              value : data,
              hidden: this.hidden,
              id: this.id,
              name: this.key,
              editable:false,
              disabled:'disabled',
              editorClass: "form-control displayInput" ,
              iconClass: 'reneco reneco-edit'
            })));
          //  var editor = new Backbone.Form({});

            if (this.options.schema.editorAttrs.disabled){
              this.formm = this.initForm('display');
              var editor = this.formm.getEditor(this.target).render();
              editor.$el.find('input').parent().append($el);

            } else {
              this.formm = this.initForm('edit');
              var editor = this.formm.getEditor(this.target).render();
            }

            editor.setValue(data);
            this.setElement(editor.$el);
            //this.displayPopOver();
            return this;
        },

        getValue: function() {
          var errors = this.popForm.commit();
          if (!errors && this.options.schema.editorAttrs.disabled ) {
            return this.popForm.getValue();
          } else {
            return this.formm.getEditor(this.target).getValue();
          }
        },
        }, {
          //STATICS
          template: _.template('<span class="input-group-addon popOverPicker" toggle-editor="popOver_<%=name%>">'
              +'<span class="<%=iconClass%> "></span></span>', null, Form.templateSettings),
      });

});
