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
  'ns_modules/ns_com',
  'tooltipster-list',


], function($, _, Backbone, Marionette, Swal, Translater, config,
 NsGrid, NsMap, NsForm, NavbarView, Com
) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/sensors/sensor.tpl.html',
    className: 'full-height animated white sensor',
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
  
    model: new Backbone.Model({
      type: 'sensors',
    }),
    com: new Com(),

    initialize: function(options) {
      this.model.set('id', options.id);
    },

    reloadFromNavbar: function(id) {
      this.model.set('id', id);

      this.map.url = config.coreUrl + 'sensors/' + this.model.get('id')  + '?geo=true';
      this.map.updateFromServ();

      this.displayForm();
      this.displayGrid();
    },

    onShow: function() {
      this.$el.i18n();
      this.displayMap();
      this.displayNavbar();
      this.displayForm();
      this.displayGrid();
    },

    displayNavbar: function(){
      this.rgNavbar.show(this.navbarView = new NavbarView({
        parent: this
      }));
    },

    displayMap: function() {
      this.map = new NsMap({
        url: config.coreUrl + 'sensors/' + this.model.get('id')  + '?geo=true',
        cluster: true,
        zoom: 3,
        element: 'map',
        popup: true,
      });
    },

    displayForm: function() {
      this.nsform = new NsForm({
        name: 'SensorForm',
        modelurl: config.coreUrl + 'sensors',
        buttonRegion: [],
        formRegion: this.ui.form,
        buttonRegion: [this.ui.formBtns],
        displayMode: 'display',
        objectType: this.type,
        id: this.model.get('id'),
        reloadAfterSave: true,
        parent: this.parent
      });

      this.nsform.afterDelete = function() {
        var jqxhr = $.ajax({
          url: config.coreUrl + 'sensors/' + this.model.get('id'),
          method: 'DELETE',
          contentType: 'application/json'
        }).done(function(resp) {
          Backbone.history.navigate('#sensors/', {trigger : true});
        }).fail(function(resp) {
        });
      };
    },

    displayGrid: function() {
      var _this = this;
      var cols = [{
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
      this.grid = new NsGrid({
        pageSize: 20,
        columns: cols,
        pagingServerSide: false,
        url: config.coreUrl + 'sensors/' + this.model.get('id')  + '/history',
        urlParams: this.urlParams,
        rowClicked: true,
      });
      this.ui.grid.html(this.grid.displayGrid());
      this.ui.paginator.html(this.grid.displayPaginator());
    }
  });

});
