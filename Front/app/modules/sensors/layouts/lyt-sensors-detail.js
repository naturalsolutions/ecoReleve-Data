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
  'ns_modules/ns_com',
  'tooltipster-list',


], function($, _, Backbone, Marionette, Swal, Translater, config,
 NsGrid, NsMap, NsForm, Navbar, Com
) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/sensors/templates/tpl-sensors-detail.html',
    className: 'full-height animated white',
    events: {
      'click #hideSensorDetails': 'hideDetail',
      'click #showSensorDetails': 'showDetail',
      'click #prev': 'navigatePrev',
      'click #next': 'navigateNext',
      'click .tab-link': 'displayTab',
    },
    ui: {
      'grid': '#grid',
      'gridEquipment': '#gridEquipment',
      'form': '#form',
      'map': '#map',
      'paginator': '#paginator',
      'paginatorEquipment': '#paginatorEquipment',
      'details': '#sensorLeft',
      'mapContainer': '#sensorRight',
      'showHideCtr': '#showSensorDetails',
      'formBtns': '#formBtns'
    },

    regions: {
      'rgNavbar': '#navbar'
    },

    rootUrl: '#sensors/',

    initialize: function(options) {
      if (options.id) {
        this.sensorId = options.id;
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
      this.map.url = config.coreUrl + 'sensors/' + this.sensorId  + '?geo=true';
      this.map.updateFromServ();
      Backbone.history.navigate(this.rootUrl + this.sensorId, {trigger: false});
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      var _this = this;
      if (this.sensorId) {
        this.displayForm(this.sensorId);
        this.displayGrid(this.sensorId);
        setTimeout(function() {
          _this.displayMap();
        },0);
      }else {
        this.rgNavbar.show(this.navbar);
        this.display(this.model);
        setTimeout(function() {
          _this.displayMap();
        },0);
      }
    },

    display: function(model) {
      this.model = model;
      this.sensorId = this.model.get('ID');
      this.displayForm(this.sensorId);
      this.displayGrid(this.sensorId);
    },

    displayMap: function() {
      this.map = new NsMap({
        url: config.coreUrl + 'sensors/' + this.sensorId  + '?geo=true',
        cluster: true,
        zoom: 3,
        element: 'map',
        popup: true,
      });
    },

    displayForm: function(id) {
      this.nsform = new NsForm({
        name: 'SensorForm',
        modelurl: config.coreUrl + 'sensors',
        buttonRegion: [],
        formRegion: this.ui.form,
        buttonRegion: [this.ui.formBtns],
        displayMode: 'display',
        objectType: this.type,
        id: id,
        reloadAfterSave: true,
        parent: this.parent
      });

      this.nsform.afterDelete = function() {
        var jqxhr = $.ajax({
          url: config.coreUrl + 'sensors/' + id,
          method: 'DELETE',
          contentType: 'application/json'
        }).done(function(resp) {
          Backbone.history.navigate(_this.rootUrl, {trigger : true});
        }).fail(function(resp) {
        });
      };
    },

    displayGrid: function(id) {
      var _this = this;
      var cols = [{
        name: 'FK_Individual',
        label: 'Individual id',
        editable: false,
        cell: 'string',
        headerCell : null
      },
        {
          name: 'FK_MonitoredSite',
          label: 'Monitored site id',
          editable: false,
          cell: 'string',
          headerCell : null
        },
        {
        name: 'StartDate',
        label: 'Start date',
        editable: false,
        cell : Backgrid.Extension.MomentCell.extend({
          modelInUnixTimestamp: true,
          displayFormat: "DD/MM/YYYY HH:mm:ss",
          displayInUTC: false
        }),
        headerCell : null
      },
      {
        name: 'EndDate',
        label: 'End Date',
        editable: false,
        cell : Backgrid.Extension.MomentCell.extend({
          modelInUnixTimestamp: true,
          displayFormat: "DD/MM/YYYY HH:mm:ss",
          displayInUTC: false
        }),
        headerCell : null
      }
      ];
      this.grid = new NsGrid({
        pageSize: 20,
        columns: cols,
        pagingServerSide: false,
        url: config.coreUrl + 'sensors/' + id  + '/history',
        urlParams: this.urlParams,
        rowClicked: true,
      });
      this.ui.grid.html(this.grid.displayGrid());
      this.ui.paginator.html(this.grid.displayPaginator());
    }
  });

});
