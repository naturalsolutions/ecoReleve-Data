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
    className: 'full-height animated white sensor',
    events: {
      'click #hideSensorDetails': 'hideDetail',
      'click #showSensorDetails': 'showDetail',
      'click #prev': 'navigatePrev',
      'click #next': 'navigateNext',
      'click .tab-link': 'displayTab',
    },
    ui: {
      'gridHistory': '#gridHistory',
      'gridEquipment': '#gridEquipment',
      'form': '#form',
      'map': '#map',
      'paginatorHistory': '#paginatorHistory',
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
          Backbone.history.navigate('#sensors/', {trigger : true});
        }).fail(function(resp) {
        });
      };
    },

    displayGrid: function(id) {
      var _this = this;
      var colsEquipment = [{
        name: 'FK_Individual',
        label: 'Individual id',
        editable: false,
        headerCell : null,
        cell: Backgrid.StringCell.extend({
          render: function () {
            this.$el.empty();
            var rawValue = this.model.get(this.column.get("name"));
            var formattedValue = this.formatter.fromRaw(rawValue, this.model);

            if (this.model.get('FK_Individual')){
              this.$el.append('<a target="_blank"'
                +'href= "http://'+window.location.hostname+window.location.pathname+'#individuals/'+this.model.get('FK_Individual')+'">\
                  '+rawValue +'&nbsp;&nbsp;&nbsp;<span class="reneco reneco-info" ></span>\
                </a>');
              this.delegateEvents();
            }
            return this;
          }
        })
      },
        {
          name: 'Name',
          label: 'Monitored site',
          editable: false,
          headerCell : null,
          cell: Backgrid.StringCell.extend({
            render: function () {
              this.$el.empty();
              var rawValue = this.model.get(this.column.get("name"));
              var formattedValue = this.formatter.fromRaw(rawValue, this.model);

              if (this.model.get('Name')){
                this.$el.append('<a target="_blank"'
                  +'href= "http://'+window.location.hostname+window.location.pathname+'#monitoredSites/'+this.model.get('MonitoredSiteID')+'">\
                    '+rawValue +'&nbsp;&nbsp;&nbsp;<span class="reneco reneco-info" ></span>\
                  </a>');
                this.delegateEvents();
             }
              return this;
            }
        })
        },
        {
        name: 'StartDate',
        label: 'Start date',
        editable: false,
        cell : 'stringDate',
        headerCell : null
      },
      {
        name: 'EndDate',
        label: 'End Date',
        editable: false,
        cell : 'stringDate',
        headerCell : null
      }
      ];
      this.gridEquipment = new NsGrid({
        pageSize: 20,
        columns: colsEquipment,
        pagingServerSide: false,
        url: config.coreUrl + 'sensors/' + id  + '/equipment',
        urlParams: this.urlParams,
        rowClicked: true,
      });

      var colsHisto = [{
        name: 'Name',
        label: 'Name',
        editable: false,
        cell: 'string'
      }, {
        name: 'value',
        label: 'Value',
        editable: false,
        cell: 'string'
      }, {
        name: 'StartDate',
        label: 'Start Date',
        editable: false,
        cell: 'stringDate',
      },];
      this.gridHistory = new NsGrid({
        pageSize: 20,
        columns: colsHisto,
        pagingServerSide: false,
        url: config.coreUrl + 'sensors/' + id  + '/history',
        urlParams: this.urlParams,
        rowClicked: true,
      });

      this.ui.gridEquipment.html(this.gridEquipment.displayGrid());
      this.ui.paginatorEquipment.html(this.gridEquipment.displayPaginator());
      this.ui.gridHistory.html(this.gridHistory.displayGrid());
      this.ui.paginatorHistory.html(this.gridHistory.displayPaginator());
    }
  });

});
