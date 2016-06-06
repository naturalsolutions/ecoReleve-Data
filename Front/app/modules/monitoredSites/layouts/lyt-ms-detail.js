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
      'stationsGrid': '#stationsGrid',

      'form': '#form',
      'map': '#map',
      'paginator': '#paginator',
      'paginatorEquipment': '#paginatorEquipment',
      'paginatorStation': '#paginatorStation',

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
      this.map.url = config.coreUrl + 'monitoredSites/' + this.monitoredSiteId  + '/history/?geo=true';
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
        this.displayStationGrid(this.monitoredSiteId);
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
      this.displayStationGrid(this.monitoredSiteId);
    },

    displayGrid: function(id) {

      this.grid = new NsGrid({
        pageSize: 10,
        pagingServerSide: true,
        name: 'MonitoredSiteGridHistory',
        url: config.coreUrl + 'monitoredSites/' + id  + '/history/',
        urlParams: this.urlParams,
        rowClicked: true,

      });

      var colsEquip = [{
        name: 'StartDate',
        label: 'Start Date',
        editable: false,
        cell: 'stringDate'
      },{
        name: 'EndDate',
        label: 'End Date',
        editable: false,
        cell: 'stringDate'
      }, {
        name: 'Type',
        label: 'Type',
        editable: false,
        cell: 'string'
      },{
        name: 'UnicIdentifier',
        label: 'Platform',
        editable: false,
        cell: 'string'
      }];
      this.gridEquip = new NsGrid({
        pageSize: 20,
        columns: colsEquip,
        pagingServerSide: false,
        url: config.coreUrl + 'monitoredSites/' + id  + '/equipment',
        urlParams: this.urlParams,
        rowClicked: true,
      });

      this.ui.grid.html(this.grid.displayGrid());
      this.ui.paginator.html(this.grid.displayPaginator());
      this.ui.gridEquipment.html(this.gridEquip.displayGrid());
      this.ui.paginatorEquipment.html(this.gridEquip.displayPaginator());
    },

    displayStationGrid: function() {
      var _this = this;
      var stationsCols = [{
        name: 'ID',
        label: 'ID',
        editable: false,
        renderable: false,
        cell: 'string'
      },{
        name: 'Name',
        label: 'Name',
        editable: false,
        cell : 'string'
      },{
        name: 'StationDate',
        label: 'date',
        editable: false,
        cell: 'stringDate'
      },{
        name: 'LAT',
        label: 'latitude',
        editable: false,
        cell: 'string'
      }, {
        name: 'LON',
        label: 'longitude',
        editable: false,
        cell: 'string'
      },{
        name: 'fieldActivity_Name',
        label: 'FieldActivity',
        editable: false,
        cell: Backgrid.StringCell.extend({
          render: function () {
            this.$el.empty();
            var rawValue = this.model.get(this.column.get("name"));
            var formattedValue = this.formatter.fromRaw(rawValue, this.model);

            this.$el.append('<a target="_blank"' 
              +'href= "http://'+window.location.hostname+window.location.pathname+'#stations/'+this.model.get('ID')+'">\
                '+rawValue +'&nbsp;&nbsp;&nbsp;<span class="reneco reneco-info" ></span>\
              </a>');

            this.delegateEvents();
            return this;
          }
        })
      }];

      this.stationsGrid = new NsGrid({
        pagingServerSide: false,
        pageSize: 10,
        columns: stationsCols,
        url: config.coreUrl + 'monitoredSites/' + this.monitoredSiteId  + '/stations',
        rowClicked: true,
        com: this.com,
      });

      this.ui.stationsGrid.html(this.stationsGrid.displayGrid());
      this.ui.paginatorStation.html(this.stationsGrid.displayPaginator());
    },

    displayMap: function(geoJson) {
      this.map = new NsMap({
        url: config.coreUrl + 'monitoredSites/' + this.monitoredSiteId  + '/history/?geo=true',
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
        modelurl: config.coreUrl + 'monitoredSites',
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
          url: config.coreUrl + 'monitoredSites/' + id,
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
