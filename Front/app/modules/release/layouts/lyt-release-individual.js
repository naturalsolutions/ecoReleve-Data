//radio
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'config',
  'ns_modules/ns_com',
  'ns_grid/model-grid',
  'ns_filter/model-filter',
  'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',

], function($, _, Backbone, Marionette, Swal, Translater, config,
<<<<<<< HEAD
	Com, NsGrid, NsFilter, SensorPicker, tplSensorPicker
=======
  Com, NsGrid, NsFilter, ObjectPicker
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/release/templates/tpl-release-individual.html',
    className: 'full-height animated white rel',
<<<<<<< HEAD
=======
    ui: {
      'grid': '#grid',
      'paginator': '#paginator',
      'filters': '#indiv_filters',
      'detail': '#detail',
      'totalEntries': '#totalEntries',
      'nbSelected': '#nbSelected'
    },
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca

    events: {
      'click #btnFilter': 'filter',
      'click #back': 'hideDetails',
      'click button#clear': 'clearFilter',
      'click #release': 'toolTipShow',
      'click #addSensor': 'addSensor',
    },

<<<<<<< HEAD
    ui: {
      'grid': '#grid',
      'paginator': '#paginator',
      'filters': '#indiv_filters',
      'detail': '#detail',
      'totalEntries': '#totalEntries',
      'nbSelected': '#nbSelected'
    },
=======
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca

    regions: {
      modal: '#modal',
    },

    initialize: function(options) {
      this.translater = Translater.getTranslater();
      this.com = new Com();
<<<<<<< HEAD
      this.station = options.station;
      this.releaseMethod = null;

      var _this = this;
      var mySensorPicker = SensorPicker.extend({
        initialize: function(options) {
          var template =  _.template(tplSensorPicker);
          this.$el.html(template);
          this.com = new Com();
          this.displayGrid();
          this.displayFilter();
          this.translater = Translater.getTranslater();
        },
        rowClicked: function(row) {
          console.log(row);
          var id = row.model.get('ID');

=======

      this.station = options.station;
      this.model = options.station;

      this.releaseMethod = null;

      var _this = this;

      //todo: fix
      var MySensorPicker = ObjectPicker.extend({
        rowClicked: function(row) {
          var id = row.model.get('ID');
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
          var unicName = row.model.get('UnicIdentifier');
          _this.currentRow.model.set({unicSensorName: unicName});
          this.setValue(id);
        },
        getValue: function() {
<<<<<<< HEAD
				},
        setValue: function(value) {
          _this.currentRow.model.set({FK_Sensor: value});
          console.log(_this.currentRow.model)
          this.hidePicker();
        },
      });
      this.sensorPicker = new mySensorPicker();
=======
        },
        setValue: function(value) {
          _this.currentRow.model.set({unicSensorName: value});
          _this.currentRow.model.set({FK_Sensor: value});
          this.hidePicker();
        },
      });
      this.sensorPicker = new MySensorPicker({
        key : 'FK_Sensor',
        schema: {
          title : 'sensors',
        }
      });
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
      this.sensorPicker.render();

      this.initGrid();
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      this.displayFilter();
      this.displayGrid();
<<<<<<< HEAD
      Backbone.history.navigate('release/individuals',{trigger: false});
=======
      //Backbone.history.navigate('release/individuals',{trigger: false});
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
    },

    initGrid: function() {
      var myGrid = NsGrid.extend({
      });

      var _this = this;
      this.grid = new myGrid({
        pageSize: 1400,
        pagingServerSide: false,
<<<<<<< HEAD
        com: this.com,
=======
        //com: this.com,
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
        url: config.coreUrl + 'release/individuals/',
        urlParams: this.urlParams,
        rowClicked: true,
        totalElement: 'totalEntries',
        onceFetched: function(params) {
          _this.totalEntries(this.grid);
        }
      });
      this.grid.rowClicked = function(args) {
        _this.rowClicked(args.row);
      };
      this.grid.rowDbClicked = function(args) {
        _this.rowDbClicked(args.row);
      };

      this.grid.collection.on('backgrid:selected', function(model, selected) {
        _this.updateSelectedRow();
      });
    },

    displayGrid: function() {

      this.ui.grid.html(this.grid.displayGrid());
<<<<<<< HEAD
      /*			this.ui.paginator.html(this.grid.displayPaginator());*/
=======
      /*      this.ui.paginator.html(this.grid.displayPaginator());*/
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
    },

    displayFilter: function() {
      this.filters = new NsFilter({
        url: config.coreUrl + 'release/individuals/',
<<<<<<< HEAD
        com: this.com,
=======
        //com: this.com,
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
        filterContainer: this.ui.filters,
      });
    },

    rowClicked: function(row) {
      if (this.currentRow) {
        this.currentRow.$el.removeClass('active');
      }
      row.$el.addClass('active');
      this.currentRow = row;
    },

    rowDbClicked: function(row) {
      this.currentRow = row;
      var curModel = row.model;
      curModel.trigger('backgrid:select', curModel, true);

    },
    updateSelectedRow: function() {
      var mds = this.grid.grid.getSelectedModels();
      var nbSelected = mds.length;
      this.$el.find(this.ui.nbSelected).html(nbSelected);
    },

    filter: function() {
<<<<<<< HEAD
=======
      console.log('passed');
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
      this.filters.update();
    },

    clearFilter: function() {
      this.filters.reset();
    },

    totalEntries: function(grid) {
      this.total = grid.collection.state.totalRecords;
      $(this.ui.totalEntries).html(this.total);
    },
    release: function() {
      var mds = this.grid.grid.getSelectedModels();
      if (!mds.length) {
        return;
      }
      var _this = this;
      var col = new Backbone.Collection(mds);
      $.ajax({
        url: config.coreUrl + 'release/individuals/',
        method: 'POST',
        data: {IndividualList: JSON.stringify(col),StationID: this.station.get('ID'),releaseMethod: _this.releaseMethod},
        context: this,
      }).done(function(resp) {
        if (resp.errors) {
          resp.title = 'An error occured';
          resp.type = 'error';
        }else {
          resp.title = 'Success';
          resp.type = 'success';

        }
        resp.text = 'release: ' + resp.release;

        //remove the model from the coll once this one is validated
        var callback = function() {
          Backbone.history.navigate('stations/' + _this.station.get('ID'), {trigger: true});
          //$('#back').click();
        };
        this.swal(resp, resp.type, callback);

      }).fail(function(resp) {
        this.swal(resp, 'error');
      });
    },

    addSensor: function() {
      this.modal.show(this.sensorPicker);
      this.sensorPicker.showPicker();
    },

    hidePicker: function() {
      this.sensorPicker.hidePicker();
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
        showCancelButton: true,
        confirmButtonColor: btnColor,
        confirmButtonText: 'See Station',
        cancelButtonColor: 'grey',
        cancelButtonText: 'New Release',
        closeOnConfirm: true,
      },
<<<<<<< HEAD
			function(isConfirm) {
  //could be better
  if (isConfirm && callback) {
    callback();
  }else {
    Backbone.history.navigate('release', {trigger: true});
  }
			});
=======
      function(isConfirm) {
  //could be better
        if (isConfirm && callback) {
          callback();
        }else {
          Backbone.history.navigate('release', {trigger: true});
        }
      });
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
    },

    toolTipShow: function(e) {
      var _this = this;
      $(e.target).tooltipList({

        position: 'top',
        //  pass avalaible options
        availableOptions: [{'label': 'direct release','val': 1},{'label': 'direct release grid 5x5','val': 2},],
        //  li click event
        liClickEvent: $.proxy(function(liClickValue, origin, tooltip) {
<<<<<<< HEAD
          console.log(liClickValue);
          _this.releaseMethod = liClickValue;
          _this.release();
          //console.log(origin);
=======
          _this.releaseMethod = liClickValue;
          _this.release();
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
        }, this),
      });
      $(e.target).tooltipster('show');
    }
  });
});
