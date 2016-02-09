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
  'ns_modules/ns_com',
  'ns_map/ns_map',
  'ns_form/NSFormsModuleGit',
  'moment',
  'ns_navbar/ns_navbar'

], function($, _, Backbone, Marionette, Swal, Translater,
 config, NsGrid, Com, NsMap, NsForm, moment, Navbar) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/validate/templates/tpl-sensorValidateDetail.html',

    className: 'full-height animated white',

    events: {
      'click button#autoValidate': 'autoValidate',
      'click table.backgrid th input': 'checkSelectAll',
      'click button#validate': 'validate',
      'change select#frequency': 'updateFrequency',
    },

    ui: {
      'grid': '#grid',
      'paginator': '#paginator',
      'totalEntries': '#totalEntries',
      'map': '#map',
      'indForm': '#indForm',
      'sensorForm': '#sensorForm',
      'frequency': 'select#frequency',

      'dataSetIndex': '#dataSetIndex',
      'dataSetTotal': '#dataSetTotal',

      'totalS' : '#totalS',
      'total' : '#total',
    },

    regions: {
      'rgNavbar': '#navbar'
    },

    initialize: function(options) {
      this.translater = Translater.getTranslater();
      this.type = options.type;

      this.com = new Com();
      this.model = options.model;

      this.indId = this.model.get('FK_Individual');
      this.pttId = this.model.get('FK_ptt');
      this.sensorId = this.model.get('FK_Sensor');

      this.frequency = options.frequency;

      this.navbar = new Navbar({
        parent: this,
        globalGrid: options.globalGrid,
        model: this.model,
      });

      this.globalGrid = options.globalGrid;
    },

    onRender: function() {
      this.$el.i18n();
    },

    reloadFromNavbar: function(model) {
      this.model = model;
      this.pttId = model.get('FK_ptt');
      this.indId = model.get('FK_Individual');
      this.com = new Com();
      this.map.destroy();
      this.ui.map.html('');
      this.display();
    },

    onShow: function() {
      var _this = this;
      this.rgNavbar.show(this.navbar);
      this.display();
      this.com.onAction = function() {
        // _this.setTotal();
      };
    },

    setTotal: function(){
      this.ui.totalS.html(this.grid.grid.getSelectedModels().length);
      this.ui.total.html(this.grid.grid.collection.length);
    }, 

    display: function() {
      var _this = this;
      if (this.indId == 'null' || !this.indId) this.indId = 'none';
      if (this.indId == 'none') {
        this.swal({title: 'No individual attached'}, 'warning');
        this.ui.indForm.html('<span class="bull-warn">●</span>No individual is attached');
      }else {
        this.displayIndForm();
      }
      this.displayGrid();

      setTimeout(function(){
        _this.displayMap();
        $.when(_this.map.deffered, _this.grid.deferred).done(function() {
            _this.initFrequency();
        });
      }, 0);
      this.displaySensorForm();
    },

    //initialize the frequency
    initFrequency: function() {
      if (this.frequency) {
        this.ui.frequency.find('option[value="' + this.frequency + '"]').prop('selected', true);
      }else {
        this.frequency = this.ui.frequency.val();
      }
      this.perHour(this.frequency);
    },

    displayGrid: function() {
      var _this = this;
      var myCell = Backgrid.NumberCell.extend({
        decimals: 5,
        orderSeparator: ' ',
      });

      var cols = [{
        name: 'PK_id',
        label: 'PK_id',
        editable: false,
        renderable: false,
        cell: 'string',
      }, {
        name: 'date',
        label: 'DATE',
        editable: false,
        cell: 'string'
      }, {
        editable: false,
        name: 'lat',
        label: 'LAT',
        cell: myCell,
      }, {
        editable: false,
        name: 'lon',
        label: 'LON',
        cell: myCell,
      }, {
        editable: false,
        name: 'ele',
        label: 'ELE (m)',
        cell: Backgrid.IntegerCell.extend({
          orderSeparator: ''
        }),
      }, {
        editable: false,
        name: 'dist',
        label: 'DIST (km)',
        cell: myCell,
      }, {
        editable: false,
        name: 'speed',
        label: 'SPEED (km/h)',
        cell: myCell,
        formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
          fromRaw: function(rawValue, model) {
            if (rawValue == 'NaN') {
              rawValue = 0;
            }
            return rawValue;
          }
        }),
      },{
        name: 'type',
        label: 'Type',
        renderable: this.showTypeCol,
        editable: false,
        formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
          fromRaw: function(rawValue, model) {
            if (rawValue == 'arg') {
              rawValue = 'Argos';
            } else {
              rawValue = 'GPS'
            }
            return rawValue;
          }
        }),
        cell: 'string'
      }, {
        editable: true,
        name: 'import',
        label: 'IMPORT',
        cell: 'select-row',
        headerCell: 'select-all'
      }];

      var url = config.coreUrl + 'sensors/' + this.type      +
      '/uncheckedDatas/' + this.indId + '/' + this.pttId;
      this.grid = new NsGrid({
        pagingServerSide: false,
        columns: cols,
        com: this.com,
        pageSize: 2000,
        url: url,
        idName: 'PK_id',
        rowClicked: true,
        totalElement: 'totalEntries',
      });

      this.grid.onceFetched = function() {
        _this.clone();
      };

      this.grid.rowClicked = function(args) {
        _this.rowClicked(args);
      };
      this.grid.rowDbClicked = function(args) {
        _this.rowDbClicked(args);
      };

      this.grid.clearAll = function() {
        var coll = new Backbone.Collection();
        coll.reset(this.grid.collection.models);
        for (var i = coll.models.length - 1; i >= 0; i--) {
          coll.models[i].attributes.import = false;
        };

        var collection = this.grid.collection;
        collection.each(function(model) {
          model.trigger('backgrid:select', model, false);
        });
      },

      this.ui.grid.html(this.grid.displayGrid());
      this.ui.paginator.html(this.grid.displayPaginator());
    },

    rowClicked: function(args) {
      var row = args.row;
      var id = row.model.get('PK_id');

      if ($(args.evt.target).is('input')) {
        this.grid.interaction('selection', id);
      } else {
        this.grid.interaction('focus', id);
      }
    },

    rowDbClicked: function(args) {
      var row = args.row;
      var id = row.model.get('PK_id');
      if ($(args.evt.target).is('input')) {
        this.grid.interaction('selection', id);
      } else {
        this.grid.interaction('selection', id);
        this.grid.interaction('focus', id);
      }
    },

    checkSelectAll: function(e) {
      var ids = _.pluck(this.grid.collection.models, 'PK_id');
      var ids = this.grid.collection.pluck('PK_id');
      if (!$(e.target).is(':checked')) {
        this.grid.interaction('resetAll', ids);
      } else {
        this.grid.interaction('selectionMultiple', ids);
      }
    },

    displayMap: function() {
      var url = config.coreUrl + 'sensors/' + this.type      +
      '/uncheckedDatas/' + this.indId + '/' + this.pttId + '?geo=true';
      this.map = new NsMap({
        url: url,
        selection: true,
        cluster: true,
        com: this.com,
        zoom: 7,
        element: 'map',
        bbox: true
      });
    },

    displayIndForm: function() {
      this.nsform = new NsForm({
        name: 'IndivForm',
        buttonRegion: [this.ui.btn],
        modelurl: config.coreUrl + 'individuals',
        formRegion: this.ui.indForm,
        displayMode: 'display',
        id: this.indId,
        reloadAfterSave: false,
      });
    },

    displaySensorForm: function() {
      this.nsform = new NsForm({
        name: 'sensorForm',
        buttonRegion: [this.ui.btn],
        modelurl: config.coreUrl + 'sensors',
        formRegion: this.ui.sensorForm,
        displayMode: 'display',
        id: this.sensorId,
        reloadAfterSave: false,
      });
    },

    roundDate: function(date, duration) {
      return moment(Math.floor((+date) / (+duration)) * (+duration));
    },

    clone: function() {
      this.origin = this.grid.collection.fullCollection.clone();
    },

    perHour: function(frequency) {
      this.grid.interaction('resetAll');
      var _this = this;

      if (frequency != 'all') {
        frequency = parseInt(frequency);
        var col0 = this.origin.at(0);

        var date = new moment(col0.get('date'),'DD/MM/YYYY HH:mm:ss');
        var groups = this.origin.groupBy(function(model) {
          var curr = new moment(model.get('date'),'DD/MM/YYYY HH:mm:ss');
          return _this.roundDate(curr, moment.duration(frequency, 'minutes'));
        });
        var ids = [];
        var i = 0;
        for (var rangeDate in groups) {
          var curLength = groups[rangeDate].length;
          var tmp = groups[rangeDate][curLength - 1].get('PK_id');
          ids.push(tmp);
        }
        this.grid.interaction('selectionMultiple', ids);
      } else {
        var ids = this.grid.collection.pluck('PK_id');
        this.grid.interaction('selectionMultiple', ids);
      }
    },

    updateFrequency: function(e) {
      var frequency = $(e.target).val();
      if (!isNaN(frequency))
      this.perHour(frequency);
    },

    validate: function() {
      var _this = this;
      var url = config.coreUrl + 'sensors/' + this.type      +
      '/uncheckedDatas/' + this.indId + '/' + this.pttId;
      var mds = this.grid.grid.getSelectedModels();
      if (!mds.length) {
        return;
      }
      var col = new Backbone.Collection(mds);
      var params = col.pluck('PK_id');
      $.ajax({
        url: url,
        method: 'POST',
        data: {data: JSON.stringify(params)},
        context: this,
      }).done(function(resp) {
        if (resp.errors) {
          resp.title = 'An error occured';
          resp.type = 'error';
        }else {
          resp.title = 'Success';
          resp.type = 'success';
        }

        var callback = function() {
          _this.navbar.navigateNext();
          //loose the focus due to re-fetch
          _this.globalGrid.fetchCollection();
        };
        resp.text = 'existing: ' + resp.existing + ', inserted: ' + resp.inserted + ', errors:' + resp.errors;
        this.swal(resp, resp.type, callback);
      }).fail(function(resp) {
        this.swal(resp, 'error');
      });
    },

    swal: function(opt, type, callback) {
      var btnColor;
      switch (type){
        case 'success':
          btnColor = 'green';
          break;
        case 'error':
          btnColor = 'rgb(147, 14, 14)';
          break;
        case 'warning':
          btnColor = 'orange';
          break;
        default:
          return;
          break;
      }

      Swal({
        title: opt.title || opt.responseText || 'error',
        text: opt.text || '',
        type: type,
        showCancelButton: false,
        confirmButtonColor: btnColor,
        confirmButtonText: 'OK',
        closeOnConfirm: true,
      },
      function(isConfirm) {
        //could be better
        if (callback) {
          callback();
        }
      });
    },

  });
});
