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
  'ns_navbar/navbar.view',

], function($, _, Backbone, Marionette, Swal, Translater,
 config, NsGrid, NsMap, NsForm, NavbarView
) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/monitoredSites/monitored_site.tpl.html',
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

    model: new Backbone.Model({
      type: 'monitoredSites',
    }),

    initialize: function(options) {
      this.model.set('id', options.id);
    },

    reloadFromNavbar: function(id) {
      this.model.set('id', id);
      this.map.url = config.coreUrl + 'monitoredSites/' + this.model.get('id')  + '/history/?geo=true';
      this.map.updateFromServ();
      this.displayForm();
      this.displayGrid();
      this.displayStationGrid();
      this.displayMap();
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      this.displayNavbar();
      this.displayForm();
      this.displayGrid();
      this.displayStationGrid();
      this.displayMap();
    },

    displayNavbar: function(){
      this.rgNavbar.show(this.navbarView = new NavbarView({
        parent: this
      }));
    },

    displayGrid: function() {
      this.grid = new NsGrid({
        pageSize: 10,
        pagingServerSide: true,
        name: 'MonitoredSiteGridHistory',
        url: config.coreUrl + 'monitoredSites/' + this.model.get('id')  + '/history/',
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
        url: config.coreUrl + 'monitoredSites/' + this.model.get('id')  + '/equipment',
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
        cell : 'string'
      }];

      this.stationsGrid = new NsGrid({
        pagingServerSide: false,
        pageSize: 10,
        columns: stationsCols,
        url: config.coreUrl + 'monitoredSites/' + this.model.get('id')  + '/stations',
        rowClicked: true,
        com: this.com,
      });

      this.ui.stationsGrid.html(this.stationsGrid.displayGrid());
      this.ui.paginatorStation.html(this.stationsGrid.displayPaginator());
    },

    displayMap: function(geoJson) {
      this.map = new NsMap({
        url: config.coreUrl + 'monitoredSites/' + this.model.get('id')  + '/history/?geo=true',
        zoom: 4,
        element: 'map',
        popup: true,
        cluster: true
      });
    },

    displayForm: function() {
      var _this = this;
      this.nsform = new NsForm({
        name: 'IndivForm',
        modelurl: config.coreUrl + 'monitoredSites',
        formRegion: this.ui.form,
        buttonRegion: [this.ui.formBtns],
        displayMode: 'display',
        objectType: this.type,
        id: this.model.get('id'),
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
          url: config.coreUrl + 'monitoredSites/' + _this.model.get('id'),
          method: 'DELETE',
          contentType: 'application/json'
        }).done(function(resp) {
          Backbone.history.navigate('#monitoredSites/', {trigger : true});
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
