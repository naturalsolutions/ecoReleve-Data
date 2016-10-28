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

    regions: {
      protocolsMenu: '.js-protocols-menu',
    },

    events: {
      
    },


    initialize: function(options) {
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
      //this.feedProtoPicker();
    },

    initMenu: function() {
      var _this = this;
      var ProtoItem = Marionette.LayoutView.extend({
        template: 'app/modules/stations/templates/tpl-menuItemView.html',
        className: 'js-proto-item noselect clearfix col-xs-12',

        modelEvents: {
          'change:total': 'updateTotal',
        },

        events: {
         'click': 'handleActive',
         'click .js-btn-add-obs': 'addObs',
        },
          
        ui: {
          'total' : 'span#total'
        },

        updateTotal: function(){
          this.model.set('total', this.model.get('obs').length);
        },

        handleActive:function(e){
          var hash = window.location.hash.split('?');
          var obs;
          if(this.model.get('obs').length){
            //here
            obs = this.model.get('obs')[0];
          }
          if(!obs){
            obs = 0;
          }
          var url = hash[0] + '?proto=' + this.model.get('ID') + '&obs=' + obs;
          Backbone.history.navigate(url, {trigger: true});
        },

        addObs: function(e){
          e.stopPropagation();
          var hash = window.location.hash.split('?');
          var url = hash[0] + '?proto=' + this.model.get('ID') + '&obs=' + 0;
          Backbone.history.navigate(url, {trigger: true});
        }
      });
      
      var Tmp = Marionette.CollectionView.extend({
        getViewFromUrlParams: function(params){
          var view;
          var views = this.children._views;
          if(!params.obs && !params.proto){
            view = views[Object.keys(views)[0]];
          }

          console.log(params.obs);

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
            if(params.obs){
              console.warn('Observation n°' + params.obs + ' doesn\'t exist for this station');
            }

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
            if(view.model.get('obs').length){
              var tmp = view.model.get('obs')[0];
              if(!tmp){
                tmp = view.model.get('obs')[0];
              }
              view.model.set('currentObs', tmp);
            } else {
              view.model.set('currentObs', 0);
            }
          }


          view.model.set('stationId', _this.model.get('stationId'));
          view.$el.addClass('active');

          _this.parent.rgProtocol.show(new Protocol({
            model: view.model
          }));
          
          
        },

        onShow: function(){
          this.getViewFromUrlParams(_this.model.get('urlParams'));
        }
      });

      this.protocolsItems = new Tmp({
        collection : this.collection,
        childView: ProtoItem,
        className: 'coll-view',
      });
      this.protocolsMenu.show(this.protocolsItems);
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
      } else {
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
