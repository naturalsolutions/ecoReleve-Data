//waypoints?

define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  'sweetAlert',
  'vendors/XmlParser',
  'ns_form/NSFormsModuleGit',
  'models/gpxForm',
  'i18n',


], function($, _, Backbone, Marionette, config, Swal,
 XmlParser, NsForm, GpxForm

) {

  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/gpx/templates/tpl-step1-gpx.html',

    name: 'GPX file upload',

    events: {
      'change input[type="file"]': 'importFile',
      'change select[name="fieldActivity"]': 'setFieldActivity',
      'click #resetFieldActivity': 'resetFieldActivity',
      'click button[data-action="add"]': 'setUsers',
    },

    ui: {
      'fielActivity': '#fielActivity',
      'selectFieldActivity': '#c14_fieldActivity',
      'fileInput': 'input#fileInput',
      'form': '#form',
    },

    initialize: function() {
      this.model = new Backbone.Model();
      this.wayPointList = new Backbone.Collection();
      this.errors = true;
      this.deferred = $.Deferred();

    },

    onShow: function() {
      this.displayForm();
      // fieldactivity
      this.loadCollection(config.coreUrl + 'fieldActivity', 'select[name="fieldActivity"]');
      $('button[data-action="add"]').attr('disabled','disabled');
      $('.fieldactivity').addClass('hidden');
      this.fieldworkers = $('label[for*="FieldWorkers"]').parent();
      $(this.fieldworkers).addClass('hidden');
    },

    importFile: function(e) {

      var _this = this;
      var file = e.target.files[0];
      var reader = new FileReader();
      var fileName = file.name;
      var tab = fileName.split('.');
      var fileType = tab[1].toUpperCase();
      var fieldAfield = $('select[name="fieldActivity"]');
      var userBtn = $('button[data-action="add"]');

      if (fileType != 'GPX') {
        this.swalError('error file type');
        this.model.set('data_FileName', '');
        this.errors = true;
        $(fieldAfield).attr('disabled', 'disabled');
        $(userBtn).attr('disabled', 'disabled');
        $('#importGpxMsg').removeClass('hidden');
      } else {
        reader.onload = function(e, fileName) {
          var xml = e.target.result;

          // get waypoints collection

          var importResulr =  XmlParser.gpxParser(xml);
          _this.wayPointList =  importResulr[0];
          var errosList = importResulr[1];

          _this.model.set('data_FileContent', _this.wayPointList);

          //success
          if (_this.wayPointList.length > 0) {
            //_this.ui.fielActivity.removeClass('hidden');
            //warning
            $(fieldAfield).removeAttr('disabled');
            $(userBtn).removeAttr('disabled');
            $('#importGpxMsg').addClass('hidden');
            $('.fieldactivity').removeClass('hidden');
            $(_this.fieldworkers).removeClass('hidden');

            if (errosList.length > 0) {
              for (var i = 0; i < errosList.length; i++) {
                _this.displayErrors(errosList[i] + '<br/>');
              }
            }
            _this.errors = false;
            _this.deferred.resolve();
            //error
          } else {
            _this.displayErrors('file error');
            //_this.ui.fielActivity.addClass('hidden');
            _this.errors = true;
            $(fieldAfield).attr('disabled','disabled');
            $(userBtn).attr('disabled','disabled');
            $('.fieldactivity').addClass('hidden');
            $(_this.fieldworkers).addClass('hidden');
          }
        };
      }
      reader.readAsText(file);
    },

    displayErrors: function(errors) {
      this.ui.importGpxMsg.append(errors);
    },

    swalError: function(title) {
      var _this = this;
      Swal({
        title: title,
        text: 'error',
        type: 'error',
        showCancelButton: false,
        confirmButtonColor: 'rgb(147, 14, 14)',
        confirmButtonText: 'OK',
        closeOnConfirm: true,
      },
      function(isConfirm) {
        $('form')[0].reset();
        $('.fieldactivity').addClass('hidden');
        $(_this.fieldworkers).addClass('hidden');
      });
    },

    setFieldActivity: function(e) {
      //could be bugged
      var fieldActivity = $(e.target).val();
      this.wayPointList.each(function(model) {
        model.set('fieldActivity', fieldActivity);
      });
    },
    onDestroy: function() {
    },

    isRdyAccess: function() {

    },

    validate: function() {
      return this.wayPointList;
    },

    check: function() {
      var error = this.nsform.BBForm.commit();

      if(error){
        return false;
      }else{
        var fieldworkers = this.nsform.BBForm.model.get('FieldWorkers');
        this.setFieldWorkers(fieldworkers);
        window.app.checkFormSaved = false;
        return true;
      }
    },
    displayForm: function() {
      var model = new GpxForm();
      this.nsform = new NsForm({
        //name: 'ImportGpxFileForm',
        //modelurl: config.coreUrl+'stations/fileImport',
        model: model,
        buttonRegion: [],
        formRegion: this.ui.form,
        //displayMode: 'display',
        reloadAfterSave: false,
        disabled : false,
      });
    },
    loadCollection: function(url, element) {
      var collection =  new Backbone.Collection();
      collection.url = url;
      var elem = $(element);
      elem.append('<option></option>');
      collection.fetch({
        success: function(data) {
          //could be a collectionView
          for (var i in data.models) {
            var current = data.models[i];
            var value = current.get('value') || current.get('PK_id');
            var label = current.get('label') || current.get('fullname');
            elem.append('<option value =' + value + '>' + label + '</option>');
          }
        }
      });
    },
    setFieldWorkers : function(tab){
       var list = [];
       for (var i=0;i<tab.length;i++){
        list.push(parseInt(tab[i].FieldWorker));
       }
       this.wayPointList.each(function(model) {
        model.set('FieldWorkers', list);
      });
       
    }
  });
});
