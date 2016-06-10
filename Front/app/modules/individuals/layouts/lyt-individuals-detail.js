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
  'ns_filter_bower',
  'backbone.paginator'

], function($, _, Backbone, Marionette, Swal, Translater, config,
 NsGrid, NsMap, NsForm, Navbar, Com,NsFilter,PageColl
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

      'click button#deleteLocations': 'warnDeleteLocations',
      'click button#filter': 'filter',

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
      'locationsfilter' : '#locationsFilter'
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
      this.nbLocations = [];
    },

    reloadFromNavbar: function(model) {
      this.display(model);
      this.com.addModule(this.map)
      this.map.com = this.com;
      this.map.url = config.coreUrl + 'individuals/' + this.indivId  + '/locations?geo=true';
      this.map.updateFromServ();
      this.map.url = false;
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

    displayLocationsGrid: function() {
      var _this = this;
      var locationsCols = [{
        name: 'ID',
        label: 'ID',
        editable: false,
        renderable: false,
        cell: 'string'
      },{
        name: 'Date',
        label: 'date',
        editable: false,
        //cell: 'stringDate'
        cell:Backgrid.Extension.MomentCell.extend({
            displayFormat: "DD/MM/YYYY HH:mm",
            //modelFormat : "DD/MM/YYYY HH:mm",
             //modelInUnixTimestamp: true,
            displayInUTC: false
          }),
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

      this.locationsColl = new Backbone.Collection();
      this.locationsColl.url = config.coreUrl + 'individuals/' + this.indivId  + '/locations';
      this.locationsColl.fetch({data :  $.param({ criteria: {} }) }).done(function(data){
          _this.locationsGrid = new NsGrid({
            pagingServerSide: false,
            pageSize: 10,
            columns: locationsCols,
            collection : _this.locationsColl,
            rowClicked: true,
            com: _this.com,
            idName: 'ID',
            affectTotalRecords : function(){  
             var nbobs;
             if(this.paginator || this.pagingServerSide){
             nbobs = this.grid.collection.state.totalRecords || 0;
             }else{
               nbobs =this.grid.collection.length || 0;
             }

             if(_this.nbLocations.length == 0) {
                $('#totalLocations').html(nbobs);
                _this.nbLocations[0] = nbobs;
             } else {
                _this.nbLocations[1] = nbobs;
               $('#totalLocations').html( nbobs + "/" + _this.nbLocations[0]);
             }
           }
          });

          $('#totalLocations').html(_this.locationsColl.length);
          _this.nbLocations[0] = _this.locationsColl.length;
      
        _this.locationsGrid.rowClicked = function(args) {
          _this.rowClicked(args);
        };

        _this.ui.locationsGrid.html(_this.locationsGrid.displayGrid());
        _this.ui.locationsPaginator.html(_this.locationsGrid.displayPaginator());
        _this.$el.find('.select-all-header-cell').html('\
          <button id="deleteLocations" class="btn btn-danger btn-sm">\
          <span class="reneco reneco-trash"></span>\
          </button>');

        var tmp = _.clone(_this.locationsGrid.grid.collection.fullCollection);
        _this.com.setMotherColl(tmp);
        
      });

        //url: config.coreUrl + 'individuals/' + this.indivId  + '/locations',

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

      var _this = this;
/*      this.mapCollection = new Backbone.Collection();
      this.mapCollection.url = config.coreUrl + 'individuals/' + this.indivId  + '/locations?geo=true';
      this.mapCollection.fetch({ data : {geo:true}}
        ).done(function(data){
          _this.map = new NsMap({
            //url: config.coreUrl + 'individuals/' + this.indivId  + '/locations?geo=true',
            geoJson : data,
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
        });*/

        this.map = new NsMap({
            url: config.coreUrl + 'individuals/' + this.indivId  + '/locations?geo=true',
            //geoJson : data,
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
