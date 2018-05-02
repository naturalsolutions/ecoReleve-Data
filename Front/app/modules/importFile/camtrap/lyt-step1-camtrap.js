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
      this.nbFilesInError = [];
      this.firstRendered = true;

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
            /*params will be update after sessions selected*/
          },
          fileType : ['image/*'] ,
          testChunks: true,
          clearInput: false
        });
      }
      this.model.set('resumable', this.r);

      this.listCollection = new CollectionViewFile({
        collection: _this.collectionFiles
      })


      this.collectionFiles.on('remove', this.removeInResumable, _this)

      this.createWorker();
    },

    createWorker: function() {
      var _this = this;
      this.wExif = new Worker('./app/modules/importFile/camTrap/workerExif.js', {
        type: "module"
      });
      this.wExif.onmessage = function (event) {
        _this.nbFilesParsed += 1;
        _this.progressBarElem.style.width = _this.progress(_this.nbFilesParsed,_this.nbFilesToParse);
        var workerMessage = {
          uniqueIdentifier : event.data.uniqueIdentifier,
          fileName : event.data.fileName,
          cid : event.data.cid,
          date : event.data.date,
          error : event.data.error
         };
        if(workerMessage.error != null) {       
          _this.removeFileInResumableFileList(workerMessage);
        }
        else if(workerMessage.date != null) {
          _this.addDateParsedInResumableFile(workerMessage);
        }

        if (_this.nbFilesParsed === _this.nbFilesToParse) {
          _this.nbFilesParsed = 0;
          _this.nbFilesToParse = 0;
          setTimeout(function () {
            $('#myPleaseWait').modal('hide');
            if(_this.nbFilesInError.length) {
              _this.displaySwalFilesError(_this.nbFilesInError);
            }
          }, 500);
        }
      };
    },

    addDateParsedInResumableFile : function( message ) {    
        var dateFind = message.date; 
        var resumalbeFile = this.r.files.find(function (elem) {
        if (elem.uniqueIdentifier === message.uniqueIdentifier) {
          return elem;
        }
      });
      resumalbeFile.dateFind = this.parseDateToIso(dateFind);
    },

    removeFileInResumableFileList : function(message) {
      var _this = this;
      this.nbFilesInError.push(message);
      var elemToDelete = null
      elemToDelete =  this.r.files.find(function (elem) {
        if (elem.uniqueIdentifier === message.uniqueIdentifier) {
          return elem;
        }
      });
      if(elemToDelete != null) {
        this.r.removeFile(elemToDelete)
      }
      this.collectionFiles.get(message.cid).destroy();
    },

    displaySwalFilesError : function(filesErrorList) {
      var text = '';
      var title = '';
      var listFiles = '';
      var nbFiles = filesErrorList.length;
      title += 'No date in metadata<BR>'
      if(nbFiles > 0) {
        if(nbFiles === 1 ){
          // title += 'Error on '+nbFiles+' file while reading (no date in metadata, we removed it from files selection) <BR>'   
          text += 'One file do not contains date in metadata.<BR>'
          text += 'Please contact your administrator and send the follong file'
          // text += 'Something goes wrong when we try to get the exif date of this file (it was removed from the files selection) :<BR>'
        }
        else {
          // title += 'Error on '+nbFiles+' files while reading (no date in metadata, we removed them from files selection)<BR>'
          text += ''+nbFiles+' files do not contain date in metadata.<BR>'
          text += 'Please contact your administrator and send the following files :<BR>'
          // text += 'Something goes wrong when we try to get the exif date of this files (they were removed from the files selection) :<BR>'
        }
      }
     
      for( var i = 0 ; i < nbFiles ; i++) {
        listFiles +=  filesErrorList[i].fileName+'<BR>';
      }

      text += listFiles;
      Swal({
        title: title,
        html: text,
        type: 'error',
        showCancelButton: false,
        confirmButtonText: 'Got it !',
        closeOnCancel: true
      })
      this.eraseFilesInErrorArray();

    },

    eraseFilesInErrorArray : function() {
      this.nbFilesInError = [];
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

      this.progressBarElem = this.el.getElementsByClassName('progress-bar')[0];
      this.r.on('filesAdded', function(files,filesSkipped) {
        _this.nbFilesToParse = files.length;
        _this.progressBarElem.style.width = _this.progress(0,0);
      })
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
        var modelTmp = new Backbone.Model({
          resumableFile: file
        });
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
          var message;
          message = {
            uniqueIdentifier: file.uniqueIdentifier,
            fileName : file.fileName,
            cid : modelTmp.cid,
            binString: binReader.result
          }
          _this.wExif.postMessage(message);
        };
        binReader.readAsBinaryString(imagePart);

        _this.collectionFiles.add(modelTmp);
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

    progress: function (numerator,denominator) {
      var width = '0%';
      if(!denominator) {
        return width = '0%';
      }
      if( ( numerator / denominator ) > 100 ) {
        return width ='100%';
      }
      return width = ((this.nbFilesParsed / this.nbFilesToParse) * 100).toFixed(2) + '%';
    },

    onShow: function () {
      var _this = this;

      if (this.firstRendered === true) {
        this.r.assignBrowse(this.ui.addFile);
        this.r.assignDrop(this.ui.addFileDropZone);
        this.firstRendered = false;
        this.$input = this.$el.find('input[type=file]')[0];
        this.$input.onchange = function (event) {
          event.target.value = '';
        };
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
          html: 'You need to add at least one file before going to the next step<BR>',
          type: 'warning',
          showCancelButton: false,
          confirmButtonText: 'OK',
          closeOnCancel: true,
        })
      }
    },

  });
});

