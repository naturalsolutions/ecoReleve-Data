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

], function ($, _, Backbone, Marionette, config, Swal,
 XmlParser, NsForm, GpxForm, Dropzone
) {
  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/gpx/templates/tpl-step1-gpx.html',

    name: 'GPX import selection',

    events: {
      'change input[type="file"]': 'importFile',

      'drop .drag-zone-hover': 'handleDrop',
      'dragover .drag-zone-hover': 'handleDragOVer',
      'dragleave .drag-zone-hover': 'handleDragLeave',
      'click button#importGpxFile': 'simulateImport'
    },

    ui: {
      fielActivity: '#fielActivity',
      selectFieldActivity: '#c14_fieldActivity',
      fileInput: 'input#fileInput',
      form: '#form',
      importGpxMsg: '#importGpxMsg',
      divimpgpxfile: '#btnImpGpxFile'
    },
    simulateImport: function () {
      $('input[type=file]').click();
    },

    handleDrop: function (e) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      var obj = new Object({});
      obj.target = { files: '' };
      obj.target.files = e.originalEvent.dataTransfer.files;
      $('input[name="file"]').attr('value', 'file').change(obj);
      this.importFile(obj);
    },

    handleDragOVer: function (e) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    },

    handleDragLeave: function (e) {
    },

    initialize: function (options) {
      this.model = new Backbone.Model();
      this.errors = true;
      this.importedFile = false;
      this.deferred = $.Deferred();
      this.parent = options.parent;
      this.rdy = $.Deferred();
    },

    onShow: function () {
      var _this = this;
      this.parent.disableNextBtn();
      this.displayForm();
    },

    importFile: function (e) {
      var _this = this;
      var file = e.target.files[0];
      var reader = new FileReader();
      var fileName = file.name;
      $('#fileNameSelected').text(fileName);
      var tab = fileName.split('.');
      var fileType = tab[1].toUpperCase();

      if (fileType != 'GPX') {
        _this.importedFile = false;
        this.swalError('error file type', null);
        this.model.set('data_FileName', '');
        $('#fileNameSelected').text('No file selected');
        this.errors = true;
      } else {
        reader.onload = function (e, fileName) {
          var xml = e.target.result;
          var importResulr = XmlParser.gpxParser(xml);
          _this.wayPointList = importResulr[0];
          var errosList = importResulr[1];

          _this.model.set('data_FileContent', _this.wayPointList);

          if (_this.wayPointList.length > 0) {
            if (errosList.length > 0) {
              _this.deferred.resolve();
              _this.errors = true;
              _this.swalError('File error: we can\'t parse it', 'Name of waypoint(s) with errors:\n ' + errosList);
            }
          } else {
            _this.errors = false;
          }
        };
      }
      reader.readAsText(file);
    },


    displayErrors: function (errors) {
      this.swalError(errors);
    },

    swalError: function (title, content) {
      var _this = this;
      Swal({
        title: title,
        text: content,
        type: 'error',
        showCancelButton: false,
        confirmButtonColor: 'rgb(147, 14, 14)',
        confirmButtonText: 'OK',
        closeOnConfirm: true
      },
      function (isConfirm) {
        $('form')[0].reset();
        $('#fileNameSelected').text('No file selected');
        $('.fieldactivity').addClass('hidden');
        $(_this.fieldworkers).addClass('hidden');
      });
    },

    onDestroy: function () {
    },

    isRdyAccess: function () {
    },

    validate: function () {
      var formData = this.nsform.BBForm.getValue();
      this.setWaypointListWithForm(formData);
      return this.wayPointList;
    },

    check: function (e) {
      var error = this.nsform.BBForm.commit();
      if (error) {
        return false;
      }
      return true;
    },

    displayInputFile: function () {
      this.ui.form.find('.filesinputselector').parent().prepend('<div id="btnImpGpxFile">' +
        '<button id="importGpxFile" type="button" class="btn btn-success fileinput-button" data-i18n="import.fileSelection">' +
            '<i class="glyphicon glyphicon-plus"></i>' +
            '<span>Select a file</span>' +
        '</button>' +
        '<span id="fileNameSelected">No file selected</span>' +
      '</div>');
    },

    displayForm: function () {
      var self = this;
      var model = new Backbone.Model();
      $.ajax({
        url: config.coreUrl + 'stations/importGPX'

      }).then(function (data) {
        model.schema = data.schema;
        model.fieldsets = data.fieldsets;
        self.nsform = new NsForm({
          model: model,
          buttonRegion: [],
          formRegion: self.ui.form,
          reloadAfterSave: false,
          disabled: false
        });
        self.displayInputFile();
        self.rdy.resolve();
      });
    },

    loadCollection: function (url, element) {
      var collection = new Backbone.Collection();
      collection.url = url;
      var elem = $(element);
      elem.append('<option></option>');
      collection.fetch({
        success: function (data) {
          // could be a collectionView
          for (var i in data.models) {
            var current = data.models[i];
            var value = current.get('value') || current.get('PK_id');
            var label = current.get('label') || current.get('fullname');
            elem.append('<option value =' + value + '>' + label + '</option>');
          }
        }
      });
    },

    setWaypointListWithForm: function (formData) {
      var fwList = [];
      _.forEach(formData.FieldWorkers, function (curFw) {
        fwList.push(parseInt(curFw.FieldWorker));
      });
      this.wayPointList.map(function (model) {
        model.FieldWorkers = fwList;
        model.NbFieldWorker = formData.NbFieldWorker;
        model.fieldActivity = formData.fieldActivityId;
      });
    }
  });
});
