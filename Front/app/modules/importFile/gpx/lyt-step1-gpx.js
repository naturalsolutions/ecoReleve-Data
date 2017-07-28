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
    name: 'Add station information',

    ui: {
      'form': '#form',
      'importGpxMsg': '#importGpxMsg',
      'divimpgpxfile': '#btnImpGpxFile'
    },

    initialize: function (options) {
      this.model = new Backbone.Model();
      this.errors = true;
      this.importedFiles = options.model.attributes.files;
      this.wayPointCollection = [];
      this.GPXcollectionRdy = $.Deferred();
      this.parent = options.parent;
      this.formRdy = $.Deferred();
    },

    onShow: function () {
      var _this = this;
      this.displayForm();
      this.initGPXCollection();
      this.parent.disableNextBtn();
      this.formRdy.then(function(){
        _this.parent.disableNextBtn();
        _this.parent.bindRequiredFields();
      });
    },

    parseFile: function (file) {
      var _this = this;
      var reader = new FileReader();
      var fileName = file.name;

      reader.onload = function (e) {
        var xml = e.target.result;
        var parsingResult = XmlParser.gpxParser(xml, fileName);
        var wayPointList = parsingResult[0];
        var errosList = parsingResult[1];

        if (errosList.length > 0) {
            _this.errors = true;
            _this.swalError('File error: we can\'t parse it', 'Name of waypoint(s) with errors:\n ' + errosList);

        } else {
          $.merge(_this.wayPointCollection, wayPointList);
          _this.errors = false;
        }

      };
      reader.readAsText(file);
    },

    initGPXCollection: function () {
      var _this = this;
      _.each(this.importedFiles, function (file) {
        _this.parseFile(file);
          
        });
        
        _this.GPXcollectionRdy.resolve();
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
          closeOnConfirm: true,
        },
        function (isConfirm) {
          $('form')[0].reset();
          $('#fileNameSelected').text('No file selected');
          $('.fieldactivity').addClass('hidden');
          $(_this.fieldworkers).addClass('hidden');
        });
    },

    onDestroy: function () {},

    isRdyAccess: function () {},

    validate: function () {
      // SET id according index (needed for map/grid resolution)
      this.wayPointCollection.map(function(wp, index){
          wp.id = index+1;
          return wp;
      });
      var formData = this.nsform.BBForm.getValue();
      this.setWaypointListWithForm();
      this.model.set('data_FilesContent', this.wayPointCollection);
      return this.wayPointCollection;
    },

    check: function (e) {
      var error = this.nsform.BBForm.commit();
      if (error) {
        return false;
      } else {
        return true;
      }
    },

    displayForm: function () {
      var self = this;
      var model = new Backbone.Model();
      $.ajax({
        url: config.coreUrl + 'stations/importGPX',
      }).then(function (data) {
        model.schema = data.schema;
        model.fieldsets = data.fieldsets;
        self.nsform = new NsForm({
          model: model,
          buttonRegion: [],
          formRegion: self.ui.form,
          reloadAfterSave: false,
          disabled: false,
        });
        self.formRdy.resolve();
      });
    },

    setWaypointListWithForm: function (formData) {
      var formData = this.nsform.BBForm.getValue();
      var fwList = [];
      _.forEach(formData.FieldWorkers, function (curFw) {
        fwList.push(parseInt(curFw.FieldWorker));
      });
      this.wayPointCollection.map(function (model) {
        model.FieldWorkers = fwList;
        model.NbFieldWorker = formData.NbFieldWorker;
        model.fieldActivity = formData.fieldActivityId;
        model.timeZone = formData.timeZone;
        model.Place = formData.Place;
      });
    }
  });
});
