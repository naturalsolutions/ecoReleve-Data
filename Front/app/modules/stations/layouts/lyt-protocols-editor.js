define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  './lyt-protocol',
  './lyt-protocol-grid',

  'i18n'
], function($, _, Backbone, Marionette, config, LytProto, LytProtoGrid) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/templates/tpl-protocols-editor.html',
    className: 'protocol-editor full-height',

    ui: {
      protoMenuContainer: '#protoMenuContainer',
      protoFormsContainer: 'div#protoFormsContainer',
      protoPicker: 'select#protoPicker'
    },

    events: {
      'click #addProto': 'addProtoFromList',
      'click button#addObs': 'addObs',
      'click #protoMenuContainer .js-menu-item': 'getIndex',
    },

    initialize: function(options) {
      var _this = this;
      this.stationId = options.stationId;

      this.collection = new Backbone.Collection();
      this.collection.fetch({
        url: config.coreUrl + 'stations/' + this.stationId + '/protocols',
        reset: true, 
        data: {
          FormName: 'ObsForm',
          DisplayMode: 'edit'
        },
        success: function(data){
          _this.initMenu();
          _this.initProtos();
          _this.displayFirst();
        },
      });
    },

    displayFirst: function(){
      this.ui.protoMenuContainer.find('.js-menu-item:first').click();
    },

    displayLast: function(){
      this.ui.protoMenuContainer.find('.js-menu-item:last').click();
    },

    initMenu: function() {
      var LytMenuItem = Marionette.LayoutView.extend({
        modelEvents: {
          'change:current': 'updateVisibility',
          'change:total': 'updateTotal',
        },

        className: 'js-menu-item noselect clearfix col-xs-12',

        ui: {
          'total' : 'span#total'
        },

        initialize: function(model){
          var name = this.model.get('Name');
          var total = this.model.get('total');
          var id = this.model.get('ID');
          this.template = 'app/modules/stations/templates/tpl-menuItemView.html';
        },

        updateTotal: function() {
          this.ui.total.html(this.model.get('total'));
        },

        updateVisibility: function() {
          if (this.model.get('current')) {
            this.$el.addClass('active');
          } else {
            this.$el.removeClass('active');
          }
        },
      });

      this.collViewMenu = new Marionette.CollectionView({
        collection : this.collection,
        childView: LytMenuItem,
        className: 'coll-view'
      });
      this.collViewMenu.render();
      this.ui.protoMenuContainer.html(this.collViewMenu.el);
    },

    initProtos: function() {
      this.listenTo(this.collection, 'destroy', this.displayLast);

      //this.collection.models[0].set('grid', true);

      var CustomCollectionView = Marionette.CollectionView.extend({
        getChildView: function(item) {
          if (item.get('grid')) {
            return LytProtoGrid;
          }
          else {
            return LytProto;
          }
        },
      });

      this.collViewProto = new CustomCollectionView({
        collection : this.collection,
        childViewOptions: { stationId: this.stationId },
        childView: LytProto,
        className: 'full-height clearfix',
      });
      
      this.collViewProto.render();
      this.ui.protoFormsContainer.html(this.collViewProto.el);
    },

    
    getIndex: function(e){
      var listItem = $(e.currentTarget);
      var index = this.ui.protoMenuContainer.find('.js-menu-item').index( listItem );
      
      this.updateProtoStatus(index);
      //add obs
      if ($(e.target).is('button') || $(e.target).parent().is('button')) {
        this.currentView.addObs();
      }
    },

    updateProtoStatus: function(index){
      if (this.currentView) {
        this.currentView.model.set('current', false);
      }

      this.currentView = this.collViewProto.children.findByIndex(index);
      if(this.currentView) {
        this.currentView.model.set('current', true);
      }
    },


    
    onRender: function(){
      this.feedProtoPicker();
    },

    feedProtoPicker: function() {
      var _this = this;
      this.ui.protoPicker.append('<option value="" disabled selected>Add a protocol</option>');
      this.protoSelectList = new Backbone.Collection();
      this.protoSelectList.fetch({
        url: config.coreUrl + '/protocolTypes',
        reset: true,
        success: function() {
          _.each(_this.protoSelectList.models,function(model) {
            _this.ui.protoPicker.append(new Option(model.get('Name'),model.get('ID')));
          },this);
        },
      });
    },

    addProtoFromList: function() {
      var name = this.ui.protoPicker.find(':selected').text();
      var objectType = parseInt(this.ui.protoPicker.val());

      var md = this.collection.findWhere({'ID': objectType});
      if (md) {
        var index = this.collection.indexOf(md);
        this.updateProtoStatus(index);
        this.currentView.addObs();
      }else {
        this.addNewProtoType(name, objectType);
      }
    },

    addNewProtoType: function(name, objectType) {
      var _this = this;

      var proto = new Backbone.Model();

      this.jqxhr = $.ajax({
        url: config.coreUrl + 'stations/' + this.stationId + '/protocols/0',
        context: this,
        type: 'GET',
        data: {
          FormName: '_' + objectType + '_',
          ObjectType: objectType,
          DisplayMode: 'edit'
        },
        dataType: 'json',
        success: function(resp) {
          proto.set({Name: name});
          proto.set({ID: objectType});
          proto.set({show: true});
          proto.set({obs: {
            data: resp.data,
            fieldsets: resp.fieldsets,
            schema: resp.schema
          }});
          this.collection.push(proto);
          var index = this.collection.indexOf(proto);
          this.updateProtoStatus(index);
        },
        error: function(msg) {
          console.warn('request new proto error');
        }
      });
    },
    

  });
});