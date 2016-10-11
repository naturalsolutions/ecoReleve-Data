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
  'dropzone'


], function($, _, Backbone, Marionette, config, Swal,
 XmlParser, NsForm, GpxForm, Dropzone

) {

  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/gpx/templates/tpl-step1-gpx.html',

    name: 'GPX file upload',

    events: {
      'change input[type="file"]': 'importFile',
      //'change select[name="fieldActivity"]': 'setFieldActivity',
      //'click #resetFieldActivity': 'resetFieldActivity',
      //'click button[data-action="add"]': 'setUsers',
      'drop .drag-zone-hover' : 'handleDrop',
      'dragover .drag-zone-hover' : 'handleDragOVer',
      'dragleave .drag-zone-hover' : 'handleDragLeave',
      'click button#importGpxFile' :'simulateImport',
      //'change select[name="FieldWorker"]': 'check',
    },

    ui: {
      'fielActivity': '#fielActivity',
      'selectFieldActivity': '#c14_fieldActivity',
      'fileInput': 'input#fileInput',
      'form': '#form',
      'importGpxMsg' : '#importGpxMsg',
      'divimpgpxfile' : '#btnImpGpxFile'
    },
    simulateImport : function () {
      //this.ui.fileInput.click();
      $('input[type=file]').click();

    },
    handleDrop : function(e) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      this.importFile(e.originalEvent.dataTransfer.files);
    },

    handleDragOVer : function(e) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    },

    handleDragLeave : function(e) {
    },

    initialize: function(options) {
      this.model = new Backbone.Model();
      this.wayPointList = new Backbone.Collection();
      this.errors = true;
      this.importedFile = false;
      this.deferred = $.Deferred();
      console.log(options)
      this.parent = options.parent;
      this.rdy = $.Deferred();

    },

    onShow: function() {
      var _this = this;
      this.parent.disableNextBtn();
      this.displayForm();
      //this.parent.bindRequiredFields();

    },

    importFile: function(e) {
      var _this = this;
      if(typeof e.target === 'undefined') {
        _this.importedFile = true;
        var file = e[0];
      }
      else {
        var file = e.target.files[0];
      }
      var reader = new FileReader();
      var fileName = file.name;
      $('#fileNameSelected').text(fileName); //add filename after btn
      var tab = fileName.split('.');
      var fileType = tab[1].toUpperCase();
      //var fieldAfield = $('select[name="fieldActivity"]');
      //var userBtn = $('button[data-action="add"]');

      if (fileType != 'GPX') {
        _this.importedFile = false;
        this.swalError('error file type');
        this.model.set('data_FileName', '');
        $('#fileNameSelected').text('No file selected');
        this.errors = true;
      //  $(fieldAfield).attr('disabled', 'disabled');
      //  $(userBtn).attr('disabled', 'disabled');
      //  $('#importGpxMsg').removeClass('hidden');
      } else {
        reader.onload = function(e, fileName) {
          window.app.checkFormSaved = false;

          var xml = e.target.result;

          // get waypoints collection

          var importResulr =  XmlParser.gpxParser(xml);
          _this.wayPointList =  importResulr[0];
          var errosList = importResulr[1];

          _this.model.set('data_FileContent', _this.wayPointList);

          //success
          if (_this.wayPointList.length > 0) {

            if (errosList.length > 0) {
                _this.deferred.resolve();
                _this.displayErrors('file error');
                //_this.ui.fielActivity.addClass('hidden');
                _this.errors = true;
                // $(fieldAfield).attr('disabled','disabled');
                // $(userBtn).attr('disabled','disabled');
                // $('.fieldactivity').addClass('hidden');
                // $(_this.fieldworkers).addClass('hidden');
                _this.swalError('file error : we can\'t parse it');
            }
          } else {
            _this.errors = false;
          }
        };
      }
      reader.readAsText(file);
    },

    displayErrors: function(errors) {
      //this.ui.importGpxMsg.append("<errors style='color:red;'>"+errors+"</errors>"); //importGpxMsg doesn't exist
      this.swalError(errors);
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

    onDestroy: function() {
    },

    isRdyAccess: function() {
      console.log('isRdyAccess')
    },

    validate: function() {
      console.log('validate')
      var formData = this.nsform.BBForm.getValue();
      this.setWaypointListWithForm(formData);
      return this.wayPointList;
    },

    check: function(e) {
      var error = this.nsform.BBForm.commit();
      console.log('check', error);
            if(error){
              return false;
            }else{
              //var fieldworkers = this.nsform.BBForm.model.get('FieldWorkers');
              //this.setFieldWorkers(fieldworkers);
              window.app.checkFormSaved = false;
              return true;
            }
    },

    displayInputFile(){
      this.ui.form.find('.filesinputselector').parent().prepend('<div id="btnImpGpxFile">'+
        '<button id="importGpxFile" type="button" class="btn btn-success fileinput-button" data-i18n="import.fileSelection">'+
            '<i class="glyphicon glyphicon-plus"></i>'+
            '<span>Select a file</span>'+
        '</button>'+
        '<span id="fileNameSelected">No file selected</span>'+
      '</div>');
    },
    displayForm: function() {
      var self = this;
      var model = new Backbone.Model();
      $.ajax({
        url:config.coreUrl+'stations/importGPX',

      }).then(function(data){
        model.schema = data.schema;
        model.fieldsets = data.fieldsets;
        self.nsform = new NsForm({
          //name: 'ImportGpxFileForm',
          //modelurl: config.coreUrl+'stations/fileImport',
          model: model,
          buttonRegion: [],
          formRegion: self.ui.form,
          //displayMode: 'display',
          reloadAfterSave: false,
          disabled : false,
        });
        self.displayInputFile();
        self.rdy.resolve();
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
    setWaypointListWithForm : function(formData){
      console.log("bim on veut set les fieldworkers");
      var fwList = [];
      _.forEach(formData.FieldWorkers,function(curFw){
        fwList.push(parseInt(curFw.FieldWorker))
      })
       this.wayPointList.each(function(model) {
        model.set('FieldWorkers',fwList );
        model.set('NbFieldWorker', formData.NbFieldWorker);
        model.set('fieldActivityId', formData.fieldActivity);
      });

    }
  });
});
