define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  
  'sweetAlert',
  'translater',

  'ns_map/ns_map',
  'ns_form/NSFormsModuleGit',
  'ns_navbar/navbar.view',
  'ns_grid/grid.view',
  'ns_modules/ns_com',
  '../monitoredSites/layouts/lyt-camTrapValidateDetail'

], function(
  $, _, Backbone, Marionette,
  Swal, Translater,
  NsMap, NsForm, NavbarView, GridView, Com,camTrapVisualisation
){

  'use strict';

  return Marionette.LayoutView.extend({
    model: new Backbone.Model(),
    template: 'app/modules/objects/detail.tpl.html',
    className: 'full-height animated white',

    events: {
      'click .tab-link': 'displayTab',
    },

    ui: {
      'form': '.js-form',
      'formBtns': '.js-form-btns',
      'map': '#map',
      'gallery' :'#camtrapgallery'
    },

    regions: {
      'rgNavbar': '.js-rg-navbar',
    },

    gridViews: [],

    ModelPrototype: Backbone.Model,

    initialize: function(options) {
      this.model = new this.ModelPrototype();
      this.com = new Com();
      this.model.set('id', options.id);
    },

    onShow: function() {
      this.initRegions();
      this.displayMap();
      this.displayForm();
      this.displayGrids();
      this.displayNavbar();
    },

    initRegions: function(){
      var _this = this;
      if(this.model.get('uiGridConfs')){
        this.model.get('uiGridConfs').map(function(uiGridConf){
          //uglify hack
          
          var tmp =  'rg' + uiGridConf.label.replace(' ','') + 'Grid';
          var obj = {};
          obj[tmp] = '.js-rg-' + uiGridConf.name + '-grid';
          _this.addRegions(obj);
        });
      }
      this.addRegions({
        'rgGalleryCam' : '.js-rg-gallery-cam'
      })
    },

    reload: function(options) {
      this.com = new Com();

      this.model.set('id', options.id);

      if(this.map.player){
        this.map.hidePlayer({silent : true});
        // this.map.clearPlayer();
      }

      this.com.addModule(this.map);
      if ( this.model.get('type') != 'sensors') {
        this.locationsGrid.com = this.com;
      }
      this.map.com = this.com;
      this.map.url = this.model.get('type') + '/' + this.model.get('id')  + '/locations?geo=true';
      this.map.updateFromServ();
      this.map.url = false;


      this.displayForm();
      this.displayGrids();
    },

    displayMap: function() {
      this.map = new NsMap({
        url: this.model.get('type') + '/' + this.model.get('id')  + '?geo=true',
        cluster: true,
        zoom: 3,
        popup: true,
      });
    },

    onRender: function() {
      this.$el.i18n();
    },

    displayNavbar: function(){
      this.rgNavbar.show(this.navbarView = new NavbarView({
        parent: this
      }));
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
      if (id === '#camera_trapTab') {
        if ( this.ui.map[0].style.display !== "none" ) {
          this.ui.map[0].style.display = "none";
        }
        if ( this.ui.gallery[0].style.display !== "" ) {
          this.ui.gallery[0].style.display = "";
        }
      }
      else {
        if(  this.ui.map[0].style.display !== "" ) {
          this.ui.map[0].style.display = "";
        }
        if( this.ui.gallery[0].style.display !== "none" ) {
          this.ui.gallery[0].style.display = "none";
        }
      }

      this.gridViews.map(function(gridView){
        if (gridView.gridOptions.api) {
          gridView.gridOptions.api.sizeColumnsToFit();
        }
      })
    },

    displayGrids: function(){
      
    },

    displayGallery: function(options) {
      
      if(typeof(this.gallery) === 'undefined' || this.gallery === null) {
        this.rgGalleryCam.show( this.gallery = new camTrapVisualisation ({
          id : this.model.get('id'),
          equipId : options.sessionID
        }));
      } else {
        var model = new Backbone.Model({
          'FK_MonitoredSite' : this.model.get('id'),
          'equipID' : options.sessionID
        });
        this.gallery.reloadFromNavbar(model);
      }
    },

    displayForm: function(){
      var _this = this;

      var formConfig = this.model.get('formConfig');

      formConfig.id = this.model.get('id');
      formConfig.formRegion = this.ui.form;
      formConfig.buttonRegion = [this.ui.formBtns];
      formConfig.parent = this.parent;
      formConfig.afterDelete = function(response, model){
        Backbone.history.navigate('#' + _this.model.get('type'), {trigger: true});
      };

      this.nsForm = new NsForm(formConfig);
    },

  });
});
