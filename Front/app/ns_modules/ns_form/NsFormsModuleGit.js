define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone-forms',
  'sweetAlert',
  'requirejs-text!./Templates/NsFormsModule.html',
  'fancytree',
  './NsFormsCustomFields',
], function ($, _, Backbone, Marionette, BackboneForm, Swal, tpl) {
  return Backbone.View.extend({
    BBForm: null,
    modelurl: null,
    Name: null,
    objectType: null,
    displayMode: null,
    buttonRegion: null,
    formRegion: null,
    id: null,
    reloadAfterSave: false,
    template: tpl,
    redirectAfterPost: '',
    displayDelete: true,

    events : {
      'keypress input' : 'evt'

    },
    evt : function(){
      alert();
    },
    extendsBBForm: function(){
      Backbone.Form.validators.errMessages.required = '';
      Backbone.Form.Editor.prototype.initialize = function(options){
        var options = options || {};

        //Set initial value
        if (options.model) {
          if (!options.key) throw new Error("Missing option: 'key'");

          this.model = options.model;

          this.value = this.model.get(options.key);
        } else if (options.value !== undefined) {
          this.value = options.value;
        }

        if (this.value === undefined) this.value = this.defaultValue;

        //Store important data
        _.extend(this, _.pick(options, 'key', 'form'));

        var schema = this.schema = options.schema || {};

        this.validators = options.validators || schema.validators;

        //Main attributes
        this.$el.attr('id', this.id);
        //bug with same name
        this.$el.attr('name', this.getName());
        if (schema.editorClass) this.$el.addClass(schema.editorClass);
        if (schema.editorAttrs) this.$el.attr(schema.editorAttrs);

        if(options.schema.validators && options.schema.validators[0] == "required"){
          this.$el.addClass('required');
        }

      };
    },

    initialize: function (options) {
      this.extendsBBForm();

      var jqxhr;
      this.modelurl = options.modelurl;

      this.name = options.name;
      this.buttonRegion = options.buttonRegion;
      this.formRegion = options.formRegion;


      if(options.displayDelete != undefined){
        this.displayDelete = options.displayDelete;
      }

      this.reloadAfterSave = options.reloadAfterSave || this.reloadAfterSave;
      // The template need formname as vrairable, to make it work if several NSForms in the same page
      // With adding formname, there will be no name conflit on Button class
      var variables = { formname: this.name };
      if (options.template) {
        // if a specific template is given, we use it
        this.template = _.template($(options.template).html(), variables);
      }
      else {
        // else use default template
        this.template = _.template($(tpl).html(), variables);
      }

      if (options.id && !isNaN(options.id)) {
        this.id = options.id;
      }
      else {
        this.id = 0;
      }

      if(options.displayMode){
        this.displayMode = options.displayMode;
      }

      if (options.objectType) {
        this.objectType = options.objectType;
      }
      else {
        this.objectType = null;
      }
      this.objectType = options.objectType;

      if (options.model) {
        this.model = options.model;
        this.BBForm = new BackboneForm({ 
          model: this.model,
          data: this.model.data,
          fieldsets: this.model.fieldsets,
          schema: this.model.schema
        });
        this.showForm();
      }
      else {
        this.initModel();
      }

      if (options.redirectAfterPost){
        // allow to redirect after creation (post) using the id of created object
        this.redirectAfterPost = options.redirectAfterPost;
      }
      this.afterShow = options.afterShow;
      if (options.afterSaveSuccess){
        this.afterSaveSuccess = options.afterSaveSuccess ;
      }
      if(options.savingError) {
        this.savingError =options.savingError;
      }

      $(this.BBForm).on( "click", function() {
        alert();
      });
    },

    initModel: function () {
      var _this = this;

      if (!this.model) {
        this.model = new Backbone.Model();
      }

      if (this.model.attributes.id ) {
        id = this.model.attributes.id;
      } else {
        id = this.id;
      }

      var url = this.modelurl + '/' + id;

      this.name = '_' + this.objectType + '_';

      //initialize model from AJAX call
      this.jqxhr = $.ajax({
        url: url,
        context: this,
        type: 'GET',
        data: {
          FormName: this.name,
          ObjectType: this.objectType,
          DisplayMode: this.displayMode
        },
        dataType: 'json',
        success: function (resp) {
          _this.model.schema = resp.schema;
          _this.model.attributes = resp.data;
          if (resp.fieldsets) {
            // if fieldset present in response, we get it
            _this.model.fieldsets = resp.fieldsets;
          }
          // give the url to model to manage save
          _this.model.urlRoot = this.modelurl;
          _this.BBForm = new BackboneForm({ model: _this.model, data: _this.model.data, fieldsets: _this.model.fieldsets, schema: _this.model.schema });
          _this.showForm();
          _this.updateState(this.displayMode);
        },
        error: function (data) {
          console.warn('request error');
          //alert('error Getting Fields for Form ' + this.name + ' on type ' + this.objectType);
        }
      });
    },

    showForm: function (){
      var self = this;
      var display = 'form';
      this.BBForm.render();
      var el = this.BBForm.el;
      if(display=='table'){
        el = this.getHtmlTable(el);
      }
      //console.log(this.BBForm.el);
      // Call extendable function before the show call
      this.BeforeShow();
      var _this = this;

      this.formRegion.html(el); //this.formRegion.html(this.BBForm.el);
      $(this.formRegion).find('input').on("keypress", function(e) {
        if( e.which == 13 ){
          self.butClickSave(e);
        }
      });
      if(this.buttonRegion[0]){
        this.buttonRegion.forEach(function (entry) {
          _this.buttonRegion[0].html(_this.template);
          _this.buttonRegion[0].i18n();
        });

        if(this.buttonRegion[0]){
          this.displaybuttons();
          this.bindEvents();
        }
      }

      if (this.afterShow) {
        this.afterShow();
      }
    },

    updateState: function(state){

    },


    displaybuttons: function () {
      var name = this.name;
      if(this.displayMode == 'edit'){
        this.buttonRegion[0].find('.NsFormModuleCancel').removeClass('hidden');
        this.buttonRegion[0].find('.NsFormModuleSave').removeClass('hidden');
        this.buttonRegion[0].find('.NsFormModuleClear').removeClass('hidden');
        this.buttonRegion[0].find('.NsFormModuleEdit').addClass('hidden');
        this.formRegion.find('input:enabled:first').focus();
      }else{
        this.buttonRegion[0].find('.NsFormModuleCancel').addClass('hidden');
        this.buttonRegion[0].find('.NsFormModuleSave').addClass('hidden');
        this.buttonRegion[0].find('.NsFormModuleClear').addClass('hidden');

        this.buttonRegion[0].find('.NsFormModuleEdit').removeClass('hidden');
      }

      //need a fix
      if(!this.model.attributes.id){
        this.buttonRegion[0].find('.NsFormModuleCancel').addClass('hidden');
      }

    },

    /*afterShow: function(){

    },*/


    butClickSave: function (e) {
      var _this = this;
      var errors = this.BBForm.commit();
      var jqhrx;


      if(!errors){
          if (this.model.attributes["id"] == 0) {
            // To force post when model.save()
          this.model.attributes["id"] = null;
        }
        this.onSavingModel();
        if (this.model.id == 0) {
          // New Record
          jqhrx = this.model.save(null, {
            success: function (model, response) {
              // Getting ID of created record, from the model (has beeen affected during model.save in the response)
              _this.savingSuccess(model, response);
              _this.id = _this.model.id;
              
              if (_this.redirectAfterPost != "") {
                // If redirect after creation
                var TargetUrl = _this.redirectAfterPost.replace('@id', _this.id);

                if (window.location.href == window.location.origin + TargetUrl) {
                  // if same page, relaod
                  window.location.reload();
                }
                else {
                  // otpherwise redirect
                  window.location.href = TargetUrl;
                }

              }
              else {
                // If no redirect after creation
                if (_this.reloadAfterSave) {
                  _this.reloadingAfterSave();
                }
              }
              _this.afterSaveSuccess();
              return true;
            },
            error: function (response) {
              _this.savingError(response);
              return false;
            }

          });
        }
        else {
          // After update of existing record
          this.model.id = this.model.get('id');
          var jqxhr = this.model.save(null, {
            success: function (model, response) {
              _this.savingSuccess(model, response);
              if (_this.reloadAfterSave) {
                _this.reloadingAfterSave();
              }
              _this.afterSaveSuccess();
            },
            error: function (response) {
              _this.savingError(response);
            }
          });
          
        }
      }else{
        _this.BBForm.$el.find('.error:first').trigger('focus');
        return false;
      }
      this.afterSavingModel();
      return jqxhr;
    },

    afterSaveSuccess: function(){

    },


    butClickEdit: function (e) {
      this.displayMode = 'edit';
      this.initModel();
      if(this.buttonRegion[0])
      this.displaybuttons();
    },
    butClickCancel: function (e) {
      this.displayMode = 'display';
      this.initModel();
      if(this.buttonRegion[0])
      this.displaybuttons();
    },
    butClickClear: function (e) {
      var formContent = this.BBForm.el;
      $(formContent).find('input').val('');
      $(formContent).find('select').val('');
      $(formContent).find('textarea').val('');
      $(formContent).find('input[type="checkbox"]').attr('checked', false);
    },

    butClickDelete: function(){
      var _this = this;
      var opts = {
        title : 'Are you sure?',
        showCancelButton: true,
        type: 'warning',
        confirmButtonText: 'Yes, delete it!',
        confirmButtonColor: '#DD6B55',
        callback : function(){
          _this.afterDelete();
        }
      };

      this.swal(opts);
    },


    afterDelete: function(){
      
    },


    reloadingAfterSave: function () {
      this.displayMode = 'display';
      // reaload created record from AJAX Call
      this.initModel();
      this.showForm();
      if(this.buttonRegion[0])
      this.displaybuttons();
    },

    onSavingModel: function () {
      // To be extended, calld after commit before save on model
    },
    afterSavingModel: function () {
      // To be extended called after model.save()
    },
    BeforeShow: function () {
      // to be extended called after render, before the show function
    },

    savingSuccess: function (model, response) {
      // To be extended, called after save on model if success
    },
    savingError: function (response) {
      // To be extended, called after save on model if error
    },


    bindEvents: function(){
      var _this = this;
      var name = this.name;

      /*==========  Edit  ==========*/
      this.onEditEvt = $.proxy(function(e){
        this.butClickEdit();
      }, this);

      this.buttonRegion[0].find('.NsFormModuleEdit').on('click', this.onEditEvt);

      /*==========  Cancel  ==========*/
      this.onCancelEvt = $.proxy(function(e){
        this.butClickCancel();
      }, this);

      this.buttonRegion[0].find('.NsFormModuleCancel').on('click', this.onCancelEvt);

      /*==========  save  ==========*/
      this.onSaveEvt = $.proxy(function(){
        this.butClickSave();
      }, this);

      this.buttonRegion[0].find('.NsFormModuleSave').on('click', this.onSaveEvt);

      /*==========  Clear  ==========*/
      this.onClearEvt = $.proxy(function(){
        this.butClickClear();
      }, this);

      this.buttonRegion[0].find('.NsFormModuleClear').on('click', this.onClearEvt);

      /*==========  Delete  ==========*/
      if(this.displayDelete){
        this.onDeleteEvt = $.proxy(function(){
          this.butClickDelete();
        }, this);

        this.buttonRegion[0].find('.NsFormModuleDelete').on('click', this.onDeleteEvt);
      }else{
        this.buttonRegion[0].find('.NsFormModuleDelete').addClass('hidden');
      }
    },


    unbind: function(){

      var _this = this;
      var name = this.name;

      this.buttonRegion[0].find('.NsFormModuleDelete').off('click', this.onEditEvt);
      this.buttonRegion[0].find('.NsFormModuleDelete').off('click', this.onCancelEvt);
      this.buttonRegion[0].find('.NsFormModuleDelete').off('click', this.onSaveEvt);
      this.buttonRegion[0].find('.NsFormModuleDelete').off('click', this.onClearEvt);
      this.buttonRegion[0].find('.NsFormModuleDelete').off('click', this.onDeleteEvt);
    },

    destroy: function(){
      if(this.buttonRegion[0]){
        this.unbind();
      }
    },


    swal: function(opts){
      Swal({
        title: opts.title || opts.responseText || 'error',
        text: opts.text || '',
        type: opts.type,
        showCancelButton: opts.showCancelButton,
        confirmButtonColor: opts.confirmButtonColor,
        confirmButtonText: opts.confirmButtonText,
        closeOnConfirm: opts.closeOnConfirm || true,
      },
      function(isConfirm){
        //could be better
        if(opts.callback && isConfirm){
          opts.callback();
        }
      });
    },
    getHtmlTable : function(el){
      var headtr = '<tr>';
      var bodytr = '<tr>'; 
      $(el).find('fieldset').each(function( i ) {
            var j = 0 ;
            $(this).children().each(function(){
                // check if we have a  form field 
                var labelElem = $(this).find('label')[0];
                if(labelElem) {
                  headtr += '<td>' + labelElem.textContent +'</td>';
                  var content = $(this).children('div')[0].outerHTML;
                   bodytr += '<td>' + content +'</td>';
                }
            });
      });
      headtr += '</tr>';
      bodytr += '</tr>';
      var table = '<table id="formTable"><thead>' + headtr +'</thead>  <tbody> ' + bodytr +'</tbody></table>';
      return table;
    }
  });

});
