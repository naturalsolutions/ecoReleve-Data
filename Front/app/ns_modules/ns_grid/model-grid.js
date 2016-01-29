define([
  'jquery',
  'underscore',
  'backbone',
  'backgrid',
  'backbone.paginator',
  'backgrid.paginator',
  'ns_grid/model-col-generator',
  'moment',
  'backgrid-moment-cell',
  'floatThead'
  //'backgridSelect_all',
], function ($, _, Backbone, Radio, PageColl, Paginator, ColGene, moment, MomentCell) {
  'use strict';
  return Backbone.Model.extend({

    /*===================================
    =            Grid module            =
    ===================================*/
    
    init: false,
    pagingServerSide: true,
    coll: false,
    totalElement: null,
    filterCriteria: {},
    RowType: null,
    follow: false,

    initialize: function (options) {
      var _this = this;
      if (options.com) {
        this.com = options.com;
        this.com.addModule(this);
      }

      this.idName = options.idName;

      //basic options
      this.url = options.url;
      this.pagingServerSide = options.pagingServerSide;
      this.pageSize = options.pageSize;

      //extra options
      this.totalElement = options.totalElement || false;
      this.searchCriteria = options.urlParams || false; //default filters criterias
      this.sortCriteria = options.sortCriteria || {}; //default sort criterias //usefull?
      this.idCell = options.idCell || 'ID'; //set the specific ID column cell
      

      //callback && functions
      this.onceFetched = options.onceFetched;
      if (options.rowClicked) {
        this.RowType = Backgrid.Row.extend({
          events: {
            'click': 'onClick',
            'dblclick' : 'onDbClick'
          },
          onClick: function (e) {
            _this.interaction('rowClicked', {row: this, evt: e});
          },
          onDbClick: function(e){
            _this.interaction('rowDbClicked', {row: this, evt: e});
          }
        });
      }
      else {
        if (options.row) {
          this.RowType = options.row;
        } else {
          this.RowType = Backgrid.Row;
        }
      }

      this.typeObj = options.typeObj || false;


      this.name = options.name || 'default';

      //should be in init function?
      if (options.columns) {
        this.columns = options.columns;
      } else {
        var url;
        if (this.typeObj) {
          url = this.url + 'getFields?name=' + this.name + '&typeObj=' + this.typeObj;
        } else {
          url = this.url + 'getFields?name=' + this.name;
        }
        this.colGene = new ColGene({
          url: url,
          paginable: this.pagingServerSide,
          checkedColl: options.checkedColl,
        });
        this.columns = this.colGene.columns;
      }

      //well..
      if (options.collection) {
        this.collection = options.collection;
        this.coll = true;
      }
      else {
        this.initCollectionFromServer();
      }

      this.setHeaderCell();



      if (options.filterCriteria) {
        this.filterCriteria = options.filterCriteria;
      }


      this.initGrid();
      this.eventHandler();
    },


    setHeaderCell: function() {
      if (!this.pagingServerSide) {
        Backgrid.Column.prototype.defaults.headerCell = undefined;
      } else {
          Backgrid.Column.prototype.defaults.headerCell = Backgrid.HeaderCell.extend({
            onClick: function (e) {
              e.preventDefault();
              var column = this.column;
              var collection = this.collection;
              var sortCriteria = (collection.sortCriteria && typeof collection.sortCriteria.id === 'undefined') ? collection.sortCriteria : {};

              switch(column.get('direction')){
                case null:
                  column.set('direction', 'ascending');
                  sortCriteria[column.get('name')] = 'asc';
                  break;
                case 'ascending':
                  column.set('direction', 'descending');
                  sortCriteria[column.get('name')] = 'desc';
                  break;
                case 'descending':
                  column.set('direction', null);
                  delete sortCriteria[column.get('name')];
                  break;
                default:
                  break;
              }
              
              var tmp= this.column.attributes.name;

              if(!Object.keys(sortCriteria).length > 0)
                collection.sortCriteria[tmp] = 'asc';
              
              collection.sortCriteria = sortCriteria;
              collection.fetch({reset: true});
            },
          });
        }
    },

    initCollectionFromServer: function () {
      if (this.pagingServerSide) {
        this.initCollectionPaginableServer();
      } else if (this.pageSize) {
        this.initCollectionPaginableClient();
      }
      else {
        this.initCollectionNotPaginable();
      }
    },

    initCollectionPaginableServer: function () {
      var _this = this;
      var PageCollection = PageColl.extend({
        sortCriteria: _this.sortCriteria,
        url: this.url,
        mode: 'server',
        state: {
          pageSize: this.pageSize
        },
        queryParams: {
          offset: function () { return (this.state.currentPage - 1) * this.state.pageSize; },
          criteria: function () {
            //incomplete
            if (_this.searchCriteria) {
              return JSON.stringify(_this.searchCriteria);
            } else {

              return JSON.stringify(this.searchCriteria);
            }
          },
          order_by: function () {
            var criteria = [];
            for (var crit in this.sortCriteria) {
              criteria.push(crit + '=' + this.sortCriteria[crit]);

            }
            return JSON.stringify(criteria);
          },
        },
        fetch: function (options) {
          var params = {
            'page': this.state.currentPage,
            'per_page': this.state.pageSize,
            'offset': this.queryParams.offset.call(this),
            'order_by': this.queryParams.order_by.call(this),
            'criteria': this.queryParams.criteria.call(this),
          };


          if (_this.typeObj) {
            options.data.typeObj = _this.typeObj;
          }

          options.success = function(){

            _this.affectTotalRecords();
            if(_this.onceFetched){
              _this.onceFetched(params);
            }
            if(true){
              _this.upRowServerSide();
              _this.upRowStyle();
            }

          };
          PageColl.prototype.fetch.call(this, options);
        }
      });

      this.collection = new PageCollection();
    },


    upRowStyle: function () {

      var row = this.currentRow;
      var _this = this;
      var rows = this.grid.body.rows;
      if(row){
        for (var i = 0; i < rows.length; i++) {
          if(rows[i].model.get(this.idCell) == _this.currentRow.model.get(this.idCell)){
            _this.currentRow = rows[i];
            rows[i].$el.addClass('active');
          }else{
            rows[i].$el.removeClass('active');
          }
        }
      }
    },



    initCollectionPaginableClient: function () {
      var ctx = this;
      var _this = this;
      /* WARNING ! : you have to declare headerCell: null in columns collection */
      /* TODO fix setting hedearCell */

      var PageCollection = PageColl.extend({
        url: this.url,
        mode: 'client',
        state: {
          pageSize: this.pageSize
        },
        queryParams: {
          order: function () { },
          criteria: function () {
            return JSON.stringify(this.searchCriteria);
          },
        },
        fetch: function (options) {
          var params = {
            'criteria': this.queryParams.criteria.call(this),
          };
          options.success = function(){
            if(ctx.onceFetched){
              ctx.onceFetched(params);
            }
            if(_this.totalElement){
              _this.affectTotalRecords();
            }
          };
          PageColl.prototype.fetch.call(this, options);
        }
      });
      this.collection = new PageCollection();
    },


    initCollectionNotPaginable: function () {
      this.collection = new Backbone.Collection.extend({
        url: this.url,
      });
    },


    initGrid: function () {
      this.grid = new Backgrid.Grid({
        row: this.RowType,
        columns: this.columns,
        collection: this.collection
      });

      //if no collection is furnished : fetch
      if (!this.coll) {
        this.collection.searchCriteria = {};
        this.fetchCollection({ init: true });
      }
    },

    fetchCollection: function () {
      var _this = this;


      if (this.filterCriteria != null) {

        //<- ??
        if (!this.url){
        }
        else {
        //?? ->
          if(_this.lastImported){
            this.collection.queryParams.lastImported = _this.lastImported;
          } else {
            delete this.collection.queryParams['lastImported'];
          }


          this.deffered = this.grid.collection.fetch({
            reset: true, 
            data: { 'criteria': this.filterCriteria }, 
            success: function () {
              if(_this.totalElement){
                _this.affectTotalRecords();
              }
            }
          });
        }
      }
      
      else {
        this.deffered = this.grid.collection.fetch({ reset: true });
      }
    },


    update: function (args) {
      if (this.pageSize) {
        this.grid.collection.state.currentPage = 1;
        this.grid.collection.searchCriteria = args.filters;
        this.fetchCollection({ init: false });
      }
      else {
        this.filterCriteria = JSON.stringify(args.filters);
        this.fetchCollection({ init: false });

      }
    },

    filter: function (args) {
      if (this.coll) {
        // Client side filter
        this.grid.collection = args;
        this.grid.body.collection = args;
        this.grid.body.refresh();
      }
      else {
        // Server side filter
        this.update({ filters: args });
      }
    },

    displayGrid: function () {
      return this.grid.render().el;
    },
    getGridView : function(){
      return this.grid.render();
    },

    displayPaginator: function () {
      this.paginator = new Backgrid.Extension.Paginator({
        collection: this.collection
      });
      var resultat = this.paginator.render().el;


      return resultat;
    },

    affectTotalRecords: function () {
      if (this.totalElement != null) {
        if(this.paginator || this.pagingServerSide){
          $('#' + this.totalElement).html(this.grid.collection.state.totalRecords);
        }else{
          $('#' + this.totalElement).html(this.grid.collection.length);
        }
      }
    },

    setTotal: function () {
      this.total = this.paginator.state;
    },

    getTotal: function () {
      this.paginator.render();
      return this.paginator.collection.state.totalRecords;

    },

    eventHandler: function () {
      var self = this;
      this.grid.collection.on('backgrid:edited', function (model) {
        model.save({ patch: model.changed });
      })
    },

    Collection: function (options) {
      // to be extended
      
    },

    action: function (action, params) {
      switch (action) {
        case 'focus':
          this.hilight(params);
          break;
        case 'selection':
          this.selectOne(params);
          break;
        case 'selectionMultiple':
          this.selectMultiple(params);
          break;
        case 'resetAll':
          this.clearAll();
          break;
        case 'filter':
          this.filter(params);
          break;
        case 'rowClicked':
          this.rowClicked(params);
          break;
        case 'rowDbClicked':
          this.rowDbClicked(params);
        default:
          break;
      }
    },

    interaction: function (action, id) {
      if (this.com) {
        this.com.action(action, id);
      } else {
        this.action(action, id);
      }
    },

    rowClicked: function(params){
    },

    rowDbClicked: function(params){
    },

    hilight: function () {
    },

    clearAll: function () {
      var coll = new Backbone.Collection();
      coll.reset(this.grid.collection.models);
      for (var i = coll.models.length - 1; i >= 0; i--) {
        coll.models[i].attributes.import = false;
      };
      //to do : iterrate only on checked elements list of (imports == true)
    },


    selectOne: function (id) {
      var coll = new Backbone.Collection();
      coll.reset(this.grid.collection.models);
      var param = {};
      id = parseInt(id);
      if (this.idName) {
        param[this.idName] = id;
      } else {
        param['id'] = id;
      }

      var mod;

      if (this.grid.collection.fullCollection){
        mod = this.grid.collection.fullCollection.findWhere(param);
        var index = this.grid.collection.fullCollection.indexOf(mod);
        index = Math.floor(index/this.pageSize)+1;
        if (index > 0 && this.grid.collection.state.currentPage != index){
          this.grid.collection.getPage(index);
        }
        
      } else {
        mod = this.grid.collection.findWhere(param);
      }


      if (mod.get('import')) {
        mod.set('import', false);
        mod.trigger("backgrid:select", mod, false);
      } else {
        mod.set('import', true);
        mod.trigger("backgrid:select", mod, true);
      }
    },

    selectMultiple: function (idList) {
      var mod;

      for (var i = 0; i < idList.length; i++) {
        var param = {};
        if (this.idName) {
          param[this.idName] = idList[i];
        } else {
          param['id'] = idList[i];
        }
        mod = this.grid.collection.findWhere(param);

        mod.set('import', true);
        mod.trigger("backgrid:select", mod, true);
      };
    },


    lastImportedUpdate : function (lastImported) {
      this.lastImported = lastImported;
      this.fetchCollection();
    },


    upRowServerSide: function () {
    },
  });
});
