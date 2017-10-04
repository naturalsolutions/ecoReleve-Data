//radio
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'moment',

  'ns_modules/ns_com',
  'ns_map/ns_map',
  'ns_form/NSFormsModuleGit',
  'ns_grid/grid.view',
  'ns_navbar/navbar.view',

], function(
  $, _, Backbone, Marionette, Swal, Translater, moment,
  Com, NsMap, NsForm, GridView, NavbarView
){

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/validate/validate.rd.tpl.html',
    className: 'full-height animated white',

    events: {
      'change .js-select-frequency': 'handleFrequency',
      'click .js-btn-validate': 'validate',
    },

    ui: {
      'map': '#map',
      'individualForm': '.js-individual-form',
      'sensorForm': '.js-sensor-form',
      'selectFrequency': '.js-select-frequency'
    },

    regions: {
      'rgGrid': '.js-rg-grid',
      'rgNavbar': '.js-rg-navbar',
    },

    initialize: function(options) {
      this.model = new Backbone.Model();
      this.com = new Com();
      this.model.set('type', options.type);
      this.frequency = options.frequency;      
      this.index = options.index - 1;
      this.fetchGrid();
    },

    fetchGrid: function(){
      var _this = this;
      return this.deferred = $.ajax({
        url: 'sensors/' + this.model.get('type') + '/uncheckedDatas',
        method: 'GET',
        context: this,
      }).done(function(data){
        _this.model.set('data', data[1]);
        _this.populateModel();

        _this.rgNavbar.show(this.navbarView = new NavbarView({
          parent: _this,
          index: _this.index,
          list: data[1],
          type: _this.model.get('type')
        }));
      });
    },

    populateModel: function(){
      this.model.set('FK_Individual', this.model.get('data')[this.index].FK_Individual);
      this.model.set('FK_Sensor', this.model.get('data')[this.index].FK_Sensor);
      this.model.set('FK_ptt', this.model.get('data')[this.index].FK_ptt);
    },

    reload: function(options){
      this.ui.selectFrequency.val('');
      this.index = parseInt(options.index) - 1;
      this.populateModel();

      this.com = new Com();
      this.com.addModule(this.map);
      this.map.com = this.com;
      this.map.url = 'sensors/' + this.model.get('type') + '/uncheckedDatas/' + this.model.get('FK_Individual') + '/' + this.model.get('FK_ptt') + '?geo=true';
      this.map.updateFromServ();
      this.map.url = false;

      this.displayForms();
      this.displayGrids();
    },

    onShow: function(){
      var _this = this;
      $.when(this.deferred).then(function(resp){
        _this.displayMap();
        _this.displayForms();
        _this.displayGrids();
      });
    },

    displayForms: function(){
      this.displayIndForm();
      this.displaySensorForm();
    },

    displayMap: function() {
      var url = 'sensors/' + this.model.get('type') + '/uncheckedDatas/' + this.model.get('FK_Individual') + '/' + this.model.get('FK_ptt') + '?geo=true';
      this.map = new NsMap({
        url: url,
        selection: true,
        cluster: true,
        com: this.com,
        zoom: 7,
        element: 'map',
        bbox: true,
        player: true
      });
    },

    displayIndForm: function() {
      if(this.model.get('FK_Individual') === null){
        this.swal({title: 'No individual attached'}, 'warning');
        this.ui.individualForm.html('<br /><span class="bull-warn">●</span>No individual is attached');
        return;
      }

      this.nsform = new NsForm({
        name: 'IndivForm',
        buttonRegion: [],
        modelurl: 'individuals',
        formRegion: this.ui.individualForm,
        displayMode: 'display',
        id: this.model.get('FK_Individual'),
        reloadAfterSave: false,
      });
    },

    displaySensorForm: function() {
      this.nsform = new NsForm({
        name: 'sensorForm',
        buttonRegion: [],
        modelurl: 'sensors',
        formRegion: this.ui.sensorForm,
        displayMode: 'display',
        id: this.model.get('FK_Sensor'),
        reloadAfterSave: false,
      });
    },

    displayGrids: function(){
      var _this = this;

      var columnDefs = [{
        field: 'date',
        headerName: 'DATE',
        minWidth: 200,
      }, {
        field: 'PK_id',
        headerName: 'PK_id',
        hide: false,
      }, {
        field: 'lat',
        headerName: 'LAT',
      }, {
        field: 'lon',
        headerName: 'LON',
      }, {
        field: 'ele',
        headerName: 'ELE (m)',
      }, {
        field: 'dist',
        headerName: 'DIST (km)',
      }, {
        field: 'speed',
        headerName: 'SPEED (km/h)',
      },{
        field: 'type',
        headerName: 'Type',
      }];

      this.rgGrid.show(this.gridView = new GridView({
        columns: columnDefs,
        com: this.com,
        url: 'sensors/' + this.model.get('type') + '/uncheckedDatas/' + this.model.get('FK_Individual') + '/' + this.model.get('FK_ptt'),
        afterFirstRowFetch: this.initFrequency.bind(this),
        clientSide: true,        
        idName: 'PK_id',
        gridOptions: {
          rowSelection: 'multiple',
          enableFilter: true,
          onRowClicked: function(row){
            _this.gridView.interaction('focus', row.data.PK_id || row.data.id);
          },
          onRowDoubleClicked: function(row){
            _this.gridView.interaction('focusAndZoom', row.data.PK_id || row.data.id);
          }
        },
      }));
    },

    onRender: function() {
      this.$el.i18n();
    },

    initFrequency: function() {
      var hz = 'all';
      if(this.model.get('type') == 'gsm' || this.model.get('type') == 'rfid'){
        hz = 60;
      }
      this.ui.selectFrequency.find('option[value="' + hz + '"]').prop('selected', true).change();
    },

    roundDate: function(date, duration) {
      return moment(Math.floor((+date) / (+duration)) * (+duration));
    },

    handleFrequency: function(e){
      var _this= this;
      var hz = $(e.target).val();

      if(hz === 'all'){
        this.gridView.interaction('selectAll');
        return;
      }

      this.gridView.interaction('deselectAll');

      hz = parseInt(hz);
      var coll = new Backbone.Collection(this.gridView.gridOptions.rowData[1]);

      var groups = coll.groupBy(function(model) {
        var modelDAte = new moment(model.get('date'),'DD/MM/YYYY HH:mm:ss');
        return _this.roundDate(modelDAte, moment.duration(hz, 'minutes'));
      });

      var idList = [];
      for (var rangeDate in groups) {
        var curLength = groups[rangeDate].length;
        var lastOccurence = groups[rangeDate][curLength - 1].get('PK_id');
        idList.push(lastOccurence);
      }

      this.gridView.interaction('multiSelection', idList);
    },

    validate: function(){
      var _this = this;
      if(this.model.get('FK_Individual') === null){
        return;
      }

      var url = 'sensors/' + this.model.get('type') + '/uncheckedDatas/' + this.model.get('FK_Individual') + '/' + this.model.get('FK_ptt');
      var selectedNodes = this.gridView.gridOptions.api.getSelectedNodes();
      if(!selectedNodes.length){
        return;
      }

      var selectedIds = selectedNodes.map(function(node){
        return node.data.PK_id;
      });
      
      $.ajax({
        url: url,
        method: 'POST',
        data: {data: JSON.stringify(selectedIds)},
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
          $.when(_this.fetchGrid()).then(function(){
            var hash = window.location.hash.split('/').slice(0,-1).join('/');
            if(!_this.model.get('data').length){
              Backbone.history.navigate(hash + '/', {trigger: true});
              return;
            }
            if(_this.index + 1 == _this.model.get('data').length){
              _this.index = 0;
              Backbone.history.navigate(hash + '/' + (_this.index + 1), {trigger: true});
              return;
            }
            Backbone.history.loadUrl(Backbone.history.fragment);
          });
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
