define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'dropzone',
  'config',
  'i18n'

], function ($, _, Backbone, Marionette, Swal, Dropzone, config) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/importFile/tpl-select-importFile.html',
    ui: {
      'startBtn': 'button.start',
      'cancelBtn': 'button.cancel'
    },
    events:{
      'click button.cancel': 'cancelAll'
    },

    initialize: function (options) {
      this.parent = options.parent;
      this.previousModels = options.parent.models[options.parent.currentStepIndex];
      this.model = new Backbone.Model();
      this.model.set('files', []);
      if (!this.url) {
        console.error('URL error: url parameter is not provided');
      }

    },

    cancelAll: function(){
       this.dropzone.removeAllFiles(true);
    },

    onShow: function () {
      var previewNode = document.querySelector('#template');
      previewNode.id = '';
      var previewTemplate = previewNode.parentNode.innerHTML;
      previewNode.parentNode.removeChild(previewNode);

      var dropZoneParams = {
        url: this.url,
        previewTemplate: previewTemplate,
        acceptedFiles: this.extension,
        parallelUploads: 8,
        maxFiles: this.maxFiles,
        autoQueue: true,
        autoProcessQueue: false,
        previewsContainer: '#previews', // Define the container to display the previews
        clickable: '.fileinput-button', // Define the element that should be used as click trigger to select files.
      };
      this.initDropZone(dropZoneParams);
    },

    existingFile: function (file) {
      if (this.dropzone.files.length) {
        var _i, _len;
        for (_i = 0, _len = this.dropzone.files.length; _i < _len; _i++) {
          if (this.dropzone.files[_i].name === file.name && this.dropzone.files[_i].size === file.size) {
            Swal({
              title: 'Warning Duplicate Files',
              text: this.dropzone.files[_i].name + ' is already in the upload list, only one occurrence is keeped',
              type: 'warning',
              showCancelButton: false,
              confirmButtonColor: 'rgb(218, 146, 15)',
              confirmButtonText: 'OK',
              closeOnConfirm: true,
            });
            return true;
          }
        }
      }
      return false;
    },

    haveWrongExtension: function(file){
      var _this = this;
      var ext = file.name.toLowerCase().split('.');
      if (ext[ext.length - 1] != this.extension.replace('.','')) {
        Swal(
        {
          title: 'Wrong file type',
          text: 'The file should be a '+_this.extension+' file ',
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: 'rgb(147, 14, 14)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        }
        );
        return true;
      }
      return false;
    },

    initDropZone: function (params) {
      var _this = this;

      this.dropzone = new Dropzone(this.el, params);
      if(this.previousModels && this.dropzone.files.length == 0){
        _(this.previousModels.get('files')).forEach(function(file) {
          // this.dropzone.addFile(file);
          this.dropzone.files.push(file);
          file.status = Dropzone.ADDED;
          this.dropzone.emit('addedfile', file);
          this.dropzone._enqueueThumbnail(file);
          this.dropzone.enqueueFile(file);
        }, this);
      }
      this.dropzone.on("maxfilesexceeded", function (file) {
        this.removeFile(file);
        Swal({
          title: 'Max file exceeded',
          text: "You can't add more files \n (max files: "+_this.maxFiles+")",
          type: 'warning',
          showCancelButton: false,
          confirmButtonColor: 'rgb(218, 146, 15)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        });
      });

      this.dropzone.addFile = function (file) {
        if (_this.existingFile(file)) {
          return false;
        }
        if(_this.haveWrongExtension(file)){
          this.removeFile(file);
          return false;
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
        return this.accept(file, (function (_this) {

          return function (error) {
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

      if (this.uploadOnly) {
        this.setDropzoneUploadOnly();
      }
      this.parent.disableNextBtn();
      

    },

    setDropzoneUploadOnly: function () {
      this.errors = false;
      this.totalReturned = new Backbone.Collection();
      var _this = this;
      $('#total-progress').removeClass('hidden');

      this.dropzone.on('addedfile', function (file) {
        $(file.previewElement).find('.js-progress-bar').removeClass('hidden');
      });

      this.dropzone.on('totaluploadprogress', function (progress) {
        $('.progress-bar').css('width', progress + '%');
      });

      this.dropzone.on('error', function (file, resp, xhr) {
        if (xhr.status == 502){
          _this.timeout = true
        } else {
          _this.errors = true;
        }
        $(file.previewElement).find('.progress-bar').removeClass('progress-bar-infos').addClass('progress-bar-danger');
      });

      this.dropzone.on('success', function (file, resp) {
        $(file.previewElement).find('.progress-bar').removeClass('progress-bar-infos').addClass('progress-bar-success');
        _this.totalReturned.add(resp);
      });

      this.dropzone.on('queuecomplete', function (file) {
        $('#header-loader').addClass('hidden');
        
        var sumObjreturned = {};
        _.each(_this.totalReturned.models, function(model){
          _.each(model.attributes, function(val, key){

            if(!sumObjreturned[key]){
              sumObjreturned[key] = val;
            } else{
              sumObjreturned[key] = sumObjreturned[key] + val;
            }

          });
        });
        _this.endingMessage(sumObjreturned);
      });
    },

    endingMessage: function(sumObjreturned){
      var _this = this;
      if (!_this.errors && !_this.timeout) {
          Swal({
              title: 'Well done',
              text: 'File(s) have been correctly imported\n\n' +
                JSON.stringify(sumObjreturned).replace(',',',\n'),
              showCancelButton: true,
              confirmButtonColor: '#DD6B55',
              confirmButtonText: 'Validate '+_this.acronymType,
              cancelButtonText: 'Import new '+_this.acronymType,
              closeOnConfirm: true,
              closeOnCancel: true
            },
            function (isConfirm) {
              if (isConfirm) {
                Backbone.history.navigate('validate/'+_this.acronymType.toLowerCase(), {
                  trigger: true
                });
              } else {
                _this.cancelAll();
              }
            });
        } 
        if(_this.errors) {
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

      if(_this.timeout){
        Swal({
          title: 'Connection Timeout',
          text: 'Connection is down because the uploaded file is too large. The process is still running, but you can not get its result',
          type: 'warning',
          showCancelButton: false,
          confirmButtonText: 'OK',
          confirmButtonColor: 'rgb(147, 14, 14)',
          closeOnConfirm: true,
        });
      }
        _this.errors = false;
        _this.totalReturned.reset();
    },

    checkFileIsPresent: function () {
      if(this.dropzone.files.length > 0){
        return true;
      } else {
        return false;
      }
    },

    check: function(){
      return false;
    },

    validate: function () {
      this.model.set('files', this.dropzone.getQueuedFiles());
      if(this.checkFileIsPresent()){
        if(this.uploadOnly){
          this.dropzone.processQueue();
          $('#header-loader').removeClass('hidden');
        }
        return true;
      } else {
        return false;
      }
    },

    sendFiles: function () {

    },
    
    onDestroy: function (view) {
      $('#header-loader').addClass('hidden');
      $('.dz-hidden-input').remove();
    }

  });
});
