
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

    name: 'Upload Camera Trap Files',

    initialize: function(options) {
      //this.sensorId = options.model.attributes.sensorId;
      //console.log(this.options.model.get('row'));
      //this.row = this.options.model.get('row').model.attributes;
      this.buttonPause = $('#pause-upload-resumablejs');
      this.data =  this.options.model.get('row').model.attributes;
      this.model = this.options.model.get('row');
      this.data.sensorId = options.model.attributes.sensorId;
      console.log(this.data);
      this.path = "";
      this.nbFiles = 0;
      this.nbFilesRefused = 0;
      this.nbFilesToWait = 0;
      this.nbFilesConcat = 0;
      this.uploadFinished = false;
      this.warningFlag = false;
      this.startDate = this.data['StartDate'].split(" ");
      this.endDate = ["0000-00-00","00:00:00"]
      if( this.data['EndDate'] != undefined ) {
        this.endDate = this.data['EndDate'].split(" ");
      }
      this.path = String(this.data['UnicIdentifier'])+"_"+String(this.startDate[0])+"_"+String(this.endDate[0])+"_"+String(this.data['Name']);
      this.textSwalFilesNotAllowed = "";
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
    serializeData: function(){
    return {
      "UnicIdentifier": this.data.UnicIdentifier,
      "StartDate" : this.data.StartDate,
      "EndDate" : this.data.EndDate,
      "Name" : this.data.Name
    }
  },

    check: function() {

    },

    onShow: function() {
      var _this = this;
      _this.id = this.data.sensorId;
      //test resumable
      var r = new Resumable({
        target:  config.coreUrl + 'sensors/resumable/datas',
        query:
        {
          "path": this.path,
          "id" : this.data.sensorId,
          startDate: _this.startDate[0]+" "+_this.startDate[1],
          endDate: _this.endDate[0]+" "+_this.endDate[1]
        },
        testChunks: true
      });

      _this.nbFiles = 0;
      //get dom
      r.assignBrowse(document.getElementById('add-file-resumablejs'));
      r.assignDrop(document.getElementById('drag-drop-zone-resumable'));


      $('#start-upload-resumablejs').click(function(){
        console.log("on a "+_this.nbFilesToWait+" fichiers à attendre au final");
        //prevent multithread pb when test if folder doesn't exist and create it
        $.ajax({
          type: "POST",
          url: config.coreUrl + 'sensors/concat/datas',
          data: {
            path : _this.path,
            action : 0 // create folder
          }
        })
        .done( function(response,status,jqXHR){
          if( jqXHR.status === 200 ){
            $('#pause-upload-resumablejs').removeClass('hide');
            $('#start-upload-resumablejs').addClass('hide');
            r.upload();
          }
        })
        .fail( function( jqXHR, textStatus, errorThrown ){
          console.log("error");
          console.log(errorThrown);
        });
      });


      $('#pause-upload-resumablejs').click(function(){
        console.log("on pause");
        //console.log(r);
        if (r.files.length>0) {
          if (r.isUploading()) {
            return  r.pause();
          }
          $('#pause-upload-resumablejs').find('.reneco').removeClass('reneco-play').addClass('reneco-pause');
          $('#pause-upload-resumablejs > span').text(" Pause upload")
          return r.upload();
        }
      });
      $('#cancel-upload-resumablejs').click(function(){
        console.log("on cancel");
        r.cancel();
      });


      _this.progressBar = new ProgressBar($('#upload-progress'));

      function ProgressBar(ele) {
        this.thisEle = $(ele);

        this.fileAdded = function() {
          (this.thisEle).removeClass('hide').find('.progress-bar').css('width','0%');
        },

        this.uploading = function(progress) {
          (this.thisEle).find('.progress-bar').attr('style', "width:"+progress+'%');
        },

        this.finish = function() {
          (this.thisEle).find('.progress-bar').css('width','100%');
        }
      }
      //define event
      r.on('filesAdded', function(array) {
        /*  console.log("bim on ajouté des fichiers et tout");
        console.log(array);*/
        if(_this.textSwalFilesNotAllowed != ""){
          Swal(
            {
              title: 'Warning file type not allowed (only jpeg and zip)',
              text: _this.textSwalFilesNotAllowed ,
              type: 'warning',
              showCancelButton: false,
              confirmButtonColor: 'rgb(218, 146, 15)',

              confirmButtonText: 'OK',

              closeOnConfirm: true,

            }
          );
          _this.textSwalFilesNotAllowed = "";
        }
      });
      r.on('fileAdded', function(file, event){
        let extType = file.file.name.split(".");
        console.log(extType[extType.length-1]);
        if (extType[extType.length-1] =='jpeg' || extType[extType.length-1] == 'zip' || extType[extType.length-1] == 'ZIP' || extType[extType.length-1] == 'jpg' || extType[extType.length-1] == 'JPG' || extType[extType.length-1] == 'JPEG') {
          $('#start-upload-resumablejs').removeClass('hide');
          $('#cancel-upload-resumablejs').removeClass('hide');
          _this.nbFiles+=1;
          if (file.chunks.length > 1 ){
            _this.nbFilesToWait +=1;
          }
          let template ='<div id="'+file.uniqueIdentifier+'" class="col-md-12" >'+
          '<div  id="name" class="col-md-4 text-center">'+
          String(file.fileName)+
          '</div>'+
          '<div  id="status" class="col-md-8 text-center">'+
          "Ready"+
          '</div>'+
          '</div>';
          $('#list-files').append(template);
          _this.progressBar.fileAdded();
        }
        else{
          let tmp = String(file.file.type);
          if( tmp ==="")
          tmp = "unknow"
          _this.textSwalFilesNotAllowed+= ''+String(file.fileName)+ 'File type : '+tmp+'';
          _this.textSwalFilesNotAllowed+='\n';

          r.removeFile(file);
        }

        //console.log(file);
      });


      r.on('pause', function(){
        $('#pause-upload-resumablejs').find('.reneco').removeClass('recneco-pause').addClass('reneco-play');
        $('#pause-upload-resumablejs > span').text(" Resume upload")
      });

      r.on('fileSuccess', function(file, message){
        $("#"+file.uniqueIdentifier+"").css("color" ,"GREEN");
        $("#"+file.uniqueIdentifier+" > "+"#status").text("OK");

        //$modifStatus.getElementById('status').val("OK");
        /* envoie d'une requete pour reconstruire le fichier si le tableau de chunks est > 1 */
        if( file.chunks.length > 1 )
        {
          console.log("upload fini fk_sensor :" +_this.data.sensorId);
          $("#"+file.uniqueIdentifier+"").css("color" ,"#f0ad4e");
          $("#"+file.uniqueIdentifier+" > "+"#status").text("Processing wait please");


          //var deferred = $.Deferred();
          //console.log(file);
          $.ajax({
            type: "POST",
            url: config.coreUrl + 'sensors/concat/datas',
            data: {
              path : _this.path,
              id : _this.data.sensorId,
              name : file.uniqueIdentifier,
              file : file.fileName,
              type : file.file.type,
              taille : file.chunks.length,
              action : 1,
              startDate: _this.startDate[0]+" "+_this.startDate[1],
              endDate: _this.endDate[0]+" "+_this.endDate[1]
            }
          })
          .always( function(){
            _this.nbFilesConcat+=1;
          })
          .done( function(response,status,jqXHR){
            if( jqXHR.status === 200 ){
              $("#"+file.uniqueIdentifier+"").css("color" ,"GREEN");
              $("#"+file.uniqueIdentifier+" > "+"#status").text("OK");
              //console.log("bim le fichier est enfin rassemble temps d\'attente : "+ response.timeConcat);
              if( _this.nbFilesConcat === _this.nbFilesToWait && _this.uploadFinished )
              {
                _this.displayFinished();
              }
            }

          })
          .fail( function( jqXHR, textStatus, errorThrown ){
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
            if( jqXHR.status == 510 ){
             $("#"+file.uniqueIdentifier+"").css("color" ,"#f0ad4e");
             $("#"+file.uniqueIdentifier+" > "+"#status").html("WARNING! : <BR>"+String(jqXHR.responseJSON.message)+"\n"+String(jqXHR.responseJSON.messageConcat)+"\n"+String(jqXHR.responseJSON.messageUnzip));
           }
           else{
            $("#"+file.uniqueIdentifier+"").css("color" ,"RED");
            $("#"+file.uniqueIdentifier+" > "+"#status").text("FAILED");
          }
          if( _this.nbFilesConcat === _this.nbFilesToWait && _this.uploadFinished )
          {
            $('#start-upload-resumablejs').addClass('hide');
            $('#pause-upload-resumablejs').addClass('hide');
            _this.progressBar.finish();
            Swal(
              {
                title: 'Warning upload finished',
                text: ' Problem on zip look errors '
                      +'\n\t files in zip : ' +jqXHR.responseJSON.nbInZip
                      +'\n\t files inserted : '+jqXHR.responseJSON.nbInserted
                ,
                type: 'warning',
                showCancelButton: false,
                confirmButtonColor: 'rgb(218, 146, 15)',

                confirmButtonText: 'OK',

                closeOnConfirm: true,

              }
            );
          }
            //console.log("error");
            //console.log(errorThrown);
          });

        /*  $.ajax({
            type: "GET",
            url: config.coreUrl + 'sensors/1/statut',
            data: {
              path : _this.path,
              file : file.fileName,
            }
          })
          .done( function(response,status,jqXHR){
            console.log("done");
          })
          .fail( function( jqXHR, textStatus, errorThrown ){
            console.log("error");
            console.log(errorThrown);
          });*/

        }
        //console.log(file);
      });

      r.on('fileError', function(file, message){
        _this.warningFlag = true;
        _this.nbFilesRefused+=1;
        $("#"+file.uniqueIdentifier+"").css("color" ,"#f0ad4e");
        $("#"+file.uniqueIdentifier+" > "+"#status").html("REFUSED! reasons: "+ String(message).replace(/\"/g,'').replace(/\'/g,''));
        //console.log(file);
        //console.log(message);
      });

      r.on('complete', function(file, message) {
        _this.uploadFinished = true;
        if( _this.nbFilesConcat === _this.nbFilesToWait && _this.uploadFinished )
        {
          _this.displayFinished();
        }
});

r.on('fileProgress' , function(file){
  //console.log(file);
  //TODO pas opti on refresh a chaque fois
  $("#"+file.uniqueIdentifier+"").css("color" ,"#f0ad4e");
  $("#"+file.uniqueIdentifier+" > "+"#status").text("Uploading : "+parseInt(file._prevProgress * 100)+"%");


});

r.on('progress' , function(file,message) {
  /*
  $("#"+file.uniqueIdentifier+"").css("color" ,"#f0ad4e");
  $("#"+file.uniqueIdentifier+" > "+"#status").text("Uploading");*/
  _this.progressBar.uploading(r.progress()*100);
  $('#pause-upload-btn').find('.reneco').removeClass('reneco-play').addClass('reneco-pause');
});

r.on('beforeCancel' , function() {
  console.log("event beforeCancel");
});

r.on('cancel' , function() {
  let textFileCancelled = "";
  _this.nbFiles = 0
  _this.nbFilesToWait = 0;
  _this.nbFilesConcat = 0;
  Swal(
    {
      title: 'Warning you have Cancelled the upload',
      text: ' All files need to be upload again ',
      type: 'warning',
      showCancelButton: false,
      confirmButtonColor: 'rgb(218, 146, 15)',

      confirmButtonText: 'OK',

      closeOnConfirm: true,

    }
  );
  console.log("event Cancel");
  $("#list-files").empty();
  $("#list-files").append('<div id="title" class="col-md-12 text-center">List files to upload</div><div id="name" class="col-md-4 text-center">NAME</div><div id="status" class="col-md-8 text-center">STATUS</div>')
  $('#pause-upload-resumablejs').addClass('hide');
  $('#start-upload-resumablejs').addClass('hide');
  $('#cancel-upload-resumablejs').addClass('hide');
});

},

displayFinished: function (){
  var _this = this;
  var nbFilesUploaded = _this.nbFiles;
  var nbFilesRefused = _this.nbFilesRefused;
  console.log("bim j'ai fini j'affiche");
  _this.nbFiles = 0
  _this.nbFilesToWait = 0;
  _this.nbFilesConcat = 0;
  _this.nbFilesRefused = 0;
  $('#start-upload-resumablejs').addClass('hide');
  $('#pause-upload-resumablejs').addClass('hide');
  _this.progressBar.finish();
  if ( !_this.warningFlag ) {
    Swal({
      title: 'Well done',
      text: 'File(s) have been correctly Uploaded'
      + '\n\t inserted  : ' + ( nbFilesUploaded - nbFilesRefused )
      +'\n\t  uploaded : ' + ( nbFilesUploaded)
      +'\n\t refused  : ' + ( nbFilesRefused )
      ,
      type:  'success',
      showCancelButton: true,
      confirmButtonText: 'Validate Camera Trap',
      cancelButtonText: 'New import',
      closeOnConfirm: true,
      closeOnCancel: true},
      function(isConfirm) {
        if (isConfirm) {
          Backbone.history.navigate('validate/camtrap',{trigger: true});
        }
        else{
          console.log("bim on a cancel");
        }
      }
    );
  }
  else {
    Swal({
      title: 'Warning',
      text: 'Some File(s) refused'
      + '\n\t inserted  : ' + ( nbFilesUploaded - nbFilesRefused )
      +'\n\t  uploaded : ' + ( nbFilesUploaded)
      +'\n\t refused  : ' + ( nbFilesRefused )
      ,
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Validate Camera Trap',
      cancelButtonText: 'New import',
      closeOnConfirm: true,
      closeOnCancel: true},
      function(isConfirm) {
        if (isConfirm) {
          Backbone.history.navigate('validate/camtrap',{trigger: true});
        }
        else{
          console.log("bim on a cancel");
        }
      }
    );
  }
},

onDestroy: function() {
},

validate: function() {
},

});
});
