define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone-forms',
  'sweetAlert',
  'ns_ruler/ruler',
  'requirejs-text!./NsFormsModule.html',
  'fancytree',
  './NsFormsCustomFields',

], function ($, _, Backbone, Marionette, BackboneForm, Swal,Ruler, tpl) {
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
      var _this = this;
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

      this.afterDelete = options.afterDelete || false;

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
      if(options.loadingError){
        this.loadingError = options.loadingError;
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
        this.pushFormInEdit(this);

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
        this.savingError = options.savingError;
      }

      this.data = options.data || {};
      var _this = this;

      // $(this.BBForm).on( "click", function() {
      //
      // });
    },

    pushFormInEdit: function(_this){

        this.formChange = false;
        if(!window.formInEdition.form){
            window.formInEdition.form = {baseUri: _this.$el[0].baseURI};
            window.formInEdition.form[_this.formRegion.selector]= _this;
        } else {
            if(window.formInEdition.form['undefined']){
              delete window.formInEdition.form['undefined'];
            }
          window.formInEdition.form[_this.formRegion.selector] = _this;
          window.formInEdition.form.baseUri = _this.$el[0].baseURI;
          if(_this.displayMode && _this.displayMode.toLowerCase() == 'edit'){
              _this.bindChanges();
          }
        }
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
          if (resp.fieldsets) {
            // if fieldset present in response, we get it
            _this.model.fieldsets = resp.fieldsets;
          }
          // give the url to model to manage save
          _this.model.urlRoot = this.modelurl;

          var settings = $.extend({}, _this.data, resp.data); //?
          _this.model.attributes = settings;

          _this.BBForm = new BackboneForm({ model: _this.model, data: _this.model.data, fieldsets: _this.model.fieldsets, schema: _this.model.schema });
          _this.showForm();
          _this.pushFormInEdit(_this);
          _this.updateState(this.displayMode);
        },
        error: function (data) {
          //console.warn('request error');
          _this.loadingError();
          //alert('error Getting Fields for Form ' + this.name + ' on type ' + this.objectType);
        }
      });
    },

    initRules:function() {
      var _this = this;
      this.ruler = new Ruler({
            form: _this.BBForm
          });
      var globalError = {};
      var errorMsg = 'error on field(s): \n';

      _.each(this.BBForm.schema,function(curSchema){
        if (curSchema.rule){
          var curRule = curSchema.rule;
          var target = curSchema.name;
          var curResult = _this.ruler.addRule(target,curRule.operator,curRule.source,curRule.value);
          if (curResult) {
            globalError[target] = curResult;
            errorMsg +=  curResult.object + ':  '+curResult.message+'\n' ;
          }
        }
      });

      if (!$.isEmptyObject(globalError) && this.displayMode == 'edit'){
        this.swal({
          title : 'Rule error',
          text : errorMsg,
          type:'error',
          showCancelButton: false,
          confirmButtonColor:'#DD6B55',
          confirmButtonText:'Ok'});
      }
    },

    bindChanges: function(DOMele){
      var _this = this;
      var formRegion = this.formRegion;

      if (DOMele){
        formRegion = DOMele;
      }
      $(formRegion).find('input').on("change", function(e) {
        if($(e.target).val() !== ''){
          _this.formChange = true;
        } else {
          _this.formChange = false;
       }
      });      

      $(formRegion).find('.dateTimePicker>input').parent().on("dp.change", function(e) {
        _this.formChange = true;
      });

      $(formRegion).find('input').on("thesaurusChange", function(e) {
        if($(e.target).val() !== ''){
          _this.formChange = true;
        } else {
          _this.formChange = false;
       }
      });
      $(formRegion).find('select').on("change", function(e) {
        _this.formChange = true;
      });
      $(formRegion).find('textarea').on("change", function(e) {
         _this.formChange = true;
      });
      $(formRegion).find('.sub-grid-form').on("change", function(e) {
         _this.formChange = true;
      });
      $(formRegion).find('.nested').on("change", function(e) {
         _this.formChange = true;
      });

      $(formRegion).find('textarea').on("keypress", function(e) {
        var maxlen = 250;
        var self = this;
        if ($(this).val().length > maxlen) {
          return false;
        }  else {
          _this.cleantextAreaAfterError(this);
        }
      });
      $(formRegion).find('textarea').on('keyup', function (e) {
        var maxlen = 250;
        var strval = $(this).val();
        var self = this;
        if ($(this).val().length > maxlen) {
           _this.showErrorForMaxLength(this);
          return false;
        }
      });
      $(formRegion).find('textarea').on('keydown' , function(e) {
        if(event.which == 8) {
          var maxlen = 250;
          var strval = $(this).val();
          var self = this;
          if ($(this).val().length < maxlen) {
           _this.cleantextAreaAfterError(this);
          }
        }
      });
    },

    showForm: function (){
      var _this = this;
      this.BBForm.render();

      // Call extendable function before the show call
      this.BeforeShow();

      var _this = this;
      this.initRules();

      if(this.formRegion.html){
        this.formRegion.html(this.BBForm.el);
      } else {
        return;
      }



      if(this.buttonRegion){
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
      }

      if (this.afterShow) {
        this.afterShow();
      }


    },

    showErrorForMaxLength : function(_this){
      var errorTag = $(_this).parent().parent().find('div')[0];
      $(errorTag).text('Text max length is 250');
      $(_this).addClass('error');
    },

    cleantextAreaAfterError : function(_this){
        var errorTag = $(_this).parent().parent().find('div')[0];
        $(errorTag).text('');
        $(_this).removeClass('error');
    },

    showAlertforMaxLength : function(){
      var opts = {
        title : 'Max length: 255 characters !',
        showCancelButton: false,
        type: 'warning',
        confirmButtonColor: '#DD6B55'
      };
      this.swal(opts);
    },

    updateState: function(state){

    },

    displaybuttons: function () {
      var name = this.name;
      if(this.displayMode == 'edit'){
        this.buttonRegion[0].find('.NsFormModuleDelete').removeClass('hidden');
        this.buttonRegion[0].find('.NsFormModuleCancel').removeClass('hidden');
        this.buttonRegion[0].find('.NsFormModuleSave').removeClass('hidden');
        this.buttonRegion[0].find('.NsFormModuleClear').removeClass('hidden');
        this.buttonRegion[0].find('.NsFormModuleEdit').addClass('hidden');
        this.formRegion.find('input:enabled:first').focus();
      }else{
        this.buttonRegion[0].find('.NsFormModuleDelete').addClass('hidden');
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

    butClickSave: function (e) {
          var _this = this;
          var flagEmpty = false;
          var errors = this.BBForm.commit();
          var jqhrx;

          if(!errors){
            flagEmpty = this.checkFormIsEmpty(this.model.schema,this.BBForm.getValue());
          }
          if(flagEmpty){
            this.swal({
              title : 'Empty observation',
              text : 'The observation won\'t be recorded',
              type:'warning',
              showCancelButton: false,
              confirmButtonColor:'#DD6B55',
              confirmButtonText:'Ok'
            });
            return;
          }

          if(!errors) {
            if (this.model.attributes["id"] == 0) {
                // To force post when model.save()
              this.model.attributes["id"] = null;
            }

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
                  _this.afterSaveSuccess(response);
                  return true;
                },
                error: function (model, response) {
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
                  _this.afterSaveSuccess(response);
                },
                error: function (model,response) {
                  _this.savingError(response);
                }
              });
            }
          }else{
            var errorList = _this.BBForm.$el.find('.error');

            for(var i=0; i < errorList.length; i++){
              var elmName = errorList[i].nodeName ;
              if (elmName.toUpperCase()!= 'SPAN'){
                $(errorList[i]).trigger('focus').click();
                break;
              }
            }
            return false;
          }
          _this.formChange = false;
          this.afterSavingModel();
          return jqxhr;
        },

    afterSaveSuccess: function(){

    },

    butClickEdit: function (e) {

      this.displayMode = 'edit';
      this.initModel();
      if(this.buttonRegion)
      this.displaybuttons();

    },
    butClickCancel: function (e) {

      this.displayMode = 'display';
      this.initModel();
      if(this.buttonRegion)
      this.displaybuttons();

    },
    butClickClear: function (e) {

      var formContent = this.BBForm.el;
      $(formContent).find('input').not(':disabled').each(function(){
        $(this).val('');
      });
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
        callback: function(){
          _this.formChange = false;
          _this.deleteModel();
        }
      };
      this.swal(opts);
    },

    deleteModel: function(){
      var _this = this;
      this.model.id = this.model.get('id');
      if(this.model.get('id') == 0){
        _this.afterDelete(_this.model);
      }
      this.model.destroy({
        success: function(response){
          if(_this.afterDelete){
            _this.afterDelete(response, _this.model);
          }
        },
        error: function(model , response){
          if( response.status === 409) {
              Swal({
                title: 'Data conflicts',
                text: response.responseText,
                type: 'warning',
                showCancelButton: false,
                confirmButtonColor: 'rgb(240, 173, 78)',
                confirmButtonText: 'OK',
                closeOnConfirm: true,
              });
          } else {
              var opts = {
                title : 'Error',
                text : 'An error occured. Please contact an administrator.',
                allowEscapeKey: false,
                showCancelButton: false,
                type: 'error',
                confirmButtonText: 'OK!',
                confirmButtonColor: '#DD6B55'
              };
              setTimeout(  function () {_this.swal(opts);}, 400);
          }
        }
      });
    },

    reloadingAfterSave: function () {
      this.displayMode = 'display';
      // reaload created record from AJAX Call
      this.initModel();
      //this.showForm();
      if(this.buttonRegion)
      this.displaybuttons();
    },


    checkFormIsEmpty: function(objSchema , values) {
      var isEmpty = true;

      for( var key in values ) {

        var editorValue = values[key];
        var editorSchema = objSchema[key];

        if(key == 'defaultValues' || key == 'Parent_Observation') {
          continue;
        }
        if(editorSchema && editorSchema.fieldClass.indexOf('hide') != -1) {
          continue;
        }
        if(editorSchema && editorSchema.type == 'Checkbox') {
          continue;
        }
        //need to check if not an array
        if(editorValue != null && editorValue != '' && !Array.isArray(editorValue) ) {
          return isEmpty = false;
        }

        if(editorSchema && editorSchema.defaultValue) {
            if(editorSchema.defaultValue != editorValue) {
              return isEmpty = false;
            }
        }

        if( Array.isArray(editorValue) ) {
          //subform
          for( var values of editorValue ) {
            if(!this.checkFormIsEmpty(editorSchema.subschema, values)) {
              return isEmpty = false;
            }
          }
        }
      }

      return isEmpty;
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
      var _this = this;
      if( response.status == 409) {
        Swal({
          title: 'Data conflicts',
          text: response.responseText,
          type: 'warning',
          showCancelButton: false,
          confirmButtonColor: 'rgb(240, 173, 78)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        });
    } else {
        var opts = {
          title : 'Error',
          text : 'An error occured. Please contact an administrator.',
          allowEscapeKey: false,
          showCancelButton: false,
          type: 'error',
          confirmButtonText: 'OK!',
          confirmButtonColor: '#DD6B55'
        };
        setTimeout(  function () {_this.swal(opts);}, 400);
    }
    },

    loadingError : function(response) {

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


  });

});
