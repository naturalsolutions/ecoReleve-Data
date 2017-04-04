define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',

  'ns_modules/ns_com',
  'ns_form/NSFormsModuleGit',
  'ns_navbar/navbar.view',
  'modules/objects/detail.view',
  './project.model',

], function(
  $, _, Backbone, Marionette, Swal,
  Com, NsForm, NavbarView, 
  DetailView, ProjectModel
) {

  'use strict';

  return DetailView.extend({
    template: 'app/modules/projects/project.tpl.html',
    className: 'full-height white project',

    ModelPrototype: ProjectModel,
    
    events: {
      'click .tab-link': 'displayTab',
    },

    ui: {
      formProject: '.js-from-project',
      formProjectBtns: '.js-from-btns',
    },

    regions: {
      'rgProject': '.js-rg-project',
      'rgProtocols': '.js-rg-protocols',
      'rgProtocol': '.js-rg-protocol',
      'rgNavbar': '.js-navbar'
    },

    initialize: function(options) {
      this.model = new this.ModelPrototype();
      this.com = new Com();
      this.model.set('id', options.id);

      this.model.set('projectId', options.id);

      this.model.set('urlParams', {
        proto: options.proto,
        obs: options.obs
      });
    },

    reload: function(options){
      if(options.id == this.model.get('id')){
        //this.LytProtocols.protocolsItems.getViewFromUrlParams(options);
      } else {
        this.model.set('id', options.id);
        this.model.set('projectId', options.id);
        this.model.set('urlParams', {
          proto: options.proto,
          obs: options.obs
        });
        this.displayProject();
      }
    },


    displayTab: function(e) {
      e.preventDefault();
      this.$el.find('.nav-tabs>li').each(function(){
        $(this).removeClass('active in');
      });
      $(e.currentTarget).parent().addClass('active in');

      this.$el.find('.tab-content>.tab-pane').each(function(){
        $(this).removeClass('active in');
      });
      var id = $(e.currentTarget).attr('href');
      this.$el.find('.tab-content>.tab-pane' + id).addClass('active in');

      // this.gridViews.map(function(gridView){
      //   gridView.gridOptions.api.sizeColumnsToFit();
      // })
    },

    onShow: function() {
      this.displayProject();
      this.displayNavbar();
    },

    displayNavbar: function(){
      this.rgNavbar.show(this.navbarView = new NavbarView({
        parent: this
      }));
    },

    displayProject : function() {
      this.total = 0;
      var _this = this;
      var detailsFormRegion = this.$el.find('.js-rg-details');
      var formConfig = this.model.get('formConfig');

      formConfig.id = this.model.get('id');
      formConfig.formRegion = detailsFormRegion;
      formConfig.buttonRegion = [this.ui.formProjectBtns];
      formConfig.afterDelete = function(response, model){
        Backbone.history.navigate('#' + _this.model.get('type'), {trigger: true});
      };

      this.nsForm = new NsForm(formConfig);
      this.nsForm.BeforeShow = function(){

      };

      this.nsForm.afterShow = function(){
        var globalEl = $(this.BBForm.el).find('fieldset').first().detach();
        _this.ui.formProject.html(globalEl);

        if(this.displayMode.toLowerCase() == 'edit'){
          this.bindChanges(_this.ui.formProject);
          $(".datetime").attr('placeholder','DD/MM/YYYY');
          $("#dateTimePicker").on("dp.change", function (e) {
          $('#dateTimePicker').data("DateTimePicker").format('DD/MM/YYYY').maxDate(new Date());
          });
        }

      };

      this.nsForm.savingError = function (response) {
        var msg = 'An error occured, please contact an admninstrator';
        var type_ = 'error';
        var title = 'Error saving';
        if (response.status == 510) {
          console.log(response)
          if (response.responseJSON.existingProject) {
            msg = 'A project  already exists with these parameters';
          }
          else if (response.responseJSON.updateDenied) {
            msg = "Equipment is present on this project, you can't change Project  Date or Monitored Site";
          }
          type_ = 'warning';
          title = 'Error saving';
        }

        Swal({
          title: title,
          text: msg,
          type: type_,
          showCancelButton: false,
          confirmButtonColor: 'rgb(147, 14, 14)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        });
      };

      this.nsForm.afterSaveSuccess = function() {
        if(this.model.get('fieldActivityId') != _this.fieldActivityId){

        }
      };
      
      $.when(this.nsForm.jqxhr).then(function(){

      })

    },

  });
});
