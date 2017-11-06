define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',

  'ns_modules/ns_com',
  'ns_map/ns_map',
  'ns_grid/grid.view',
  'ns_grid/customCellRenderer/decimal5Renderer',
  'ns_grid/customCellRenderer/dateTimeRenderer',
  'ns_grid/custom.editors',
  'ns_grid/custom.renderers',
  'moment',
  'i18n'

], function($, _, Backbone, Marionette, Swal,
  Com, NsMap, GridView, Decimal5Renderer, DateTimeRenderer ,
  Editors, Renderers, Moment ) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/importFile/gpx/templates/tpl-step2-gpx.html',

    name: 'Select stations to import',

    ui: {
      'totalSelected': '.js-total-selected'
    },

    events: {
      //'change select': 'setFieldActivity',
    },

    regions: {
      rgGrid: '.js-rg-grid'
    },

    initialize: function(options) {
      this.com = new Com();
      this.data = options.model.attributes.data_FilesContent;
      this.deferred = $.Deferred();
      this.parent = options.parent;
    },

    onShow: function() {
      this.displayMap();
      $.when(this.loadFieldsActivity()).then(this.displayGrid);
    },

    displayMap: function() {
      //should 2 it in the map?
      var features = {
        'features': [],
        'type': 'FeatureCollection'
      };

      var feature;
      this.data.map(function(f) {
        feature = {
          'type': 'Feature',
          'id': f.id,
          'geometry': {
            'type': 'Point',
            'coordinates': [f.latitude, f.longitude],
          },
          'properties': f,
        };
        features.features.push(feature);
      });
      this.features = features;

      this.map = new NsMap({
        cluster: true,
        popup: false,
        geoJson: this.features,
        com: this.com,
        bbox: true,
        selection: true,
        element: 'map',
        center: [-4.094, 33.006]
      });
    },

    loadFieldsActivity: function() {
      return $.ajax({
        url: 'stations/fieldActivity',
        method: 'GET',
        context: this,
      }).done(function(data){
        this.fieldActivityList = data;
      });
    },


    displayGrid: function() {
      var _this = this;

      var FieldActivityEditor = function () {
      };

      FieldActivityEditor.prototype.init = function(params){
        var self = this;
        this.select = document.createElement('select');
        this.select.className = 'form-control';
        _this.fieldActivityList.map(function(fa){
          var option = document.createElement('option');
          option.text = fa.label;
          option.value = fa.value;
          self.select.add(option);
        });
        this.select.value = params.value;
      };
      FieldActivityEditor.prototype.getGui = function(){
        return this.select;
      };
      FieldActivityEditor.prototype.getValue = function() {
        return this.select.value;
      };

      var FieldActivityRenderer = function(params){
        var text = '';
        _this.fieldActivityList.map(function(fa){
          if(params.data.fieldActivity == fa.value){
            text = fa.label;
          }
        });
        return text;
      };

      var dateTimestampRender = function(params){
        return Moment.unix(params.data.displayDate).format("DD/MM/YYYY HH:mm:SS");
      };

      var columnsDefs = [
        {
          field: 'id',
          headerName: 'ID',
          hide: true
        },
        {
          field: 'name',
          headerName: 'Name',
          filter :"text",
          filterParams : {
            apply : true,
            tabToOrder : this.data.map(function(elem) {return elem.name;})
           }
        },{
          field: 'displayDate',
          headerName: 'Date',
          cellRenderer: DateTimeRenderer,
          filter : "date"
        },{
          field: 'latitude',
          headerName: 'LAT',
          cellRenderer: Decimal5Renderer,
          filter :"number"
        },{
          field: 'longitude',
          headerName: 'LON',
          cellRenderer: Decimal5Renderer,
          filter :"number"
        },{
          editable: true,
          field: 'fieldActivity',
          headerName: 'Field Activity',
          cellEditor: FieldActivityEditor,
          cellRenderer: FieldActivityRenderer,
          filter : "select",
          filterParams : { selectList : this.fieldActivityList }
        },{
          editable: true,
          field: 'Place',
          headerName: 'Place',
          filter :"text",
          cellEditor: Editors.AutocompleteEditor,
          cellRenderer: Renderers.AutocompleteRenderer,
          schema: {
                   validators:[],
                   editable: true,
                   editorClass :"form-control",
                   editorAttrs:{disabled: false},
                   options:{iconFont: "reneco reneco-autocomplete", source: "autocomplete/stations/Place", minLength: 3},
                   fieldClass :"None col-md-6"
                  }
        },
      ];

      this.rgGrid.show(this.gridView = new GridView({
        com: this.com,
        columns: columnsDefs,
        clientSide: true,
        gridOptions: {
          rowData: this.data,
          enableFilter: true,
          singleClickEdit : true,
          rowSelection: 'multiple',
          onRowDoubleClicked: function (row){
            if(_this.gridView.gridOptions.api.getFocusedCell().column.colId != 'fieldActivity'){
              _this.gridView.interaction('focusAndZoom', row.data.ID || row.data.id);
            }
          },
          onRowClicked: function(row){
            var currentClickColumn = _this.gridView.gridOptions.api.getFocusedCell().column.colId;
            if(currentClickColumn != 'fieldActivity' && currentClickColumn != 'Place' ){
              _this.gridView.interaction('focus', row.data.ID || row.data.id);
            }
          }
        }
      }));

    },


    validate: function() {
      var _this = this;

      var selectedNodes = this.gridView.gridOptions.api.getSelectedNodes();
      if(!selectedNodes.length){
        return;
      }
      var coll = new Backbone.Collection(selectedNodes.map(function(node){
        return node.data;
      }));

      coll.url = 'sensors/gpx/datas';
      Backbone.sync('create', coll, {
        success: function(data) {
          _this.deferred.resolve();
          var inserted = data.new;
          var exisits = data.existing;
          var existingNames = data.existing_name
          Swal({
            title: 'Stations import',
            text: inserted + ' inserted station(s), \n'
                  + exisits + ' existing stations, \n'
                  +'Name of existing station: \n'+existingNames,
            type: 'success',
            showCancelButton: true,
            confirmButtonColor: 'green',
            cancelButtonText: 'Import new gpx',
            confirmButtonText: 'Show imported data',
            closeOnConfirm: true,

          },
          function(isConfirm) {
            if( isConfirm ) {
              Backbone.history.navigate('stations?lastImported', {trigger: true});
            }
            else {
              // Backbone.history.navigate('#', {trigger: false});
              // Backbone.history.navigate('importFile/gpx',{trigger: true});

              // //method to return at the 1st step
              _this.options.parent.currentStepIndex = 1;
              var index = _this.options.parent.currentStepIndex;
              _this.options.parent.displayStep(index);
            }
          });
        },
        error: function() {
        },
      });

      return this.deferred;
    },

    setFieldActivity : function(){

    }

  });
});
