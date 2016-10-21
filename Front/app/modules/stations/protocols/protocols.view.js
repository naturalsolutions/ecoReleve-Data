define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  './protocol.view',

  'i18n'
], function($, _, Backbone, Marionette, Protocol) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/protocols/protocols.tpl.html',
    className: 'protocols full-height',

    ui: {
      protocolsMenu: '.js-protocols-menu',
    },

    events: {

    },

    initialize: function(options) {
      this.stationId = options.stationId;
      this.parent = options.parent;
      this.collection = new Backbone.Collection();
    },

    initMenu: function() {
      var _this = this;
      var LytMenuItem = Marionette.LayoutView.extend({
        template: 'app/modules/stations/templates/tpl-menuItemView.html',
        className: 'js-menu-item noselect clearfix col-xs-12',

        // modelEvents: {
        //   'change:total': 'updateTotal',
        // },

        events: {
         'click': 'onClick',
        },
          

        ui: {
          'total' : 'span#total'
        },

        initialize: function(model){
          
        },

        onClick:function(){
          _this.displayProtocol(this.model);
        },

      });

      this.collViewMenu = new Marionette.CollectionView({
        collection : this.collection,
        childView: LytMenuItem,
        className: 'coll-view'
      });
      this.collViewMenu.render();
      this.ui.protocolsMenu.html(this.collViewMenu.el);
    },
      
    displayProtocol: function(model){
      this.parent.rgProtocol.show(new Protocol({
        model: model
      }));
    },


    onShow: function(){
      var _this = this; 
      this.collection.fetch({
        url: 'stations/' + this.stationId + '/protocols',
        reset: true,
        data: {
          FormName: 'ObsForm',
          DisplayMode: 'edit'
        },
        success: function(data){
          _this.initMenu();
        },
      });

      //this.feedProtoPicker();
    },












    feedProtoPicker: function() {
      var _this = this;
      this.ui.protoPicker.append('<option value="" disabled selected>Add a protocol</option>');
      this.protoSelectList = new Backbone.Collection();
      this.protoSelectList.fetch({
        url: '/protocolTypes',
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
        url: 'stations/' + this.stationId + '/protocols/0',
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
