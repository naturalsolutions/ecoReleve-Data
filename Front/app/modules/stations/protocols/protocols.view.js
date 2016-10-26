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
      this.parent = options.parent;
      this.collection = new Backbone.Collection();
      console.log(this.model);
    },

    displayFirstProto: function(){
      // var protoId = this.model.get('protocolId');
      // var view;
      // if(protoId){
      //   var model = this.protocolsItems.collection.findWhere({'ID': parseInt(protoId)});
      //   if(this.model.get('observationId') && model){
      //     model.set('observationId', this.model.get('observationId'));
      //   }
      //   view = this.protocolsItems.children.findByModel(model);
      // }
      // if(!view){
      //   view = this.protocolsItems.children.findByIndex(0);
      // }
      // this.cProtoItemView = view;
      // this.displayProtocol(view);
    },

    initMenu: function() {
      var _this = this;
      var ProtoItem = Marionette.LayoutView.extend({
        template: 'app/modules/stations/templates/tpl-menuItemView.html',
        className: 'js-proto-item noselect clearfix col-xs-12',

        modelEvents: {
          'change:total': 'updateTotal',
          'change:active': 'handleActive'
        },

        events: {
         'click': 'displayAssociatedProtocol',
         'click .js-btn-add-obs': 'addObs',
        },
          
        ui: {
          'total' : 'span#total'
        },

        updateTotal: function(){
          
        },

        handleActive: function(){
          console.log(this.model.get('active'));
        },

        initialize: function(model){
          this.model.set('stationId', _this.model.get('id'));
          this.model.set('active', false);
        },

        displayAssociatedProtocol:function(e){
          //this.model.set('active', true);
          //_this.displayProtocol(this);
        },

        onRender: function(){
          this.model.get('obs').map(function(obs){
            if(_this.model.get('obs') == obs){
              this.$el.addClass('active');
              _this.displayProtocol(this);
            }
          })
        },

        addObs: function(e){
          e.stopPropagation();
          _this.displayProtocol(this);
        }
      });

      this.protocolsItems = new Marionette.CollectionView({
        collection : this.collection,
        childView: ProtoItem,
        className: 'coll-view',
      });
      this.protocolsItems.render();
      this.ui.protocolsMenu.html(this.protocolsItems.el);

      this.displayFirstProto();
    },
    
    displayProtocol: function(protoItemView, obsIndex){
      
      //protoItemView.$el.addClass('active');
      //var obsId = 
      this.parent.rgProtocol.show(new Protocol({
        model: protoItemView.model
      }));
    },

    onShow: function(){
      var _this = this; 
      this.collection.fetch({
        url: 'stations/' + _this.model.get('id') + '/protocols',
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
