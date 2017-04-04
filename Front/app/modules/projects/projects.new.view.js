define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  
  'modules/objects/object.new.view',
  './project.model',

], function(
  $, _, Backbone, Marionette,
  NewView,ProjectModel
){

  'use strict';

    return NewView.extend({
    ModelPrototype: ProjectModel,
    events: {

       'click input[type="file"]': 'checkFile',
        'click .js-btn-save': 'save',


     },
     checkFile : function(){
      alert('cliked');

     },
    save: function() {
      this.nsForm.butClickSave();
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
