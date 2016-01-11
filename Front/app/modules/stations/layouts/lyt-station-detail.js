define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'radio',

  './lyt-protocol',

  'sweetAlert',
  'config',

  'ns_form/NSFormsModuleGit',
  'ns_navbar/ns_navbar',

  './cov-editor',

  'i18n'

], function($, _, Backbone, Marionette, Radio, LytProto,
  Swal, config, NsForm, Navbar, ProtoCompView
) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height white',

    template: 'app/modules/stations/templates/tpl-station-detail.html',

    name: 'Protocol managing',

    regions: {
      'rgStation': '#rgStation',
      'rgProtos': '#rgProtos',
      'rgNavbar': '#navbar'
    },

    ui: {
      protoEditor: '#protoEditor',
      total: '#total',
      formStation: '#stationForm',
      formStationBtns: '#stationFormBtns',
    },

    total: 0,

    initialize: function(options) {
      if (options.stationId) {
        this.stationId = options.stationId;
      }else {
        this.model = options.model;
        this.navbar = new Navbar({
          parent: this,
          globalGrid: options.globalGrid,
          model: options.model,
        });
      }
    },

    onDestroy: function() {
    },

    onShow: function() {
      if (this.stationId) {
        this.displayStation(this.stationId);
        //this.feedProtoList();
      }else {
        this.rgNavbar.show(this.navbar);
        this.display(this.model);
        //this.feedProtoList();
      }
      //this.$el.i18n();
      //this.translater = Translater.getTranslater();
    },

    reloadFromNavbar: function(model) {
      this.display(model);
      Backbone.history.navigate('#stations/' + this.stationId, {trigger: false});
    },

    display: function(model) {
      this.model = model;
      this.stationId = this.model.get('ID');
      this.displayStation(this.stationId);
    },

    displayStation: function(stationId) {
      this.total = 0;
      var stationType = 1;
      var _this = this;
      this.nsForm = new NsForm({
        name: 'StaForm',
        modelurl: config.coreUrl + 'stations',
        formRegion: this.ui.formStation,
        buttonRegion: [this.ui.formStationBtns],
        displayMode: 'display',
        objectType: stationType,
        id: stationId,
        reloadAfterSave: true,
        afterShow : function(){
          $(".datetime").attr('placeholder','DD/MM/YYYY');
          $("#dateTimePicker").on("dp.change", function (e) {
            $('#dateTimePicker').data("DateTimePicker").format('DD/MM/YYYY').maxDate(new Date());
           });
        }
      });
      this.nsForm.afterDelete = function() {
        var jqxhr = $.ajax({
          url: config.coreUrl + 'stations/' + _this.stationId,
          method: 'DELETE',
          contentType: 'application/json'
        }).done(function(resp) {
          Backbone.history.navigate('#stations', {trigger: true});
        }).fail(function(resp) {
        });
      };

      this.nsForm.model.on('change:fieldActivityId', function() {
        _this.displayProtos();
      });
      //then display protocols
      _this.displayProtos();
    },

    displayProtos: function() {
      this.protoCollView = new ProtoCompView({stationId: this.stationId});
      this.protoCollView.render();
      this.ui.protoEditor.html(this.protoCollView.el);
    },


/*
    bindProtosEvts: function() {
      this.listenTo(this.protoCollView.collection, 'destroy', this.onProtoDestroy);
      this.listenTo(this.protoCollView.collection, 'add', this.onProtoAdd);
      this.listenTo(this.protoCollView.collection, 'change', this.onProtoChange);
    },

    onProtoChange: function(mod) {
      this.total = 0;
      for (var i = 0; i < this.protoCollView.collection.models.length; i++) {
        this.total += this.protoCollView.collection.models[i].get('obs').length;
      };
      this.ui.total.html(this.total);
    },

    onProtoDestroy: function() {
    },

    onProtoAdd: function(mod) {
      this.total = 0;
      for (var i = 0; i < this.protoCollView.collection.models.length; i++) {
        this.total += this.protoCollView.collection.models[i].get('obs').length;
      };
      this.ui.total.html(this.total);
    },

    addProtoFromList: function() {
      var name = this.ui.protoList.find(':selected').text();
      var objectType = parseInt(this.ui.protoList.val());

      var md = this.protoCollView.collection.findWhere({'ID': objectType});
      if (md) {
        var cid = md.cid;
        var viewId = this.protoCollView.children._indexByModel[cid];
        var view = this.protoCollView.children._views[viewId];
        view.addObs();
      } else {
        //append a new proto
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
          _this.protoCollView.collection.push(proto);
          _this.updateMenuBar();
        },
        error: function(msg) {
          console.warn('request new proto error');
        }
      });
    },

    updateMenuBar: function() {
      var _this = this;
      var tpl = '';
      this.protoCollView.collection.each(function(model) {
        var name = model.get('Name');
        var total = model.get('total');
        var id = model.get('ID');

        var tmp = '\
          <li class="list-group-item" value="' + id + 'proto">\
            <span>' + name + '</span><span id="total" class="badge pull-right">' + total + '</span>\
            <button value="' + id + 'proto" id="addObs" class="btn btn-sm btn-prevent-collapse btn-success" value=""><span class="reneco reneco-add"></span></button>\
          </li>';

        tpl += tmp;
      });
      _this.ui.protoListContainer.html(tpl);
    },

    displayProto: function(e) {
      var value = $(e.currentTarget).val();
      this.ui.protoFormsContainer.find('div.protocol').each(function() {
        $(this).addClass('hidden');
      });
      this.ui.protoFormsContainer.find('div#' + value + 'proto').removeClass('hidden');
    }*/

  });
});

