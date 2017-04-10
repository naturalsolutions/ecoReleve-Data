define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  
  'modules/objects/object.new.view',
  './project.model',
  'vendors/geojsonhint',
  'sweetAlert',

], function(
  $, _, Backbone, Marionette,
  NewView,ProjectModel,geojsonhint,Swal
){

  'use strict';

    return NewView.extend({
    ModelPrototype: ProjectModel,
    events: {

       'change input[type="file"]': 'checkFile',
        'click .js-btn-save': 'save',


     },
     checkFile : function(e){
        var _this = this;
        var file = e.target.files[0];
        var elem = e.target ;
        var reader = new FileReader();
        var fileName = file.name;
        //$('#fileNameSelected').text(fileName);
        var tab = fileName.split('.');
        var fileType = tab[1].toUpperCase();

        if (fileType != 'GEOJSON') {
          this.swalError('Type de fichier non supporté',null);
          $(elem).val(null);
          this.errors = true;
        } else {
          reader.onload = function(e, fileName) {
          var data = e.target.result;
          //var importResulr =  XmlParser.gpxParser(xml);
          var errors = geojsonhint.hint(data);
          console.log(errors);
          if (errors.length) {
            _this.swalError('Fichier non valide','Merci de vérifier la structure sur votre fichier. Vous pouvez le faire en ligne à l\'adresse suivante:  "http://geojsonlint.com/" ');
            

          } else {
            _this.nsForm.model.set('Delimitation',data);
            console.log(_this.nsForm.model);

          }

          // _this.model.set('data_FileContent', _this.wayPointList);

          // if (_this.wayPointList.length > 0 || (errosList.length > 0)) {
          //   if (errosList.length > 0) {
          //       _this.deferred.resolve();
          //       _this.errors = true;
          //       _this.swalError('File error: we can\'t parse it','Name of waypoint(s) with errors:\n '+errosList);
          //   }
          // } else {
          //   _this.errors = false;
          // }
          };
          reader.readAsText(file);
        }
        




     },
    save: function() {
      this.nsForm.butClickSave();
    },

    swalError: function(title,content) {
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
      function(isConfirm) {
        $('form')[0].reset();
      });
    },
    // template: 'app/modules/projects/tpl-new-project.html',
    // className: 'full-height white',

    // events: {

    //   'click .js-btn-save': 'save',


    // },


    // ui: {
    //   'projForm': '.js-form',
    // },

    // initialize: function(options) {

    // },

    // onShow: function() {
    //   this.displayForm();
    //   this.$el.i18n();
    // },

    // onDestroy: function() {
    //   //this.map.destroy();
    //   this.nsForm.destroy();
    // },

    // save: function() {
    //   this.nsForm.butClickSave();
    // }, 
    // displayForm: function() {
    //   var self = this;
    //   //var model = new ProjectModel();
    //   this.nsForm = new NsForm({
    //     name: 'ProjForm',
    //     modelurl: 'projects/',
    //     //model: model,
    //     buttonRegion: [],
    //     formRegion: self.ui.projForm,
    //     displayMode: 'edit',
    //     id: 0,
    //   });
    // },

  });
});
