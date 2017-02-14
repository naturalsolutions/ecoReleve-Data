define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  './protocol.view',
  './protocol.grid.view',

  'i18n'
], function($, _, Backbone, Marionette, Protocol, ProtocolGrid) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/protocols/protocols.tpl.html',
    className: 'protocols full-height',

    regions: {
      protocolsMenu: '.js-protocols-menu',
    },

    ui: {
      'protoPicker': '.js-proto-picker'
    },

    events: {
      'change .js-proto-picker': 'addProtoFromList' 
    },

    initialize: function(options){
      this.parent = options.parent;
      this.collection = new Backbone.Collection();
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
      this.feedProtoPicker();
    },

    initMenu: function() {
      var _this = this;
      var ProtoItem = Marionette.LayoutView.extend({
        template: 'app/modules/stations/protocols/protocol.item.tpl.html',
        className: 'js-proto-item noselect clearfix col-xs-12',

        events: {
         'click': 'handleActive',
         'click .js-btn-add-obs': 'addObs',
        },
          
        ui: {
          'total' : '.js-total-records',
        },

        modelEvents: {
          'change:obs': 'updateTotal',
        },

        initialize: function(){
         //this.model.set('grid', true);
        },

        updateTotal: function(){
          this.ui.total.html(this.model.get('obs').length);
        },
        
        handleActive:function(e){
          var hash = window.location.hash.split('?');
          var obs;
          if(this.model.get('obs').length){
            obs = this.model.get('obs')[0];
          }
          if(!obs){
            obs = 0;
          }
          var url = hash[0] + '?proto=' + this.model.get('ID') + '&obs=' + obs;
          Backbone.history.navigate(url, {trigger: true});
        },

        addObs: function(e){
          if(e)
          e.stopPropagation();
          var hash = window.location.hash.split('?');
          var url = hash[0] + '?proto=' + this.model.get('ID') + '&obs=' + 0;
          Backbone.history.navigate(url, {trigger: true});
        }
      });
      
      var ProtosItems = Marionette.CollectionView.extend({
        getViewFromUrlParams: function(params){
          var view;
          var views = this.children._views;
          
          //search obs
          if(params.obs && params.obs != 0){
            for(var key in views){
              var cView = views[key];
              cView.$el.removeClass('active');
              
              cView.model.get('obs').map(function(obs, i){
                if(obs == params.obs){
                  view = cView;
                  view.model.set('currentObs', params.obs);
                  return;
                }
              });
            }
          }

          if(!view){
            if(params.obs && params.obs != 0){
              console.warn('Observation n°' + params.obs + ' doesn\'t exist for this station');
            }
            //search proto
            for(var key in views){
              var cView = views[key];
              cView.$el.removeClass('active');
              if(params.proto == cView.model.get('ID')){
                view = cView;
                if(view.model.get('obs').length){
                  if(params.obs != 0){
                    view.model.set('currentObs', view.model.get('obs')[0]);
                  } else {
                    view.model.set('currentObs', 0);
                  }
                } else {
                  view.model.set('currentObs', 0);
                }
              }
            }
          }

          if(!view){
            if(params.proto){
              console.warn('Protocol n°' + params.proto + ' doesn\'t exist for this station');
            }
            
            view = views[Object.keys(views)[0]];
            if(!view){
              _this.parent.rgProtocol.empty();
              return;
            }

            if(view.model.get('obs').length){
              view.model.set('currentObs', view.model.get('obs')[0]);
            } else {
              view.model.set('currentObs', 0);
            }
          }

          var hash = window.location.hash.split('?');
          var url = hash[0] + '?proto=' + view.model.get('ID') + '&obs=' + view.model.get('currentObs');
          

          $.xhrPool.allowAbort = false;
          Backbone.history.navigate(url, {trigger: false});
          $.xhrPool.allowAbort = true;

          view.model.set('stationId', _this.model.get('stationId'));
          view.$el.addClass('active');



          if( view.model.get('grid') ){
            _this.parent.rgProtocol.show(new ProtocolGrid({
              model: view.model
            }));
          } else {
            _this.parent.rgProtocol.show(new Protocol({
              model: view.model
            }));
          }
        },

        onShow: function(){
          this.getViewFromUrlParams(_this.model.get('urlParams'));
        }
      });

      this.protocolsItems = new ProtosItems({
        collection : this.collection,
        childView: ProtoItem,
        className: 'coll-view',
      });
      this.protocolsMenu.show(this.protocolsItems);
    },

    feedProtoPicker: function() {
      var _this = this;
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
      //could be better (cf back)
      var name = this.ui.protoPicker.find(':selected').text();
      var objectType = parseInt(this.ui.protoPicker.val());

      var md = this.collection.findWhere({'ID': objectType});
      if (md) {
        var index = this.collection.indexOf(md);
      } else {
        this.addNewProtoType(name, objectType);
      }
      this.ui.protoPicker.val(this.ui.protoPicker.find('option:first').val());
    },

    addNewProtoType: function(name, objectType) {
      var _this = this;

      var proto = new Backbone.Model();

      this.jqxhr = $.ajax({
        url: 'stations/' + this.model.get('id') + '/observations/0',
        context: this,
        type: 'GET',
        data: {
          FormName: '_' + objectType + '_',
          ObjectType: objectType,
          DisplayMode: 'edit'
        },
        dataType: 'json',
        success: function(data) {
          proto.set({Name: name});
          proto.set({ID: objectType});
          proto.set({fieldsets: data.fieldsets});
          proto.set({schema: data.schema});
          proto.set({obs: []});

          this.collection.push(proto);
          var index = this.collection.indexOf(proto);
          this.protocolsItems.children.last().addObs();
          
        },
        error: function(msg) {
          console.warn('request new proto error');
        }
      });
    },

  });
});
