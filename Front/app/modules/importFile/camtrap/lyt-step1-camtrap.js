define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  'sweetAlert',
  'dropzone',
  'resumable',
  //'./modelFile',
  './collectionViewFile',
  'workerExif',
  'moment',
  'i18n',


], function ($, _, Backbone, Marionette, config, Swal, Dropzone, Resumable, /*ModelFile,*/ CollectionViewFile, workerExif, moment

) {

  'use strict';


  return Marionette.LayoutView.extend({
    regions: {
      'rgListFile': '#rgList-files'
    },
    ui: {
      'addFile': 'button.js-add_file',
      'cancelUpload': 'button.js-cancel-upload',
      'addFileDropZone': 'div.drag-zone-hover'
    },
    events: {
      'click button.js-add_file': 'addFile',
      'click button.js-cancel-upload': 'cancelUpload'
    },
    className: 'full-height',
    template: 'app/modules/importFile/camTrap/templates/tpl-step1-camtrap.html',
    name: 'Upload Camera Trap Files',
    

    initialize: function (options) {
      var _this = this;
      this.parent = options.parent;
      this.previousModels = options.parent.models[options.parent.currentStepIndex] || null;

      this.nbFilesToParse = 0;
      this.nbFilesParsed = 0;
      this.cptFilesSize = 0;
      this.strNbFiles = {
        min: 'Nb File:',
        max: 'Nb Files:'
      }
      this.firstRendered = true;

      // this.modalRef = $('#myPleaseWait').modal().constructor();
      this.wExif = new Worker('./app/modules/importFile/camTrap/workerExif.js', {
        type: "module"
      });
      this.wExif.onmessage = function (event) {
        _this.nbFilesParsed += 1;
        _this.progress();
        _this.r.files.find(function (elem) {
          if (elem.uniqueIdentifier === event.data.file) {
            elem.dateFind = _this.parseDateToIso(event.data.date);
            if ( _this.nbFilesParsed === _this.nbFilesToParse ) {
              _this.nbFilesParsed = 0;
              _this.nbFilesToParse = 0;
              setTimeout(function () {
                $('#myPleaseWait').modal('hide');
                // _this.progress();
              }, 500);
            }
          }
        });
      };



      this.model = new Backbone.Model();

      var myCollectionFile = Backbone.Collection.extend({
        model: new Backbone.Model()
      });
      this.collectionFiles = new myCollectionFile();

      if (this.previousModels != null && this.previousModels.get('resumable')) {
        //TODO use template on resumableObj no need to create collection list
        this.r = this.previousModels.get('resumable');
      } else {
        this.r = new Resumable({
          target: config.coreUrl + 'sensorDatas/camtrap/resumable',
          query: {
            // endDate:"2014-05-08 09:59:00",
            // id:3067,
            // path:"PP001_2014-05-02_2014-05-08_14N006G02",
            // startDate:"2014-05-02 12:00:00"
          },
          testChunks: true,
          clearInput: false
        });
      }
      this.model.set('resumable', this.r);

      this.listCollection = new CollectionViewFile({
        collection: _this.collectionFiles
      })


      this.collectionFiles.on('remove', this.removeInResumable, _this)
    },

    removeInResumable: function (model, collection, options) {
      // TODO try to use events to bind all func when remove a file
      this.r.removeFile(model.get('resumableFile'));
      if (this.r.files.length <= 1 && this.r.files.length >= 0) {
        this.changeNbFilesKey(this.strNbFiles.min);
      } else {
        this.changeNbFilesKey(this.strNbFiles.max);
      }
      this.changeNbFilesValue(this.r.files.length);
      this.changeFilesSizeValue();

    },
    changeNbFilesKey: function (str) {
      // TODO stepper pb when next and prev ui not initialised
      //this.ui.nbFilesKey.html(str);
      $('span#js-nbFilesKey').html(str)
    },
    changeNbFilesValue: function () {
      $('span#js-nbFilesValue').html(this.r.files.length);
    },
    changeFilesSizeValue: function () {
      //this.ui.filesSizeValue.html( (this.cptFilesSize/(1024*1024) ).toFixed(2)+' Mb' );
      var totalSize = 0;
      this.r.files.forEach(function (element) {
        totalSize += element.size;
      }, this);
      $('span#js-filesSizeValue').html((totalSize / (1024 * 1024)).toFixed(2) + ' Mb');

    },

    cancelUpload: function (e) {
      this.collectionFiles.reset();
      this.r.cancel();
    },

    parseDateToIso: function (dateToParse) {
      var cpt = 0;
      //TODO need to check all format from camera trap device
      if (dateToParse.indexOf(':') > -1 && dateToParse.indexOf(':') < 8) {
        for (var i = 0; cpt < 2 && i < dateToParse.length; i++) {
          if (dateToParse.charAt(i) === ':') {
            dateToParse = dateToParse.substr(0, i) + '/' + dateToParse.substr(i + 1);
            cpt++;
          }
        }
      }
      return {
        dateString: dateToParse,
        dateObj: new Date(dateToParse)
      }
    },


    onAttach: function () {
      var _this = this;
      this.r.on('fileAdded', function (file, event) {
        
        _this.cptFilesSize += file.size;
        if (_this.r.files.length > 1) {
          _this.changeNbFilesKey(_this.strNbFiles.max);
        }
        _this.changeNbFilesValue();
        _this.changeFilesSizeValue();
        $('#myPleaseWait').modal('show');
        if (typeof (event) === 'undefined')
          return;
        var imagePart = null;
        if (file.file.slice) {
          imagePart = file.file.slice(0, 131072);
        } else if (file.file.webkitSlice) {
          imagePart = file.file.webkitSlice(0, 131072);
        } else if (file.file.mozSlice) {
          imagePart = file.file.mozSlice(0, 131072);
        } else {
          imagePart = file.file;
        }
        var binReader = new FileReader();
        binReader.onload = function (event) {
          _this.wExif.postMessage({
            fileName: file.uniqueIdentifier,
            binString: binReader.result
          });
        };
        binReader.readAsBinaryString(imagePart);

        _this.collectionFiles.add(new Backbone.Model({
          resumableFile: file
        }));
      });

      this.r.on('cancel', function () {
        _this.changeNbFilesKey(_this.strNbFiles.min);
        _this.changeNbFilesValue(_this.r.files.length);
        _this.changeFilesSizeValue();
      });

    },

    onBeforeShow: function () {
      var _this = this;
      this.getRegion('rgListFile').show(new CollectionViewFile({
        collection: _this.collectionFiles
      }));
    },

    progress: function () {
      if (this.nbFilesToParse === 0) {
        $('.progress-bar').width(0 + '%');
      } else {
        $('.progress-bar').width(((this.nbFilesParsed / this.nbFilesToParse) * 100).toFixed(2) + '%');
      }
    },

    onShow: function () {
      var _this = this;

      if (this.firstRendered === true) {
        this.r.assignBrowse(this.ui.addFile);
        this.r.assignDrop(this.ui.addFileDropZone);
        this.firstRendered = false;
        this.$input = this.$el.find('input[type=file]')[0];
        this.$input.onchange = function (event) {
          _this.nbFilesToParse = event.target.files.length;
          event.target.value = ''; //hack for clear input file

        };
        // this.$input.onchange.bind(_this);   
      }
      if (this.previousModels !== null) {
        var previousModels = this.previousModels.get('resumableFile');

        previousModels.each(function (item) {
          _this.r.addFile(item.get('resumableFile').file);
          _this.collectionFiles.add(item);
        });
        if (_this.r.files.length > 1) {
          _this.changeNbFilesKey(_this.strNbFiles.max);
        }
        _this.changeNbFilesValue();
        _this.changeFilesSizeValue();
      }
    },

    onDestroy: function () {},

    validate: function () {

      if (this.collectionFiles.length) {
        this.model.set('resumableFile', this.collectionFiles);
        this.model.set('resumable', this.r);
        return this.model;
      } else {
        Swal({
          title: 'Warning',
          text: 'You need to add some files for going on the next step',
          type: 'warning',
          showCancelButton: false,
          confirmButtonText: 'OK',
          closeOnCancel: true
        })
      }
    },

  });
});

