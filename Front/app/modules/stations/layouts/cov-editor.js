define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  './lyt-protocol',

  'i18n'
], function($, _, Backbone, Marionette, config, LytProto) {
  'use strict';
  return Marionette.CompositeView.extend({
    template: 'app/modules/stations/templates/tpl-compositeView.html',
    childViewContainer: '#protoFormsContainer',
    childView: LytProto,
    id: 'compositeView',

    ui: {
      protoListContainer: 'ul#protoListContainer',
      protoList: '#protoList',
      protoFormsContainer: '#protoFormsContainer',
    },
    className: 'protocol-editor full-height',

    events: {
      'click #addProto': 'addProtoFromList',
      'click #protoListContainer .input-group': 'getIndex',
      'click button#addObs': 'addObs',
    },

    initialize: function(options) {
      var _this = this;
      this.childViewOptions = { stationId: options.stationId };
      this.stationId = options.stationId;
      Marionette.CompositeView.prototype.initialize.call(this, options);
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
        },
      });
    },

    initMenu: function() {
      var menuItemView = Marionette.ItemView.extend({
        modelEvents: {
          'change:current': 'updateVisibility',
          'change:total': 'updateTotal',
        },

        ui: {
          'li' : 'li.list-group-item',
          'total' : 'span#total'
        },

        initialize: function(model){
          var name = this.model.get('Name');
          var total = this.model.get('total');
          var id = this.model.get('ID');
          this.template = 'app/modules/stations/templates/tpl-menuItemView.html';
        },

        updateTotal: function(){
          this.ui.total.html(this.model.get('obs').length);
        },

        /*
        reRender: function() {
          this.render();
        },*/

        updateVisibility: function() {
          if (this.model.get('current')) {
            this.ui.li.addClass('active');
          } else {
            this.ui.li.removeClass('active');
          }
        },

      });

      this.menu = new Marionette.CollectionView({collection : this.collection, childView: menuItemView});
      this.menu.render();

      this.ui.protoListContainer.html(this.menu.el);
    },

    getIndex: function(e){
      var listItem = $(e.currentTarget);
      var index = this.ui.protoListContainer.find('.input-group').index( listItem );
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
/*      if (this.currentView == this.children.findByIndex(index)) {
        this.currentView.model.set('current', false);
        this.currentView = false;
      } else {*/
        this.currentView = this.children.findByIndex(index);
        this.currentView.model.set('current', true);
      //}
    },

    onRender: function(){
      this.feedProtoList();
    },

    feedProtoList: function() {
      var _this = this;
      this.ui.protoList.append('<option value="" disabled selected>Add a protocol</option>');
      this.protoSelectList = new Backbone.Collection();
      this.protoSelectList.fetch({
        url: config.coreUrl + '/protocolTypes',
        reset: true,
        success: function() {
          _.each(_this.protoSelectList.models,function(model) {
            _this.ui.protoList.append(new Option(model.get('Name'),model.get('ID')));
          },this);
        },
      });
    },

    addProtoFromList: function() {
      var name = this.ui.protoList.find(':selected').text();
      var objectType = parseInt(this.ui.protoList.val());

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
