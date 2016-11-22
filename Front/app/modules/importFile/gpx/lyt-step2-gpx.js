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
  'ns_grid/aggrid_custom_date_filter',
  'i18n'

], function($, _, Backbone, Marionette, Swal,
  Com, NsMap, GridView,Moment, DateFilter
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

      var dateTimestampRender = function(params){
        return Moment.unix(params.data.displayDate).format("DD/MM/YYYY HH:mm:SS");
      };

    /*  function DateFilter() {
      }

      DateFilter.prototype.init = function (params) {
        this.eGui = document.createElement('div');
        this.eGui.innerHTML =
            '<div style="display: inline-block; width: 400px;">' +
            '<div style="padding: 10px; background-color: #d3d3d3; text-align: center;">' +
            'This is a very wide filter' +
            '</div>'+
            '<label style="margin: 10px; padding: 50px; display: inline-block; background-color: #999999">'+
            '  <input type="radio" name="yearFilter" checked="true" id="rbAllYears" filter-checkbox="true"/> All'+
            '</label>'+
            '<label style="margin: 10px; padding: 50px; display: inline-block; background-color: #999999">'+
            '  <input type="radio" name="yearFilter" id="rbSince2010" filter-checkbox="true"/> Since 2010'+
            '</label>' +
            '</div>';
        this.rbAllYears = this.eGui.querySelector('#rbAllYears');
        this.rbSince2010 = this.eGui.querySelector('#rbSince2010');
        this.rbAllYears.addEventListener('change', this.onRbChanged.bind(this));
        this.rbSince2010.addEventListener('change', this.onRbChanged.bind(this));
        this.filterActive = false;
        this.filterChangedCallback = params.filterChangedCallback;
        this.valueGetter = params.valueGetter;
    };

    DateFilter.prototype.getGui = function () {
      return this.eGui;
    };

    DateFilter.prototype.onRbChanged = function () {
        this.filterActive = this.rbSince2010.checked;
        this.filterChangedCallback();
    };


    DateFilter.prototype.doesFilterPass = function (params) {
        return params.data.year >= 2010;
    };

    DateFilter.prototype.isFilterActive = function () {
        return this.filterActive;
    };

    DateFilter.prototype.getModel = function() {
        var model = {value: this.rbSince2010.checked};
        return model;
    };

    DateFilter.prototype.setModel = function(model) {
        this.rbSince2010.checked = model.value;
    };*/

      var columnsDefs = [
        {
          field: 'id',
          headerName: 'ID',
          hide: true,
        },{
          field: 'name',
          headerName: 'Name',
          checkboxSelection: true,
        },{
          field: 'displayDate',
          headerName: 'Date',
          cellRenderer: dateTimestampRender,
          filter : DateFilter,
        },{
          field: 'latitude',
          headerName: 'LAT',
        },{
          field: 'longitude',
          headerName: 'LON',
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
