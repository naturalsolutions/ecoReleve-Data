define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone-forms',
  'config',

  ], function ($, _, Backbone, Marionette, Form, config) {

  'use strict';

  Backbone.Form.validators.MediaFile = function (options) {
      return function MediaFile(value) {
          if (value) {
              return null;
          }
          var retour = {
              type: 'MediaFile',
              message: 'error random'
          };
          return retour;
      };
  };

  return Form.editors.MediaFile = Form.editors.Base.extend({
    events: {
      'click button' : 'simulateClickInput',
      'change input' : 'handleNewFile'
    },

    template: 
    '<div>\
      <button type="button" class="js-btn-add btn btn-success">Media File</button>\
      <input type="file" class="hide" />\
      <div class="content" >\
        <a class="hide"></a>\
      </div>\
      <div class="modal fade" id="myPleaseWait" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static">\
        <div class="modal-dialog ">\
          <div class="modal-content js-camtrapProcessing">\
            <div class="modal-header">\
              <h4 class="modal-title">\
                <span class="glyphicon glyphicon-time"></span>\
                Please wait while processing data\
              </h4>\
            </div>\
            <div class="modal-body">\
              <div class="progress">\
                <div class="progress-bar progress-bar-info progress-bar-striped active" style="width: 0%">\
                </div>\
              </div>\
            </div>\
          </div>\
        </div>\
      </div>\
    </div>',

    className: 'mediafile-form' ,

    initialize: function(options){
      Form.editors.Base.prototype.initialize.call(this, options);
      var _this = this; 
      this.validators = options.schema.validators || [];
      var $el = _.template(
        this.template,
         {
          //  btnText:this.options.btnText ,
          //  iconFoncommitt:this.options.iconFont,
          //   editable: _this.editable
       });
      this.setElement($el);
      this.elems = new Object();
      
      this.mapHTMLElem();
      options.form.commit = this.commit.bind(this); // hack to overload BBForm.commit
      options.form.savingSuccess = this.savingSuccess.bind(this);
      // options.form.butClickDelete = this.butClickDelete.bind(this);
      if( options.schema.editable === false ) {
        this.elems.fileInput.disabled = true;
        this.elems.btnAdd.className += ' hide'
      }
      var oldFilePath = null;
      oldFilePath = options.model.get('MediaFile');
      if( oldFilePath && oldFilePath !== null ) {
        this.handleFileTypeAndTemplate(oldFilePath);
        var oldFileName = oldFilePath.split('/').pop();
        var fileExtension = oldFileName.split('.').pop();
        this.elems.link.href ='./mediasFiles/'+oldFilePath
        if(['JPG','JPEG','PNG'].indexOf(fileExtension.toUpperCase()) > -1 ) {
          //this.elems.link.href ='./mediasFiles/'+oldFilePath
        }
        else if ( this.elems.link.className.indexOf('hide') > -1 ) {
          this.elems.link.className = ''
        }
        this.elems.link.innerHTML = oldFileName;
      };

      // this.listenTo(this.model, 'destroy', this.test);


    },


    savingSuccess : function() {
      alert("oulalala la fonction qui bloque");
    },
    // test : function(event) {
    //   console.log(event);
    //   alert("et non on attend avant de detruire la vue y a du nettoyage a faire ")
    // },

    mapHTMLElem : function() {
      this.elems.btnAdd = this.el.getElementsByTagName('button')[0];
      this.elems.fileInput = this.el.getElementsByTagName('input')[0];
      this.elems.content = this.el.getElementsByClassName('content')[0];
      this.elems.link = this.el.getElementsByTagName('a')[0];
      this.elems.progressBar =  this.el.getElementsByClassName('progress-bar')[0];
    },
    simulateClickInput: function() {
      this.elems.fileInput.click();
    },
    handleNewFile: function(event) {

      if ( this.elems.fileInput.files.length ) {
       // this.elems.link.href = './mediasFiles/'+this.elems.fileInput.files[0].name; //file[0];
        this.elems.link.innerHTML = this.elems.fileInput.files[0].name;
      }
      var MIMEtype = this.elems.fileInput.files[0].type || null;
      if( MIMEtype && MIMEtype.indexOf('image/') > -1 ) { 
        this.addImgToTemplate(this.elems.fileInput.files[0]);
      }
      else if ( this.elems.link.className.indexOf('hide') > -1 ) {
        this.elems.link.className = ''
      }
    },

    uploadFile: function() {

    },

    removeFile: function() {

    },

    defferedCommit : function() {
      var formData = new FormData();
      var _this = this;
      this.elems.progressBar.style.width = _this.progress(0,0);
      $('#myPleaseWait').modal('show');
      formData.append("fileBin",this.elems.fileInput.files[0]);
      formData.append("FK_Station",this.model.get("FK_Station"));
      return $.ajax({
        type: 'POST',
        url : config.erdApiUrl+ 'mediasfiles/upload',
        processData: false,
        contentType: false,
        data : formData,
        context : this,
        xhr: function () {
          var xhr = $.ajaxSettings.xhr();
          
          xhr.upload.onprogress = function(event) { 
            console.log("progress ",event); 
            _this.elems.progressBar.style.width = _this.progress(event.loaded,event.total);
          };
          xhr.upload.onload = function(event) { 
            _this.elems.progressBar.style.width = _this.progress(100,100);
            console.log("well done!");
          };
          return xhr;
        }
      })

    
    },

    butClickDelete : function() {
      alert("lololololo");
    },

    commit: function() {
      var _this = this;
      _this.defferedCommit()
      .complete(function(e) {
        _this.cleanDom();
      })
      .done( function(resp) {
        return true
      })
      .fail( function(error) {

        console.log(error);
        return false
      });

      // return false;
    },

    cleanDom : function() {
      setTimeout(function () {
        $('#myPleaseWait').modal('hide');
      }, 10);
      // $('#myPleaseWait').modal('hide');

    },

    progress: function (numerator,denominator) {
      var width = '0%';
      if(!denominator) {
        return width = '0%';
      }
      if( ( numerator / denominator ) > 100 ) {
        return width ='100%';
      }
      return width = ((numerator / denominator) * 100).toFixed(2) + '%';
    },

    handleFileTypeAndTemplate: function(pathToFile) {
      var absPath = pathToFile.split('/')
      var fileName = absPath.pop();
      var fileExtension = fileName.split('.').pop();

      if(['JPG','JPEG','PNG'].indexOf(fileExtension.toUpperCase()) > -1 ) {
        this.addImgToTemplate(pathToFile)
      }
      // this.elems.link.href ='./mediasFiles/'+oldFilePath
     // this.elems.link.innerHTML = oldFileName[ oldFileName.length - 1 ]

      



    },

    addImgToTemplate : function(pathToFile) {
      var imgElem = document.createElement('img');
      imgElem.style.width = '100%'

      if( pathToFile instanceof File ) {
        var reader = new FileReader();
        reader.onload = function() {
          imgElem.src = reader.result;
        };
        reader.readAsDataURL(pathToFile);
      }
      else {
        imgElem.src = './mediasFiles/'+pathToFile;      
      }
      this.elems.content.append(imgElem)

    },

    render: function() {
        var elemModal = document.getElementsByClassName('modal-backdrop')[0];
        if(elemModal) {
          elemModal.parentElement.removeChild(elemModal);
        }

         return this;
        //var modalPresent = this.el.get
    },

    onBeforeDestroy : function(e) {

    },
    remove : function (e) {

    },
    getValue: function() {
      var path = null;
      if( this.elems.fileInput.files.length ) {
        path = this.model.get('FK_Station') + '/' + this.elems.fileInput.files[0].name;
        this.model.set('MediaFile' , path);
      }
      return path;
    },

  });
});
