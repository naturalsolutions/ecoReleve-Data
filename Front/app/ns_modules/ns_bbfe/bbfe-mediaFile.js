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

    template: '<div>\
    <button type="button" class="js-btn-add btn btn-success">Media File</button>\
    <input type="file" class="hide" />\
    <div class="content" >\
    <a class="hide"></a>\
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
      options.form.butClickDelete = this.butClickDelete.bind(this);
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
        if(['JPG','JPEG','PNG'].indexOf(fileExtension.toUpperCase()) > -1 ) {
          this.elems.link.href ='./mediasFiles/'+oldFilePath
        }
        else if ( this.elems.link.className.indexOf('hide') > -1 ) {
          this.elems.link.className = ''
        }
        this.elems.link.innerHTML = oldFileName;
      }


    },

    mapHTMLElem : function() {
      this.elems.btnAdd = this.el.getElementsByTagName('button')[0];
      this.elems.fileInput = this.el.getElementsByTagName('input')[0];
      this.elems.content = this.el.getElementsByClassName('content')[0];
      this.elems.link = this.el.getElementsByTagName('a')[0];
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
      if( MIMEtype.indexOf('image/') > -1 ) { 
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
      formData.append("fileBin",this.elems.fileInput.files[0]);
      formData.append("FK_Station",this.model.get("FK_Station"));
      return $.ajax({
        type: 'POST',
        url : config.coreUrl+ 'mediasfiles/upload',
        processData: false,
        contentType: false,
        data : formData,
        context : this
      });
    
    },

    butClickDelete : function() {
      alert("lololololo");
    },

    commit: function() {
      var _this = this;
      _this.defferedCommit()
      .done( function(resp) {

      })
      .fail( function(error) {
        console.log(error);
        console.log("sniiffff erreur");
      });
      return false;
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
        return this;
    },



    getValue: function() {
      var path = null;
      if( this.elems.fileInput.files.length ) {
        path = this.model.get('FK_Station') + '/' + this.elems.fileInput.files[0].name;
        this.model.set('mediaFile' , path);
      }
      return path;
    },

  });
});
