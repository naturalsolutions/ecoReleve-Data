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
  'ns_filter/model-filter_module',
  'backbone-forms',
  'requirejs-text!./tpl-bbfe-objectPicker.html',
  'objects/layouts/lyt-objects-new'
], function(
  $, _, Backbone, Marionette, Swal, Translater, config,
  Com, NsGrid, NsFilter, Form, Tpl, LytObjectsNew
) {
  'use strict';
  return Form.editors.ObjectPicker = Form.editors.Base.extend({

    className: '',
    events: {
      'click span.picker': 'showPicker',
      'click #btnFilterPicker': 'filter',
      'click .cancel': 'hidePicker',
      'click button#new': 'onClickNew',
    },

    initialize: function(options) {
      options.schema.editorClass='';
      Form.editors.Text.prototype.initialize.call(this, options);
      this.com = new Com();
      //get the foreign key 2
      this.key = options.key;
      var key = options.key;

      key = key.split('FK_')[1];

      //todo : refact
      this.ojectName = key.charAt(0).toLowerCase() + key.slice(1) + 's';
      this.url = config.coreUrl + this.ojectName + '/';

      this.model = new Backbone.Model();

      this.pickerTitle = options.schema.title;
      this.model.set('pickerTitle', this.pickerTitle);
      this.model.set('key', options.key);

      var value;
      if (options) {
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
      }

      var required;
      if(options.schema.validators){
          required = options.schema.validators[0];
      }else{
        required = '';
      }
      this.model.set('required', required);

      //dirty
      var template =  _.template(Tpl, this.model.attributes);
      this.$el.html(template);

      this.afterTpl();
    },

    afterTpl: function() {
      this._input = this.$el.find('input[name="' + this.key + '"]')[0];
      this.$el.find('#new').addClass('hidden');
      this.getTypes();
      this.displayGrid();
      this.displayFilter();
      this.translater = Translater.getTranslater();
    },

    getTypes: function() {
      $.ajax({
        url: this.url + 'getType',
        method: 'GET',
        contentType: 'application/json',
        context: this,
      }).done(function(data) {
        this.tooltipListData = data;
        this.$el.find('#new').removeClass('hidden');
      }).fail(function(resp) {
        console.error(this.url + 'getType');
      });
    },

    onClickNew: function(e) {
      var _this = this;
      this.$el.find('#new').tooltipList({
        availableOptions: this.tooltipListData,
        liClickEvent: function(value, parent, elem) {
          //var val = $(elem)[0].textContent.replace(/\s/g, '');
          var val = value;
          //todo
          var params = {
            picker: _this,
            type: val,
            ojectName: _this.ojectName
          };
          _this.displayCreateNewLyt(params);
        },
        position: 'top'
      });
    },

    displayCreateNewLyt: function(params) {
      this.lytObjNew = new LytObjectsNew(params);
      var tmp = this.lytObjNew.render();
      this.$el.find('#creation').html(this.lytObjNew.el);
      this.lytObjNew.onShow();
      this.$el.find('#creation').removeClass('hidden');
    },

    displayGrid: function() {
      var _this = this;
      this.grid = new NsGrid({
        pageSize: 20,
        pagingServerSide: true,
        com: this.com,
        url: this.url,
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
      this.filters = new NsFilter({
        url: this.url,
        com: this.com,
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
      this.$el.find('#creation').addClass('hidden');
      this.hidePicker();
    },

    showPicker: function() {
      //this.displayGrid();
      this.filters.update();
      this.$el.find('#modal-outer').fadeIn('fast');
    },

    hidePicker: function() {
      this.$el.find('#modal-outer').fadeOut('fast');
    }
  }
  );
});

