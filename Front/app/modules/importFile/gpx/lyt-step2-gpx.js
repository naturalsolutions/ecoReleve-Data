define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',

  'ns_modules/ns_com',
  'ns_map/ns_map',
  'ns_grid/grid.view',
  'moment',
  'i18n'

], function($, _, Backbone, Marionette, Swal,
  Com, NsMap, GridView,Moment
) {

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
      this.data = options.model.attributes.data_FileContent;
      this.deferred = $.Deferred();
      window.formChange  = false;
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
        url: 'fieldActivity',
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

      var latRenderer = function(params){
        return params.data.latitude.toFixed(5);
      };

      var lonRenderer = function(params){
        return params.data.longitude.toFixed(5);
      };

      var dateTimestampRender = function(params){
        return Moment.unix(params.data.displayDate).format("DD/MM/YYYY HH:mm:SS");
      };

      var columnsDefs = [
        {
          field: 'name',
          headerName: 'Name',
          checkboxSelection: true,
        },{
          field: 'id',
          headerName: 'ID',
          hide: true,
        },{
          field: 'displayDate',
          headerName: 'Date',
          cellRenderer: dateTimestampRender
        },{
          field: 'latitude',
          headerName: 'LAT',
          cellRenderer: latRenderer
        },{
          field: 'longitude',
          headerName: 'LON',
          cellRenderer: lonRenderer
        },{
          editable: true,
          field: 'fieldActivity',
          headerName: 'Field Activity',
          cellEditor: FieldActivityEditor,
          cellRenderer: FieldActivityRenderer
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
          onRowClicked: function(row){
            if(_this.gridView.gridOptions.api.getFocusedCell().column.colId != 'fieldActivity'){
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

      coll.url = 'stations/';
      Backbone.sync('create', coll, {
        success: function(data) {
          _this.deferred.resolve();
          var inserted = data.new;
          var exisits = data.exist;
          Swal({
            title: 'Stations import',
            text: 'inserted stations :' + inserted + ', exisiting stations:' + exisits,
            type: 'success',
            showCancelButton: true,
            confirmButtonColor: 'green',
            cancelButtonText: 'Import new gpx',
            confirmButtonText: 'Show imported data',
            closeOnConfirm: true,

          },
          function(isConfirm) {
            if( isConfirm ) {
              Backbone.history.navigate('stations/lastImported', {trigger: true});
            }
            else {
            //  Backbone.history.navigate('importFile',{trigger: true});

              //Backbone.history.navigate('home', {trigger: true});

              //method to return at the 1st step
              _this.options.parent.currentStepIndex--;
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
       window.formChange  = false;
    }

  });
});
