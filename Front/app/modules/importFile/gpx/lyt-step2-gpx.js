define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  'ns_modules/ns_com',
  //'ns_filter/model-filter_module',
  'ns_filter_bower',
  'ns_map/ns_map',
  'ns_grid/model-grid',
  'sweetAlert',
  'i18n'

], function($, _, Backbone, Marionette, config,
  Com, NsFilter, NsMap, NsGrid, Swal
) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/importFile/gpx/templates/tpl-step2-gpx.html',

    name : '<span class="import-step2"></span>',

    ui: {
      'grid': '#grid',
      'filters': '#filters',
      'paginator': '#paginator',
      'totalSelected': '#totalSelected'
    },

    //temp
    events: {
      'click #btnSelectionGrid': 'clearSelectedRows',
      'click table.backgrid th input': 'checkSelectAll',
      'click button#filter': 'filter',
      'change table td': 'setFieldActivity',
      'click button#clear': 'clearFilter',
    },

    initialize: function(options) {
      this.com = new Com();
      this.collection = options.model.attributes.data_FileContent;
      this.deferred = $.Deferred();
      window.formChange  = false;
    },

    onShow: function() {
      this.$el.i18n();
      this.displayGrid();
      this.displayFilters();
      this.displayMap();
      var stepName = i18n.translate('import.stepper.step2-gpxlabel');
      $('.import-step2').html(stepName);
    },

    displayMap: function() {
      //should 2 it in the map?
      var features = {
        'features': [],
        'type': 'FeatureCollection'
      };

      var feature, attr;
      this.collection.each(function(m) {
        attr = m.attributes;
        feature = {
          'type': 'Feature',
          'id': attr.id,
          'geometry': {
            'type': 'Point',
            'coordinates': [attr.latitude, attr.longitude],
          },
          'properties': {
            'date': '2014-10-23 12:39:29'
          },
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

    displayFilters: function() {
      this.filtersList = {
        1: {
          name: 'name',
          type: 'Text',
          label: 'Name',
          title: 'Name',
        },
/*        2: {
          name: 'latitude',
          type: 'LatitudeEditor',
          label: 'Latitude'
        },
        3: {
          name: 'longitude',
          type: 'LongitudeEditor',
          label: 'Longitude'
        },*/
        4: {
          name: 'waypointTime',
          type: 'DateTimePickerEditor',
          label: 'Date',
          title: 'Date',
          options:{isInterval: 1}
        }
      };
      this.filters = new NsFilter({
        filters: this.filtersList,
        com: this.com,
        clientSide: true,
        filterContainer: this.ui.filters
      });
    },

    displayGrid: function() {
      var _this = this;
      var myCell = Backgrid.NumberCell.extend({
        decimals: 5
      });

      /*var html = Marionette.Renderer.render('app/modules/import/_gpx/templates/options-list.html');
            var optionsList = $.parseHTML(html);*/
      var optionsList;
      this.loadCollection(config.coreUrl + 'fieldActivity', function(data) {
        optionsList = $.parseHTML(data);
        var option = [];
        for (var i = 0; i < optionsList.length; i++) {
          option[0] = $(optionsList[i]).text();
          option[1] = $(optionsList[i]).attr('value');
          optionsList[i] = option;
          option = [];
        };
        var columns = [
        {
          name: 'id',
          label: 'ID',
          editable: false,
          renderable: false,
          cell: 'string'
                },
                {
          editable: true,
          name: 'import',
          label: 'Import',
          cell: 'select-row',
          headerCell: 'select-all'
                },{
          name: 'name',
          label: 'Name',
          editable: false,
          cell: 'string'
        }, {
          name: 'displayDate',
          label: 'Date',
          editable: false,
          //cell: 'string',// Backgrid.DatetimeCell

          cell : Backgrid.Extension.MomentCell.extend({
            displayFormat: "DD/MM/YYYY HH:mm",
            //modelFormat : "DD/MM/YYYY HH:mm",
             modelInUnixTimestamp: true,
            displayInUTC: false
          }),
        }, {
          editable: false,
          name: 'latitude',
          label: 'LAT',
          cell: myCell
                }, {
          editable: false,
          name: 'longitude',
          label: 'LON',
          cell: myCell
        },{
          editable: true,
          name: 'fieldActivity',
          label: 'Field Activity',
          cell: Backgrid.SelectCell.extend({
            optionValues: optionsList
          })
        },
      ];

        _this.grid = new NsGrid({
          pagingServerSide: false,
          pageSize: 20,
          rowClicked: true,
          com: _this.com,
          columns: columns,
          collection: _this.collection,
          totalSelectedUI: _this.ui.totalSelected
        });

        //should be in the module
        _this.ui.grid.html(_this.grid.displayGrid());
        _this.ui.paginator.html(_this.grid.displayPaginator());

        var tmp = _.clone(_this.grid.grid.collection.fullCollection);
        _this.com.setMotherColl(tmp);

        _this.grid.rowClicked = function(args) {
            _this.rowClicked(args);
        };
/*        _this.grid.rowDbClicked = function(args) {
          _this.rowDbClicked(args);
        };*/

      });

    },

    rowClicked: function(args) {
      var row = args.row;
      var id = row.model.get('id');
      var e = args.evt;

      if($(e.target).hasClass('editable') || $(e.target).is('select')){
        return;
      }

      if ($(args.evt.target).is('input')) {
        this.grid.interaction('selection', id);
      } else {
        this.grid.interaction('focus', id);
      }
    },

/*    rowDbClicked: function(args) {
      var row = args.row;
      var id = row.model.get('id');
      var e = args.evt;

      this.rowClicked(args);

      if ($(args.evt.target).is('input')) {
        this.grid.interaction('selection', id);
      } else {
        this.grid.interaction('selection', id);
        this.grid.interaction('focus', id);
      }
      
    },*/

    checkSelectAll: function(e) {
    var ids = _.pluck(this.grid.collection.fullCollection.models, 'id');
      if (!$(e.target).is(':checked')) {
        this.grid.interaction('resetAll', ids);
      } else {
        this.grid.interaction('selectionMultiple', ids);
      }
    },


    filter: function() {
      this.filters.update();
    },
    clearFilter: function() {
      this.filters.reset();
    },
    /*-----  End of Should be in the module  ------*/

    onDestroy: function() {
    },

    check: function() {

    },
    validate: function() {
      var _this = this;
      //seturl 4 mother coll
      var datas
      var coll = this.com.getMotherColl();
      coll = new Backbone.Collection(coll.where({import: true}));
      console.log(coll);


      coll.url = config.coreUrl + 'stations/';
      Backbone.sync('create', coll, {
        success: function(data) {
          _this.deferred.resolve();
          var inserted = data.new;
          var exisits = data.exist;
          Swal({
            title: 'Stations import',
            text: 'inserted stations :' + inserted + ', exisiting stations:' + exisits,
            type: 'success',
            showCancelButton: false,
            confirmButtonColor: 'green',
            confirmButtonText: 'OK',
            closeOnConfirm: true,
          },
          function(isConfirm) {
              Backbone.history.navigate('home', {trigger: true})
          });
        },
        error: function() {
        },
      });

      return this.deferred;
    },
    loadCollection: function(url, callback) {
      var collection =  new Backbone.Collection();
      collection.url = url;
      collection.fetch({
        success: function(data) {
          var elems = '<option value=""></option>';
          //could be a collectionView
          for (var i in data.models) {
            var current = data.models[i];
            var value = current.get('value') || current.get('PK_id');
            var label = current.get('label') || current.get('fullname');
            elems += '<option value =' + value + '>' + label + '</option>';
          }
          callback(elems);
        }
      });
    },
    setFieldActivity : function(){
       window.formChange  = false;
    }

  });
});
