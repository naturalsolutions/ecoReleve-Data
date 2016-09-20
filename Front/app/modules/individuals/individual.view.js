define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  
  'sweetAlert',
  'translater',

  'ns_grid/model-grid',
  'ns_map/ns_map',
  'ns_form/NSFormsModuleGit',
  'ns_navbar/navbar.view',

  'ns_grid/grid.view',

  'ns_modules/ns_com',
  'ns_filter/filters',
  'backbone.paginator'

], function(
  $, _, Backbone, Marionette, config,
  Swal, Translater,
  NsGrid, NsMap, NsForm, NavbarView, GridView, Com, NsFilter
) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/individuals/individual.tpl.html',
    className: 'individual full-height animated white',

    events: {
      'click .tab-link': 'displayTab',
      'click table.backgrid th input': 'checkSelectAll',
      'click button.js-btn-delete-locations': 'warnDeleteLocations',
      'click button.js-filter': 'filter',
    },

    ui: {
      'form': '.js-form',
      'formBtns': '.js-form-btns',

      'map': '.js-map',
      
      'locationsfilter' : '.js-locations-filter',

      'totalLocations': '.js-total-locations'
    },

    regions: {
      'rgNavbar': '.js-rg-navbar',
      'rgHistoryGrid': '.js-rg-history-grid',
      'rgEquipmentGrid': '.js-rg-equipment-grid',
      'rgLocationsGrid': '.js-rg-locations-grid',
    },

    model: new Backbone.Model({
      type: 'individuals',
      historyColumnDefs: [
      {
        field: 'Name',
        headerName: 'Name',
      }, {
        field: 'value',
        headerName: 'Value',
      }, {
        field: 'StartDate',
        headerName: 'Start Date',
      },],
      equipmentColumnDefs: [{
        field: 'StartDate',
        headerName: 'Start Date',
      },{
        field: 'EndDate',
        headerName: 'End Date',
      }, {
        field: 'Type',
        headerName: 'Type',
      },{
        field: 'UnicIdentifier',
        headerName: 'Identifier',
      }],
      locationsColumnDefs: [{
        field: 'ID',
        headerName: 'ID',
        checkboxSelection: true,
        pinned: 'left'
      },{
        field: 'Date',
        headerName: 'date',
      },{
        field: 'LAT',
        headerName: 'latitude',
      }, {
        field: 'LON',
        headerName: 'longitude',
      },{
        field: 'region',
        headerName: 'Region',
      },{
        field: 'type_',
        headerName: 'Type',
      },{
        field: 'fieldActivity_Name',
        headerName: 'FieldActivity',
        cellRenderer: function(params){
          if(params.data.ID.split('_').length > 1){
            //ex: sta_44960
            var url = '#stations/' + params.data.ID.split('_')[1];
            return  '<a target="_blank" href="'+ url +'" >' + 
            params.value + ' <span class="reneco reneco-info right"></span>' +
            '</a>';
          } else {
            return ''; 
          }
        }
      }]
    }),

    nbLocations: [],

    initialize: function(options) {
      this.com = new Com();
      this.model.set('id', options.id);
    },

    reloadFromNavbar: function(id) {
      this.model.set('id', id);

      this.com.addModule(this.map);
      this.map.com = this.com;
      this.map.url = config.coreUrl + this.model.get('type') + '/' + id  + '/locations?geo=true';
      this.map.updateFromServ();
      this.map.url = false;

      this.displayForm(this.model.get('id'));
      this.displayGrids(this.model.get('id'));
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      this.displayNavbar();
      this.displayMap();
      this.displayForm();
      this.displayGrids();
    },

    displayNavbar: function(){
      this.rgNavbar.show(this.navbarView = new NavbarView({
        parent: this
      }));
    },

    displayMap: function() {
      var _this = this;
        this.map = new NsMap({
            url: config.coreUrl + this.model.get('type') + '/' + this.model.get('id')  + '/locations?geo=true',
            cluster: true,
            legend: true,
            zoom: 3,
            element: 'map',
            popup: true,
            com: _this.com,
            selection: true,
            idName: 'ID',
            latName: 'LAT',
            lonName: 'LON'
          });
        this.map.url = false;
    },

    displayGrids: function() {
      this.displayHistoryGrid();
      this.displayEquipmentGrid();
      this.displayLocationsGrid();
    },

    displayHistoryGrid: function() {
      this.rgHistoryGrid.show(this.historyGrid = new GridView({
        columns: this.model.get('historyColumnDefs'),
        type: this.model.get('type'),
        url: this.model.get('type') + '/' + this.model.get('id')  + '/history',
        clientSide: true,
      }));
    },

    displayEquipmentGrid: function() {
      this.rgEquipmentGrid.show(this.equipmentGrid = new GridView({
        columns: this.model.get('equipmentColumnDefs'),
        type: this.model.get('type'),
        url: this.model.get('type') + '/' + this.model.get('id')  + '/equipment',
        clientSide: true,
      }));
    },

    displayLocationsGrid: function() {
      var _this = this;
      this.rgLocationsGrid.show(this.locationsGrid = new GridView({
        com: this.com,
        columns: this.model.get('locationsColumnDefs'),
        type: this.model.get('type'),
        url: this.model.get('type') + '/' + this.model.get('id')  + '/locations',
        clientSide: true,
        gridOptions: {
          onRowClicked: function(row){
            _this.locationsGrid.interaction('focus', row.data.ID || row.data.id);
          }
        }
      }));

      this.displayLocationsFilter();

    },
    displayLocationsFilter: function() {
      $(this.ui.locationsfilter).empty();
      var locfiltersList = {
        1: {
          name: 'type_',
          type: 'Text',
          label: 'Types',
          title: 'types'
        },
        2: {
        type: 'Select' ,
        title: 'Fieldacivity',
        name: 'fieldActivity_Name',
        editorClass: 'form-control',
        options: [],
        fieldClass: 'fieldactivity',
        validators: []
      },
        3: {
          name: 'Date',
          type: 'DateTimePickerEditor',
          label: 'Date',
          title: 'Date',
          options:{isInterval: 1}
        }
      };
      this.locfilters = new NsFilter({
        filters: locfiltersList,
        com: this.com,
        clientSide: true,
        filterContainer: this.ui.locationsfilter
      });
      this.loadCollection(config.coreUrl + 'fieldActivity', 'select.fieldActivity_Name');
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

    displayForm: function() {
      var _this = this;
      this.nsform = new NsForm({
        name: 'IndivForm',
        modelurl: config.coreUrl + this.model.get('type'),
        formRegion: this.ui.form,
        buttonRegion: [this.ui.formBtns],
        displayMode: 'display',
        id: this.model.get('id'),
        reloadAfterSave: true,
        parent: this.parent,
        displayDelete: false,
      });

    },


    warnDeleteLocations: function() {
      var _this = this;
      var selectedNodes = this.locationsGrid.gridOptions.api.getSelectedNodes();

      if(!selectedNodes.length){
        return;
      }

      var callback = function() {
        _this.deleteLocations(selectedNodes);
      };
      var opt = {
        title: 'Are you sure?',
        text: 'selected locations will be deleted'
      };
      this.swal(opt, 'warning', callback);
    },

    deleteLocations: function(selectedNodes) {
      var _this = this;
      var url = config.coreUrl + this.model.get('type') + '/' + this.model.get('id')  + '/locations';

      var selectedIds = selectedNodes.map(function(node){
        return node.data.ID;
      });

      $.ajax({
        url: url,
        method: 'PUT',
        data: {'IDs': JSON.stringify(selectedIds)},
        context: this,
      }).done(function(resp) {
        _this.map.updateFromServ();
        this.locationsGrid.gridOptions.api.removeItems(selectedNodes);
      }).fail(function(resp) {
        this.swal(resp, 'error');
      });
    },

    filter: function() {
      this.locfilters.update();
    },

    swal: function(opt, type, callback) {
      var btnColor;
      switch (type){
        case 'success':
          btnColor = 'green';
          opt.title = 'Success';
          break;
        case 'error':
          btnColor = 'rgb(147, 14, 14)';
          opt.title = 'Error';
          break;
        case 'warning':
          if (!opt.title) {
            opt.title = 'warning';
          }
          btnColor = 'orange';
          break;
        default:
          return;
          break;
      }

      Swal({
        title: opt.title,
        text: opt.text || '',
        type: type,
        showCancelButton: true,
        confirmButtonColor: btnColor,
        confirmButtonText: 'OK',
        closeOnConfirm: true,
      },
      function(isConfirm) {
        //could be better
        if (isConfirm && callback) {
          callback();
        }
      });
    },

    loadCollection: function(url, element) {
      var collection =  new Backbone.Collection();
      collection.url = url;
      var elem = $(element);
      elem.append('<option></option>');
      collection.fetch({
        success: function(data) {
          //could be a collectionView
          for (var i in data.models) {
            var current = data.models[i];
            var value = current.get('value') || current.get('PK_id');
            var label = current.get('label') || current.get('fullname');
            elem.append("<option value ='" + label + "'>"+ label + "</option>");
          }
        }
      });
    },

  });
});
