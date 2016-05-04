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
  'ns_modules/ns_com',

], function($, _, Backbone, Marionette, Swal, Translater, config,
 NsGrid, NsMap, NsForm, Navbar, Com
) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/individuals/templates/tpl-individuals-detail.html',
    className: 'full-height animated white',

    events: {
      'click #hideIndivDetails': 'hideDetail',
      'click #showIndivDetails': 'showDetail',
      'click .tab-link': 'displayTab',

      'click table.backgrid th input': 'checkSelectAll',

      'click button#deleteLocations': 'warnDeleteLocations'
    },
    ui: {
      'grid': '#grid',
      'gridEquipment': '#gridEquipment',
      'form': '#form',
      'map': '#map',
      'paginator': '#paginator',
      'paginatorEquipment': '#paginatorEquipment',
      'details': '#indivLeft',
      'mapContainer': '#indivRight',
      'showHideCtr': '#showIndivDetails',
      'formBtns': '#formBtns',

      'locationsGrid': '#locationsGrid',
      'locationsPaginator': '#locationsPaginator',
    },

    regions: {
      'rgNavbar': '#navbar'
    },

    rootUrl : '#individuals/',

    initialize: function(options) {
      if (options.indivId) {
        this.indivId = options.indivId;
      }else {
        this.translater = Translater.getTranslater();
        this.model = options.model;
        this.navbar = new Navbar({
          parent: this,
          globalGrid: options.globalGrid,
          model: options.model,
        });
      }
      this.com = new Com();
    },

    reloadFromNavbar: function(model) {
      this.display(model);
      this.com.addModule(this.map)
      this.map.com = this.com;
      this.map.url = config.coreUrl + 'individuals/' + this.indivId  + '?geo=true';
      this.map.updateFromServ();
      Backbone.history.navigate(this.rootUrl + this.indivId, {trigger: false});
    },


    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      var _this = this;
      if (this.indivId) {
        this.displayForm(this.indivId);
        this.displayGrid(this.indivId);
        setTimeout(function() {
          _this.displayMap();
        },0);
      }else {
        this.rgNavbar.show(this.navbar);
        this.display(this.model);
        setTimeout(function() {
          _this.displayMap();
        },0);
      }
    },

    display: function(model) {
      this.com = new Com();
      this.model = model;
      this.indivId = parseInt(this.model.get('ID'));
      this.displayForm(this.indivId);
      this.displayGrid(this.indivId);
    },

    displayGrid: function(id) {
      var cols = [{
        name: 'Name',
        label: 'Name',
        editable: false,
        cell: 'string'
      }, {
        name: 'value',
        label: 'Value',
        editable: false,
        cell: 'string'
      }, {
        name: 'StartDate',
        label: 'Start Date',
        editable: false,
        cell: 'stringDate',
      },];
      this.grid = new NsGrid({
        pageSize: 20,
        columns: cols,
        pagingServerSide: false,
        url: config.coreUrl + 'individuals/' + id  + '/history',
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
        label: 'Identifier',
        editable: false,
        cell: 'string'
      }];
      this.gridEquip = new NsGrid({
        pageSize: 20,
        columns: colsEquip,
        pagingServerSide: false,
        url: config.coreUrl + 'individuals/' + id  + '/equipment',
        urlParams: this.urlParams,
        rowClicked: true,
      });

      this.ui.grid.html(this.grid.displayGrid());
      this.ui.gridEquipment.html(this.gridEquip.displayGrid());
      this.ui.paginator.html(this.grid.displayPaginator());
      this.ui.paginatorEquipment.html(this.gridEquip.displayPaginator());

      this.displayLocationsGrid();
    },

    displayLocationsGrid: function() {
      var _this = this;
      var locationsCols = [{
        name: 'ID',
        label: 'ID',
        editable: false,
        renderable: true,
        cell: 'string'
      },{
        name: 'Date',
        label: 'date',
        editable: false,
        cell: 'stringDate'
      },/*{
        name: 'timestamp',
        label: 'date',
        editable: false,
        cell : 'stringDate'
      }*/{
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
        name: 'region',
        label: 'Region',
        editable: false,
        cell: 'string'
      },{
        name: 'type_',
        label: 'Type',
        editable: false,
        cell: 'string'
      },{
        name: 'fieldActivity_Name',
        label: 'FieldActivity',
        editable: false,
        cell: Backgrid.StringCell.extend({
          render: function () {
            this.$el.empty();
            var rawValue = this.model.get(this.column.get("name"));
            var formattedValue = this.formatter.fromRaw(rawValue, this.model);
            if (this.model.get('type_')=='station'){

          /*    this.$el.append($('<a>', {
                  href: 'http://'+window.location.hostname+window.location.pathname+'#stations/'+this.model.get('ID').replace('sta_',''),
                  title: formattedValue,
                  target: '_blank'
              }).text(formattedValue));*/


               this.$el.append('<a target="_blank"' 
                +'href= "http://'+window.location.hostname+window.location.pathname+'#stations/'+this.model.get('ID').replace('sta_','')+'">\
                  '+rawValue +'&nbsp;&nbsp;&nbsp;<span class="reneco reneco-info" ></span>\
                </a>');
              this.delegateEvents();
            }
            return this;
        }
        })

      },{
          editable: true,
          name: 'import',
          label: 'Import',
          cell: Backgrid.Extension.SelectRowCell.extend({
            render:function(){
              this.$el.empty().append('<input tabindex="-1" type="checkbox" />');
              this.delegateEvents();
              if (this.model.get('type_')== 'station'){
                this.$el.addClass('hidden');
              }
              return this;
              }
          }),
          headerCell: 'select-all'
      }];

      this.locationsGrid = new NsGrid({
        pagingServerSide: false,
        pageSize: 10,
        columns: locationsCols,
        url: config.coreUrl + 'individuals/' + this.indivId  + '/locations',
        rowClicked: true,
        com: this.com,
        idName: 'ID'
      });

      this.locationsGrid.rowClicked = function(args) {
        _this.rowClicked(args);
      };

      this.ui.locationsGrid.html(this.locationsGrid.displayGrid());
      this.ui.locationsPaginator.html(this.locationsGrid.displayPaginator());
      this.$el.find('.select-all-header-cell').html('\
        <button id="deleteLocations" class="btn btn-danger btn-sm">\
        <span class="reneco reneco-trash"></span>\
        </button>');
    },

    //should be in the grid module
    rowClicked: function(args) {
      var row = args.row;
      var evt = args.evt;

      if ($(evt.target).is('input')) {
        var id = $(evt.target).parent().parent().find('td').html();
        this.locationsGrid.interaction('selection', id);
      } else {
        var id = row.model.get('ID');
        this.locationsGrid.interaction('focus', id);
      }
      //more efficient
      //row.model.collection.remove(row.model);
    },

    displayMap: function() {
      this.map = new NsMap({
        url: config.coreUrl + 'individuals/' + this.indivId  + '/locations?geo=true',
        cluster: true,
        zoom: 3,
        element: 'map',
        popup: true,
        com: this.com,
        selection: true
      });
    },

    focus: function(e) {
      var tr, id;
      if ($(e.target).is('td')) {
        tr = $(e.target).parent();
      } else if ($(e.target).parent().is('td')) {
        tr = $(e.target).parent().parent();
      }
      id = tr.find('td').first().text();
      this.locationsGrid.interaction('focus', id);
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

    displayForm: function(id) {
      var _this = this;
      this.nsform = new NsForm({
        name: 'IndivForm',
        modelurl: config.coreUrl + 'individuals',
        formRegion: this.ui.form,
        buttonRegion: [this.ui.formBtns],
        displayMode: 'display',
        id: id,
        reloadAfterSave: true,
        parent: this.parent,
        displayDelete: false,
      });

      this.nsform.afterDelete = function() {
        /*
        var jqxhr = $.ajax({
          url: config.coreUrl + 'individuals/' + id,
          method: 'DELETE',
          contentType: 'application/json'
        }).done(function(resp) {
          Backbone.history.navigate(_this.rootUrl, {trigger : true});
        }).fail(function(resp) {
        });*/
      };
    },

    hideDetail: function() {
      $(this.ui.details).animate({
        marginLeft: '-60%',
      }, 500, function() {
      });
      this.updateSize('hide');
    },

    showDetail: function() {
      $(this.ui.details).animate({
        marginLeft: '0',
      }, 500, function() {
      });
      this.updateSize('show');
    },

    warnDeleteLocations: function() {

      var _this = this;

      var mds = this.locationsGrid.grid.getSelectedModels();

      console.log(mds.length);
      if (!mds.length) {
        return;
      }

      var callback = function() {
        _this.deleteLocations(mds);
      };
      var opt = {
        title: 'Are you sure?',
        text: 'selected locations will be deleted'
      };
      this.swal(opt, 'warning', callback);
    },

    deleteLocations: function(mds) {
      var _this = this;

      var coll = new Backbone.Collection(mds);

      console.log(mds);

      var params = coll.pluck('ID');

      console.log(params);

      var url = config.coreUrl + 'individuals/' + this.indivId  + '/locations';
      $.ajax({
        url: url,
        method: 'PUT',
        data: {'IDs': JSON.stringify(params)},
        context: this,
      }).done(function(resp) {
        _this.map.updateFromServ();
        var fullColl = _this.locationsGrid.grid.body.collection.fullCollection;
        for (var i = 0; i < mds.length; i++) {
          fullColl.remove(mds[i]);
        }
        fullColl.reset(fullColl.models);
      }).fail(function(resp) {
        this.swal(resp, 'error');
      });
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
