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

], function ($, _, Backbone, Marionette, BackboneForm, Swal,Ruler, tplBtns) {
  return Marionette.LayoutView.extend({
    template: 'app/ns_modules/ns_form/ns.form.tpl.html',
    className: 'form-view hull-height laoding-bg',
    modelurl: null,
    Name: null,
    objectType: null,
    displayMode: null,
    buttonRegion: null,
    formRegion: null,
    id: null,
    reloadAfterSave: false,
    
    redirectAfterPost: '',
    displayDelete: true,

    ui: {
      'form': '.js-form'
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
      this.modelurl = options.modelurl;
      this.model = options.model;

      this.name = options.name;
      this.buttonRegion = options.buttonRegion;
      var variables = { formname: this.name };
      if (options.template) {
        this.bntTpl = _.template($(options.template).html(), variables);
      }
      else {
        this.bntTpl = _.template($(tplBtns).html(), variables);
      }
      
      this.afterDelete = options.afterDelete || false;
      this.reloadAfterSave = options.reloadAfterSave || this.reloadAfterSave;

      if(options.displayDelete != undefined){
        this.displayDelete = options.displayDelete;
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

      if (options.redirectAfterPost){
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
    },

    onShow: function(){
      if (this.model) {
        this.BBForm = new BackboneForm({
          model: this.model,
          data: this.model.data,
          fieldsets: this.model.fieldsets,
          schema: this.model.schema
        });

        this.showForm();
      } else {
        this.initModel();
      }
    },

    //???
    pushFormInEdit: function(){
      this.formChange = false;
      console.log(this);
      if(!window.formInEdition.form){
          window.formInEdition.form = {baseUri: this.$el[0].baseURI};
          //window.formInEdition.form[this.cid] = this;
      } else {
          if(window.formInEdition.form['undefined']){
            delete window.formInEdition.form['undefined'];
          }
          //window.formInEdition.form[this.cid] = this;
          window.formInEdition.form.baseUri = this.$el[0].baseURI;
        if(this.displayMode && this.displayMode.toLowerCase() == 'edit'){
            this.bindChanges();
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

    bindChanges: function(){
      var _this = this;
      this.ui.form.find('input').on("change", function(e) {
        if($(e.target).val() !== ''){
          _this.formChange = true;
        } else {
          _this.formChange = false;
       }
      });
      this.ui.form.find('select').on("change", function(e) {
         _this.formChange = true;
       console.log('blla');
      });
      this.ui.form.find('textarea').on("change", function(e) {
         _this.formChange = true;
      });

      //obsolete
      this.ui.form.find('.grid-form').on("change", function(e) {
         _this.formChange = true;
      });
      this.ui.form.find('.nested').on("change", function(e) {
         _this.formChange = true;
      });

      this.ui.form.find('textarea').on("keypress", function(e) {
        var maxlen = 250;
        var self = this;
        if ($(this).val().length > maxlen) {
          return false;
        }  else {
          _this.cleantextAreaAfterError(this);
        }
      });
      this.ui.form.find('textarea').on('keyup', function (e) {
        var maxlen = 250;
        var strval = $(this).val();
        var self = this;
        if ($(this).val().length > maxlen) {
           _this.showErrorForMaxLength(this);
          return false;
        }
      });
      this.ui.form.find('textarea').on('keydown' , function(e) {
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
      this.pushFormInEdit();
      var _this = this;
      this.BBForm.render();

      var _this = this;
      this.initRules();

      this.ui.form.html(this.BBForm.el);


      if(this.buttonRegion){
        if(this.buttonRegion[0]){
          this.buttonRegion.forEach(function (entry) {
            _this.buttonRegion[0].html(_this.bntTpl);
            _this.buttonRegion[0].i18n();
          });
          this.displaybuttons();
          this.bindEvents();
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
        this.ui.form.find('input:enabled:first').focus();
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
        fail: function(response){
          console.error(response);
        }
      });
    },

    reloadingAfterSave: function () {
      this.displayMode = 'display';
      // reaload created record from AJAX Call
      this.initModel();
      if(this.buttonRegion)
      this.displaybuttons();
    },


    checkFormIsEmpty: function(objSchema , values) {
      var isEmpty = true;

      for( var key in values ) {
        var editorValue = values[key];
        var editorSchema = objSchema[key];

        if(key == 'defaultValues') {
          continue;
        }
        if(editorSchema.fieldClass.indexOf('hide') != -1) {
          continue;
        }
        if(editorSchema.type == 'Checkbox') {
          continue;
        }
        //need to check if not an array
        if(editorValue != null && editorValue != '' && !Array.isArray(editorValue) ) {
          return isEmpty = false;
        }

        if(editorSchema.defaultValue) {
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

    savingSuccess: function (model, response) {
      // To be extended, called after save on model if success
    },

    savingError: function (response) {
      // To be extended, called after save on model if error
    },

    loadingError : function(response) {

    },

    bindEvents: function(){
      var _this = this;
      var name = this.name;

      // Edit
      this.onEditEvt = $.proxy(function(e){
        this.butClickEdit();
      }, this);

      this.buttonRegion[0].find('.NsFormModuleEdit').on('click', this.onEditEvt);

      // Cancel
      this.onCancelEvt = $.proxy(function(e){
        this.butClickCancel();
      }, this);

      this.buttonRegion[0].find('.NsFormModuleCancel').on('click', this.onCancelEvt);

      // Save
      this.onSaveEvt = $.proxy(function(){
        this.butClickSave();
      }, this);

      this.buttonRegion[0].find('.NsFormModuleSave').on('click', this.onSaveEvt);

      // Clear
      this.onClearEvt = $.proxy(function(){
        this.butClickClear();
      }, this);

      this.buttonRegion[0].find('.NsFormModuleClear').on('click', this.onClearEvt);

      // Delete
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
      this.BBForm.remove();
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
