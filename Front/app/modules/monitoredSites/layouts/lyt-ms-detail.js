//radio
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'config',
  'ns_grid/model-grid',
  'ns_map/ns_map',
  'ns_form/NSFormsModuleGit',
  'ns_navbar/ns_navbar',

], function($, _, Backbone, Marionette, Swal, Translater,
 config, NsGrid, NsMap, NsForm, Navbar
) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/monitoredSites/templates/tpl-ms-detail.html',
    className: 'full-height animated white',

    events: {
      'click #hideDetails': 'hideDetail',
      'click #showDetails': 'showDetail',
      'click .tab-link': 'displayTab',
    },

    ui: {
      'grid': '#grid',
      'gridEquipment': '#gridEquipment',

      'form': '#form',
      'map': '#map',
      'paginator': '#paginator',
      'paginatorEquipment': '#paginatorEquipment',

      'details': '#infos',
      'mapContainer': '#mapContainer',
      'showHideCtr': '#showDetails',
      'formBtns': '#formBtns'
    },

    regions: {
      'rgNavbar': '#navbar'
    },

    rootUrl: '#monitoredSites/',

    initialize: function(options) {
      if (options.id) {
        this.monitoredSiteId = options.id;
      }else {
        this.translater = Translater.getTranslater();
        this.model = options.model;
        this.navbar = new Navbar({
          parent: this,
          globalGrid: options.globalGrid,
          model: options.model,
        });
      }

    },

    reloadFromNavbar: function(model) {
      this.display(model);
      this.map.url = config.coreUrl + 'monitoredSite/' + this.monitoredSiteId  + '/history/?geo=true';
      this.map.updateFromServ();
      Backbone.history.navigate(this.rootUrl + this.monitoredSiteId, {trigger: false});
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      var _this = this;
      if(this.monitoredSiteId){
        this.displayForm(this.monitoredSiteId);
        this.displayGrid(this.monitoredSiteId);
        setTimeout(function() {
          _this.displayMap();
        },0);
      }else{
        this.rgNavbar.show(this.navbar);
        this.display(this.model);
        setTimeout(function() {
          _this.displayMap();
        },0);
      }
    },

    display: function(model) {
      this.model = model;
      this.monitoredSiteId = this.model.get('ID');
      this.displayForm(this.monitoredSiteId);
      this.displayGrid(this.monitoredSiteId);
    },

    displayGrid: function(id) {

      this.grid = new NsGrid({
        pageSize: 10,
        pagingServerSide: true,
        name: 'MonitoredSiteGridHistory',
        url: config.coreUrl + 'monitoredSite/' + id  + '/history/',
        urlParams: this.urlParams,
        rowClicked: true,

      });

      var colsEquip = [{
        name: 'StartDate',
        label: 'Start Date',
        editable: false,
        cell: 'string'
      }, {
        name: 'Type',
        label: 'Type',
        editable: false,
        cell: 'string'
      },{
        name: 'UnicName',
        label: 'Platform',
        editable: false,
        cell: 'string'
      }, {
        name: 'Deploy',
        label: 'Status',
        editable: false,
        cell: 'string',
      },];
      this.gridEquip = new NsGrid({
        pageSize: 20,
        columns: colsEquip,
        pagingServerSide: false,
        url: config.coreUrl + 'monitoredSite/' + id  + '/equipment',
        urlParams: this.urlParams,
        rowClicked: true,
      });

      this.ui.grid.html(this.grid.displayGrid());
      this.ui.paginator.html(this.grid.displayPaginator());
      this.ui.gridEquipment.html(this.gridEquip.displayGrid());
      this.ui.paginatorEquipment.html(this.gridEquip.displayPaginator());
    },

    displayMap: function(geoJson) {
      this.map = new NsMap({
        url: config.coreUrl + 'monitoredSite/' + this.monitoredSiteId  + '/history/?geo=true',
        zoom: 4,
        element: 'map',
        popup: true,
        cluster: true
      });
    },

    displayForm: function(id) {
      var _this = this;
      this.nsform = new NsForm({
        name: 'IndivForm',
        modelurl: config.coreUrl + 'monitoredSite',
        formRegion: this.ui.form,
        buttonRegion: [this.ui.formBtns],
        displayMode: 'display',
        objectType: this.type,
        id: id,
        reloadAfterSave: true,
        parent: this.parent,
        afterShow: function() {
          $('#dateTimePicker').on('dp.change', function(e) {
            $('#dateTimePicker').data('DateTimePicker').maxDate(e.date);
          });
        }
      });

      this.nsform.afterDelete = function() {
        var jqxhr = $.ajax({
          url: config.coreUrl + 'monitoredSite/' + id,
          method: 'DELETE',
          contentType: 'application/json'
        }).done(function(resp) {
          Backbone.history.navigate(_this.rootUrl, {trigger : true});
        }).fail(function(resp) {
        });
      };
    },

    displayTab: function(e) {
      e.preventDefault();
      var ele = $(e.target);
      var tabLink = $(ele).attr('href');
      var tabUnLink = $('li.active.tab-ele a').attr('href');
      $('li.active.tab-ele').removeClass('active');
      $(ele).parent().addClass('active');
      $(tabLink).addClass('in active');
      $(tabUnLink).removeClass('active in');
    },

  });
});
