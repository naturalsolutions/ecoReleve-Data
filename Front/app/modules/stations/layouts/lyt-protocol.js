define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'./lyt-observation',
	'config',
	'ns_form/NSFormsModuleGit',
	'bootstrap',
	'i18n'

], function($, _, Backbone, Marionette, Radio, LytObs, config, NsForm, bootstrap
) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/templates/tpl-protocol.html',
    className: 'panel panel-default',

    ui: {
      'pagination': '#pagination',
      'total': '#total',
      'obs': '#observations',
      'pannelAction': '#pannelAction'
    },

    events: {
      'click #pagination li.page': 'toObs',
      'click #pagination li#prevObs': 'prevObs',
      'click #pagination li#nextObs': 'nextObs',
      'click #addObs': 'addObs'

      
    },

    index: 0,

    initialize: function(options) {

      //should be replace by the proto.default obs schema
      /*
      			var obsModel = Backbone.Model.extend({
      			});
      			var ObsColl = Backbone.Collection.extend({
      				model: obsModel,
      			});*/

      //this.model.attributes.total = this.model.get('obs').length;
      this.show = this.model.get('show');

      this.model.attributes.obs = new Backbone.Collection(this.model.get('obs'));
      this.model.set({total: this.model.get('obs').length});
      this.objectType = this.model.get('obs').models[0].attributes.data.FK_ProtocoleType;

      this.stationId = options.stationId;
      this.initObs(options.stationId);
      this.bindModelEvts();
    },

    initObs: function() {
      var ObsCollView = Backbone.Marionette.CollectionView.extend({
        childView: LytObs,
        childViewOptions: {
          stationId: this.stationId,
        }
      });
      this.obsCollView = new ObsCollView({collection: this.model.get('obs')});
      this.obsCollView.render();
    },

    bindModelEvts: function() {
      this.listenTo(this.model.get('obs'), 'destroy', this.onObsDestroy);
      this.listenTo(this.model.get('obs'), 'add', this.onObsAdd);
      this.listenTo(this.model.get('obs'), 'change', this.onObsChange);
    },

    onRender: function() {
      this.ui.obs.html(this.obsCollView.el);
      this.paginateObs();
      //display the first obs
      this.displayObs(0);
      if (this.show) {
        this.uncollapse();
      }
    },

    addObs: function(e) {
      //shouldn't be an ajax call
      var _this = this;
      this.name = '_' + this.objectType + '_';

      var patern = new Backbone.Model();

      this.jqxhr = $.ajax({
        url: config.coreUrl + 'stations/' + this.stationId + '/protocols/0',
        context: this,
        type: 'GET',
        data: {
          FormName: this.name,
          ObjectType: this.objectType,
          DisplayMode: 'edit'
        },
        dataType: 'json',
        success: function(resp) {
          patern.urlRoot = config.coreUrl + 'stations/' + _this.options.stationId + '/protocols';
          patern.attributes.data = resp.data;
          patern.attributes.fieldsets = resp.fieldsets;
          patern.attributes.schema = resp.schema;

          _this.model.get('obs').push(patern);

        },
        error: function(msg) {
          console.warn('request error');
        }
      });
    },

    //could be better
    paginateObs: function() {
      this.ui.pagination.html('');
      if (this.model.get('obs').length != 1) {
        this.ui.pagination.append('<li id="prevObs"><button class="btn btn-default prev"><span class="reneco reneco-leftarrow"></span></button></li>');
        for (var i = 0; i < this.model.get('obs').length; i++) {
          var state = this.model.get('obs').models[i].get('state');
          this.ui.pagination.append('<li class="page"><button class="btn btn-default ' + state + '">' + (i + 1) + '</button></li>');
        }
        this.ui.pagination.append('<li id="nextObs"><button class="btn btn-default next"><span class="reneco reneco-rightarrow"></span></button></li>');
      }
    },

    displayObs: function(index) {
      //display the obs at the good position
      this.ui.obs.find('div.obs').each(function(i) {
        if (i == index) {
          $(this).removeClass('hidden');
        }else {
          $(this).addClass('hidden');
        }
      });

      //update the current page class
      this.ui.pagination.find('li.page').each(function(i) {
        if (i == index) {
          $(this).addClass('current');
        }else {
          $(this).removeClass('current');
        }
      });
    },

    toObs: function(e) {
      this.index = this.ui.pagination.find('li.page').index($(e.target.parentElement));
      this.displayObs(this.index);
    },

    prevObs: function() {
      if (this.index != 0) {
        this.index--;
        this.displayObs(this.index);
      }
    },

    nextObs: function() {
      if (this.index < (this.model.get('obs').length - 1)) {
        this.index++;
        this.displayObs(this.index);
      }
    },

    /*----------  events binding ----------*/
    onObsAdd: function(mod) {
      this.update();
      //find the index of the model in the collection
      this.index = this.model.get('obs').indexOf(mod);

      //display the new mod/view
      this.displayObs(this.index);
      this.uncollapse();
    },

    onObsDestroy: function(mod) {
      if (this.model.get('obs').length == 0) {
        //up total b4 destroy
        this.model.set({'total': total});
        this.model.destroy();
      }else {
        this.update();
        this.index = 0;
        this.displayObs(this.index);
      }
    },

    onObsChange: function(mod) {
      this.index = this.model.get('obs').indexOf(mod);
      this.update();
      this.displayObs(this.index);
    },

    update: function() {
      var total = this.model.get('obs').length;
      this.model.set({'total': total});
      this.ui.total.html(total);
      this.paginateObs();
    },

    uncollapse: function() {
      this.$el.find('.panel-collapse').collapse('show');
    },

  });
});
			//check if it's the last one
