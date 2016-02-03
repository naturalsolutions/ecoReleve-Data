define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'config',
  'ns_modules/ns_com',
  'ns_grid/model-grid',
  'ns_filter_bower',
  'backbone-forms',
  'requirejs-text!./tpl-bbfe-nonIdPicker.html',
  'objects/layouts/lyt-objects-new'
], function(
  $, _, Backbone, Marionette, Swal, Translater, config,
  Com, NsGrid, NsFilter, Form, Tpl, LytObjectsNew
) {
  'use strict';
  return Form.editors.NonIdPicker = Form.editors.Base.extend({

    className: '',
    events: {
      'click span.picker': 'showPicker',
      'click #btnFilterPicker': 'filter',
      'click .cancel': 'hidePicker',
      'click button#saveFromCriterias': 'saveFromCriteras',
      'click button#createNew': 'createNew',
      'click #indivTypeTabs a.tab-link' : 'indivTypeTabs',
    },

    initialize: function(options) {
      options.schema.editorClass = '';
      Form.editors.Text.prototype.initialize.call(this, options);
      this.com = new Com();
      this.model = new Backbone.Model();

      var schemaOps = options.schema.options;
      this.firstShow = true;
      this.url = config.coreUrl + schemaOps.url + '/';

      this.typeObj = 1;

      this.model.set('key', options.key);

      this.model.set('title', schemaOps.title);

      var value;
      if (options.model) {
        value = options.model.get(options.schema.name);
      }else {
        value = options.value;
      }

      if (value) {
        this.model.set('value', value);
      }else {
        this.model.set('value', '');
      }

      if (options.schema.editable) {
        this.model.set('disabled', '');
        this.model.set('visu', '');
      }else {
        this.model.set('disabled', 'disabled');
        this.model.set('visu', 'hidden');
      }

      if (options.schema.validators) {
        this.model.set('required', options.schema.validators[0]);
      } else {
        this.model.set('required', '');
      }

      var template =  _.template(Tpl, this.model.attributes);
      this.$el.html(template);

      this.afterTpl();
    },

    afterTpl: function() {
      this._input = this.$el.find('input[name="' + this.key + '"]')[0];
      this._modal = this.$el.find('#modalPicker');
      this._creationContainer = this.$el.find('div#creationContainer');
      this._btnNew = this.$el.find('button#createNew');
      this._btnSaveFromCriterias = this.$el.find('button#saveFromCriterias');
      this._indivTypeTabs = this.$el.find('ul#indivTypeTabs');

      this.translater = Translater.getTranslater();
    },

    showPicker: function() {
      if (this.firstShow) {
        this.displayGrid();
        this.displayFilter();
        this.firstShow = false;
      }
      this._modal.fadeIn('fast');
    },

    displayGrid: function() {
      var _this = this;
      this.grid = new NsGrid({
        pageSize: 20,
        pagingServerSide: true,
        com: this.com,
        url: this.url,
        typeObj: this.typeObj,
        rowClicked: true,
      });

      this.grid.rowClicked = function(args) {
        _this.rowClicked(args.row);
      };
      this.grid.rowDbClicked = function(args) {
        _this.rowDbClicked(args.row);
      };

      var gridCont = this.$el.find('#grid')[0];
      $(gridCont).html(this.grid.displayGrid());
      var paginatorCont = this.$el.find('#paginator')[0];
      $(paginatorCont).html(this.grid.displayPaginator());
    },

    displayFilter: function() {
      this.$el.find('#filter').html('');

      this.filters = new NsFilter({
        url: this.url,
        com: this.com,
        typeObj: this.typeObj,
        filterContainer: this.$el.find('#filter'),
      });
    },

    filter: function(e) {
      e.preventDefault();
      this.filters.update();
    },

    rowClicked: function(row) {
      var id = row.model.get('ID');
      this.setValue(id);
    },

    rowDbClicked: function(row) {
      this.rowClicked(row);
    },

    getValue: function() {
      return $(this._input).val();
    },

    setValue: function(value) {
      $(this._input).val(value).change();
      this._creationContainer.addClass('hidden');
      this.hidePicker();
    },

    hidePicker: function() {
      this._modal.fadeOut('fast');
    },

    saveFromCriteras: function(e) {
      this.filters.update();
      var data = {};
      for (var i = 0; i < this.filters.criterias.length; i++) {
        data[this.filters.criterias[i]['Column']] = this.filters.criterias[i]['Value'];
      };



      var params = {
        picker: this,
        type: 2,
        ojectName: 'individuals',
        data: data
      };
      this.displayCreateNewLyt(params);
    },


    createNew: function(e) {
      var params = {
        picker: this,
        type: 1,
        ojectName: 'individuals',
      };
      this.displayCreateNewLyt(params);
    },

    displayCreateNewLyt: function(params) {
      this.lytObjNew = new LytObjectsNew(params);
      var tmp = this.lytObjNew.render();
      this._creationContainer.html(this.lytObjNew.el);
      this.lytObjNew.onShow();
      this._creationContainer.removeClass('hidden');
    },

    indivTypeTabs: function(e) {
      var type = $(e.target).attr('name');
      this._indivTypeTabs.find('.tab-ele').removeClass('activeTab');
      $(e.target).parent().addClass('activeTab');

      if (type == 'standard') {
        this.typeObj = 1;
        this._btnNew.removeClass('hidden');
        this._btnSaveFromCriterias.addClass('hidden');
      } else {
        this.typeObj = 2;
        this._btnNew.addClass('hidden');
        this._btnSaveFromCriterias.removeClass('hidden');
      }

      this.com = new Com();
      this.displayGrid();
      this.displayFilter();
    },
  });
});

