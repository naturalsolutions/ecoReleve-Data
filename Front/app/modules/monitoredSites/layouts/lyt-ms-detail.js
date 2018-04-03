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
  './lyt-camTrapValidateDetail'

], function($, _, Backbone, Marionette, Swal, Translater,
 config, NsGrid, NsMap, NsForm, Navbar, camTrapVisualisation
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
      'camTrapGrid': '#camTrapGrid',

      'form': '#form',
      'map': '#map',
      'paginator': '#paginator',
      'paginatorEquipment': '#paginatorEquipment',
      'paginatorStation': '#paginatorStation',
      'paginatorCamTrap': '#paginatorCamTrap',

      'details': '#infos',
      'mapContainer': '#mapContainer',
      'showHideCtr': '#showDetails',
      'formBtns': '#formBtns'
    },

    regions: {
      'rgMap' : '#map',
      'rgNavbar': '#navbar',
      'rgPhotos': '#gallerycamtrap'
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
        this.displayCameraTrap(this.monitoredSiteId);
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
      this.displayCameraTrap(this.monitoredSiteId);
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

    displayCameraTrap: function() {
      var _this = this;
      var stationsCols = [{
        name: 'UnicIdentifier',
        label: 'ID',
        editable: false,
        cell: 'string'
      },{
        name: 'equipID',
        label: 'equipid',
        editable: false,
        renderable: false,
        cell: 'string',
      },{
        name: 'StartDate',
        label: 'start date',
        editable: false,
        cell: 'string'
      },{
        name: 'EndDate',
        label: 'end date',
        editable: false,
        cell: 'string'
      },{
        name: 'nbPhotos',
        label: 'nb photos',
        editable: false,
        cell: 'string'
      }];

      this.camTrapGrid = new NsGrid({
        pagingServerSide: false,
        pageSize: 10,
        columns: stationsCols,
        url: config.coreUrl + 'photos/?siteid='+_this.monitoredSiteId+'',
        rowClicked: true,

      });
      this.camTrapGrid.rowClicked = function(args) {
      };
      this.camTrapGrid.rowDbClicked = function(args) {
        var that = this;
        var row = args.row
        var idCamTrap = row.model.get('UnicIdentifier')
        var startDate = row.model.get('StartDate')
        var endDate = row.model.get('EndDate')
        var equipId = row.model.get('equipID')
        var date = ""
        if( startDate !== 'N/A' ) {
          date = startDate;
        }
        else if (endDate !== 'N/A'){
          date = endDate;
        }
        _this.ui.map.hide();
      //  _this.displayGallery(idCamTrap , equipId, date );
        _this.rgPhotos.show( new camTrapVisualisation ({
          id : _this.monitoredSiteId,
          equipId : equipId,
          date : date
        }));
      //  _this.rowDbClicked(args);
      };

      this.ui.camTrapGrid.html(this.camTrapGrid.displayGrid());
      this.ui.paginatorCamTrap.html(this.camTrapGrid.displayPaginator());
    },

    displayGallery: function(id, equipId, date) {
      var _this = this;

      $.ajax({
        type: "GET",
        url: config.coreUrl  + 'photos/?siteid='+_this.monitoredSiteId+'&equipid='+equipId+'',
      })
      .done( function(response,status,jqXHR){
        if( jqXHR.status === 200 ){
          _this.ui.map.html('');
          for ( var tmp of response) {
            _this.ui.map.append('<img src="'+tmp.path+''+tmp.FileName+'" height="100" /><BR>')
          }
        }
      })
      .fail( function( jqXHR, textStatus, errorThrown ){
        console.log("error");
        console.log(errorThrown);
      });


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
          Backbone.history.navigate('#monitoredSites/', {trigger : true});
        }).fail(function(resp) {
        });
      };
    },

    displayTab: function(e) {
      var _this = this;
      e.preventDefault();
      var ele = $(e.target);
      if( $(e.target).text() !== 'Camera Trap'  ) {
        _this.rgPhotos.$el.hide();
        _this.ui.map.show();
      }
      else {
        _this.rgPhotos.$el.show();
        _this.ui.map.hide();
      }

      var tabLink = $(ele).attr('href');
      var tabUnLink = $('li.active.tab-ele a').attr('href');
      $('li.active.tab-ele').removeClass('active');
      $(ele).parent().addClass('active');
      $(tabLink).addClass('in active');
      $(tabUnLink).removeClass('active in');
    },

  });
});
