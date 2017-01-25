define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  
  'sweetAlert',
  'translater',

  'ns_map/ns_map',
  'ns_form/ns.form.view',
  'ns_navbar/navbar.view',
  'ns_grid/grid.view',
  'ns_modules/ns_com',

], function(
  $, _, Backbone, Marionette,
  Swal, Translater,
  NsMap, NsForm, NavbarView, GridView, Com
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
      'formBtns': '.js-form-btns',
      'map': '.js-map',
    },

    regions: {
      'rgNavbar': '.js-rg-navbar',
      'rgForm': '.js-rg-form',
    },

    gridViews: [],

    initialize: function(options) {
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
          var tmp =  'rg' + uiGridConf.label + 'Grid';
          var obj = {};
          obj[tmp] = '.js-rg-' + uiGridConf.name + '-grid';
          _this.addRegions(obj);
        });
      }
    },

    reload: function(options) {
      this.model.set('id', options.id);

      this.com.addModule(this.map);
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
        element: 'map',
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

      this.gridViews.map(function(gridView){
        gridView.gridOptions.api.sizeColumnsToFit();
      })
    },

    displayGrids: function(){
      
    },

    displayForm: function(){
      var _this = this;

      var formConfig = this.model.get('formConfig');

      formConfig.id = this.model.get('id');
      formConfig.buttonRegion = [this.ui.formBtns];
      formConfig.parent = this.parent;
      formConfig.afterDelete = function(response, model){
        Backbone.history.navigate('#' + _this.model.get('type'), {trigger: true});
      };

      this.rgForm.show(this.nsForm = new NsForm(formConfig));
    },

  });
});
