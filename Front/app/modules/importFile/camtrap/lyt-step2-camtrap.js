
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  'sweetAlert',
  'dropzone',
  'resumable',
  'i18n'

], function($, _, Backbone, Marionette, config, Swal, Dropzone,Resumable

  ) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/importFile/camtrap/templates/tpl-step2-camtrap.html',

    name: 'Upload Cam Trap Files',

    initialize: function(options) {
      //this.sensorId = options.model.attributes.sensorId;
      //console.log(this.options.model.get('row'));
      //this.row = this.options.model.get('row').model.attributes;
      this.data =  this.options.model.get('row').model.attributes;
      this.data.sensorId = options.model.attributes.sensorId;
      //console.log(this.data);
      this.path = "";
      let startDate = this.data['StartDate'].split(" ");
      let endDate = this.data['EndDate'].split(" ");
      this.path = String(this.data['UnicIdentifier'])+"_"+String(startDate[0])+"_"+String(endDate[0])+"_"+String(this.data['Name']);
      /*
      http://192.168.0.78/ecoReleve-Core/sensors/resumable/datas?
      resumableChunkNumber=184
      &resumableChunkSize=1048576
      &resumableCurrentChunkSize=1048576
      &resumableTotalSize=1400531542
      &resumableType=application%2Fx-zip-compressed
      &resumableIdentifier=1400531542-archive1zip
      &resumableFilename=archive1.zip
      &resumableRelativePath=archive1.zip
      &resumableTotalChunks=1335
      */
    },

    check: function() {

    },

    onShow: function() {
      var _this = this;
      //test resumable
      var r = new Resumable({
      target:  config.coreUrl + 'sensors/resumable/datas',
      query:
      {
            "path": this.path
      },
      testChunks: false
      });

      var nbFiles = 0;
      //get dom
      r.assignBrowse(document.getElementById('add-file-resumablejs'));
      r.assignDrop(document.getElementById('drag-drop-zone-resumable'));


      $('#start-upload-resumablejs').click(function(){
        console.log("on upload");
        r.upload();
      });

      $('#pause-upload-resumablejs').click(function(){
          console.log("on pause");
          if (r.files.length>0) {
              if (r.isUploading()) {
                return  r.pause();
              }
              return r.upload();
          }
      });

      var progressBar = new ProgressBar($('#upload-progress'));
      function ProgressBar(ele) {
        this.thisEle = $(ele);

        this.fileAdded = function() {
            (this.thisEle).removeClass('hide').find('.progress-bar').css('width','0%');
            nbFiles+=1;
        },

        this.uploading = function(progress) {
            (this.thisEle).find('.progress-bar').attr('style', "width:"+progress+'%');
        },

        this.finish = function() {
            (this.thisEle).find('.progress-bar').css('width','100%');
        }
    }
      //define event
      r.on('fileAdded', function(file, event){
      console.log("fichier ajouté :");
      $('#list-files').append("<div>"+String(file.fileName)+"</div>");
      progressBar.fileAdded();
        //console.log(file);
      });

      r.on('pause', function(){
          $('#pause-upload-btn').find('.glyphicon').removeClass('glyphicon-pause').addClass('glyphicon-play');
      });

      r.on('fileSuccess', function(file, message){
          console.log("file success :")
          console.log(message);
          console.log(file);
          /* envoie d'une requete pour reconstruire le fichier si le tableau de chunks est > 1 */
          console.log("longueur tableau chunks :"+file.chunks.length);
          if( file.chunks.length > 1 )
          {
            $.ajax({
              type: "POST",
              url: config.coreUrl + 'sensors/concat/datas',
              data: {
                      path : _this.path,
                      name : file.fileName,
                      taille : file.chunks.length,
                      action : 1
                    }
            });
          }
          //console.log(file);
      });

      r.on('fileError', function(file, message){
        console.log("file error :");
        console.log(message);
        Swal(
              {
                title: 'Warning',
                text: ' probleme to upload the file',
                type: 'warning',
                showCancelButton: false,
                confirmButtonColor: 'rgb(218, 146, 15)',

                confirmButtonText: 'OK',

                closeOnConfirm: true,

              }
          );
          //console.log(file);
      });

      r.on('complete', function(file, message) {
        console.log("file upload complete");


        progressBar.finish();
        Swal({title: 'Well done',
          text: 'File(s) have been correctly imported\n'
                        + '\t inserted : ' + nbFiles
                        ,
          type:  'success',
          showCancelButton: true,
          confirmButtonText: 'Validate CamTrap',
          cancelButtonText: 'New import',
          closeOnConfirm: true,
          closeOnCancel: true},
          function(isConfirm) {   if (isConfirm) {
            Backbone.history.navigate('validate/Camtrap',{trigger: true});
          }
        }
        );
      });

      r.on('progress' , function(file,message) {
        console.log("on progress");
        progressBar.uploading(r.progress()*100);
        $('#pause-upload-btn').find('.glyphicon').removeClass('glyphicon-play').addClass('glyphicon-pause');
      });

    },

    onDestroy: function() {
    },

    validate: function() {
    },

  });
});
