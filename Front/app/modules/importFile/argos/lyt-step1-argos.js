
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'sweetAlert',
	'dropzone',

	'i18n'

], function($, _, Backbone, Marionette, config, Swal, Dropzone
) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/importFile/argos/templates/tpl-step1-argos.html',

    name: 'Upload Argos Files',

    initialize: function() {

    },

    check: function() {
		},

    onShow: function() {
      var _this = this;
      // Initialize a drop zone for import
      var previewNode = document.querySelector('#template');
      previewNode.id = '';
      var previewTemplate = previewNode.parentNode.innerHTML;
      previewNode.parentNode.removeChild(previewNode);

      var myDropzone = new Dropzone(this.el, {
        url: config.coreUrl + 'sensors/argos/datas',
        parallelUploads: 1,
        previewTemplate: previewTemplate,
        previewsContainer: '#previews', // Define the container to display the previews
        clickable: '.fileinput-button', // Define the element that should be used as click trigger to select files.
      });

      //overwrite addFile function to avoid duplicate files
      myDropzone.addFile = function(file) {

        var ext = file.name.split('.');
        if (ext[ext.length - 1].toLowerCase() != 'txt') {
          Swal({
              title: 'Wrong file type',
              text: 'The file should be a text file (.txt)',
              type: 'error',
              showCancelButton: false,
              confirmButtonColor: 'rgb(147, 14, 14)',
              confirmButtonText: 'OK',
              closeOnConfirm: true,
          });
          return false;
        }

        if (this.files.length) {
          var _i, _len;
          for (_i = 0, _len = this.files.length; _i < _len; _i++) {
            if (this.files[_i].name === file.name && this.files[_i].size === file.size) {
              Swal({
                title: 'Warning Duplicate Files',
                text: this.files[_i].name + ' is already in the upload list, only one occurrence is keeped',
                type: 'warning',
                showCancelButton: false,
                confirmButtonColor: 'rgb(218, 146, 15)',
                confirmButtonText: 'OK',
                closeOnConfirm: true,
              });
              return false;
            }
          }
        }

        file.upload = {
          progress: 0,
          total: file.size,
          bytesSent: 0
        };
        this.files.push(file);
        file.status = Dropzone.ADDED;
        this.emit('addedfile', file);
        this._enqueueThumbnail(file);
        return this.accept(file, (function(_this) {

          return function(error) {
            if (error) {
              file.accepted = false;
              _this._errorProcessing([file], error);
            } else {
              file.accepted = true;
              if (_this.options.autoQueue) {
                _this.enqueueFile(file);
              }
            }
            return _this._updateMaxFilesReachedClass();
          };
        })(this));
      };

      this.totalReturned = new Backbone.Collection();

      myDropzone.on('addedfile', function(file) {
        // Hookup the start button
        file.previewElement.querySelector('.start').onclick = function() { myDropzone.enqueueFile(file); };
      });

      // Update the total progress bar
      myDropzone.on('totaluploadprogress', function(progress) {
        document.querySelector('#total-progress .progress-bar').style.width = progress + '%';
      });

      myDropzone.on('sending', function(file) {
        // Show the total progress bar when upload starts
        document.querySelector('#total-progress').style.opacity = '1';
        // And disable the start button
        file.previewElement.querySelector('.start').setAttribute('disabled', 'disabled');
      });

      // Hide the total progress bar when nothing's uploading anymore
      myDropzone.on('queuecomplete', function(progress) {
        document.querySelector('#total-progress').style.opacity = 0;
        document.querySelector('#total-progress .progress-bar').style.width = 0;
      });

      this.errors = false;
      myDropzone.on('error', function(file) {
        this.errors = true;
        $(file.previewElement).find('.progress-bar').removeClass('progress-bar-infos').addClass('progress-bar-danger');

      });

      myDropzone.on('success', function(file,resp) {
        $(file.previewElement).find('.progress-bar').removeClass('progress-bar-infos').addClass('progress-bar-success');
        _this.totalReturned.add(resp);
      });

      myDropzone.on('queuecomplete', function(file) {
          var totalInsertedArgos = _this.totalReturned.reduce(function(memo, value) { return memo + value.get('inserted argos') }, 0);
          var totalExistingArgos = _this.totalReturned.reduce(function(memo, value) { return memo + value.get('existing argos') }, 0);

          var totalInsertedGPS = _this.totalReturned.reduce(function(memo, value) { return memo + value.get('inserted gps') }, 0);
          var totalExistingGPS = _this.totalReturned.reduce(function(memo, value) { return memo + value.get('existing gps') }, 0);

          var totalInsertedEng = _this.totalReturned.reduce(function(memo, value) { return memo + value.get('inserted Engineering') }, 0);
          var totalExistingEng = _this.totalReturned.reduce(function(memo, value) { return memo + value.get('existing Engineering') }, 0);
          console.log(_this.totalReturned);

        if (!this.errors) {
          Swal({
            title: 'Well done',
            text: 'File(s) have been correctly imported\n\n' 
            + '\t inserted Argos : ' + totalInsertedArgos + '\t existing Argos : ' + totalExistingArgos+','
            +'\n\t inserted GPS : ' + totalInsertedGPS + '\t existing GPS : ' + totalExistingGPS+','
            +'\n\t inserted Engineering : ' + totalInsertedEng + '\t existing Engineering : ' + totalExistingEng
            ,
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Validate Argos',
            cancelButtonText: 'New import',
            closeOnConfirm: true,
            closeOnCancel: true},
            function(isConfirm) {
              if (isConfirm) {
              Backbone.history.navigate('validate/argos',{trigger: true});
              }
            });
        } else {
          Swal({
            title: 'An error occured',
            text: 'Please verify your file',
            type: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            confirmButtonColor: 'rgb(147, 14, 14)',
            closeOnConfirm: true,
          });
        }
        this.errors = false;
        _this.totalReturned.reset();

      });

      // Setup the buttons for all transfers
      // The 'add files' button doesn't need to be setup because the config
      // `clickable` has already been specified.
      document.querySelector('#actions .start').onclick = function() {
        myDropzone.enqueueFiles(myDropzone.getFilesWithStatus(Dropzone.ADDED));
      };
      document.querySelector('#actions .cancel').onclick = function() {
        myDropzone.removeAllFiles(true);
      };

    },

    onDestroy: function() {
		},

    validate: function() {
		},

  });
});
