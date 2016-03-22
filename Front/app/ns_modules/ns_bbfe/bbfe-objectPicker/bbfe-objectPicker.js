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
      this.options = options;
      key = key.split('FK_')[1];

      this.validators = options.schema.validators || [];
      
      //todo : refact
      this.ojectName = key.charAt(0).toLowerCase() + key.slice(1) + 's';
      this.url = config.coreUrl + this.ojectName + '/';

      this.model = new Backbone.Model();

      this.pickerTitle = options.schema.title;
      this.model.set('pickerTitle', this.pickerTitle);
      this.model.set('key', options.key);
      this.model.set('type', 'text');

      var value;
      if (options) {
        if (options.model) {
          value = options.model.get(options.schema.name);
        }else {
          value = options.value;
        }

      if (options.schema.options && options.schema.options.usedLabel){
        this.usedLabel = options.schema.options.usedLabel;
        this.displayingValue = true;
        this.initValue = value;
        this.validators.push({ type: 'Thesaurus', parent: this});
        this.initAutocomplete();
      } else {
        this.usedLabel = 'ID';
        this.noAutocomp = true;
        this.model.set('type', 'number');
      }
      this.isTermError = false;

        if (value) {

          this.model.set('value', value);
          if (this.displayingValue) {
            this.model.set('value', '');
            this.matchedValue = value;
            //this.model.set('initValue', initValue);
          }
          this.model.set('data_value', value);

        }else {
          this.model.set('value', '');
          this.model.set('data_value', '');

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

    initAutocomplete: function() {
      var _this = this;
      this.autocompleteSource = {};
      this.autocompleteSource.source = config.coreUrl +'autocomplete/'+ this.ojectName + '/'+this.usedLabel+'/ID';
      this.autocompleteSource.minLength = 3;
      this.autocompleteSource.select = function(event,ui){
        event.preventDefault();
        $(_this._input).attr('data_value',ui.item.value).change();
        $(_this._input).val(ui.item.label);
        _this.isTermError = false;
        _this.displayErrorMsg(false);
      };
      this.autocompleteSource.focus = function(event,ui){
        event.preventDefault();
      };

      this.autocompleteSource.change = function(event,ui){
        event.preventDefault();
        if (ui.item) {
          _this.setValue(ui.item.value,ui.item.label);
/*          $(_this._input).attr('data_value',ui.item.value).change();
          $(_this._input).val(ui.item.label);*/
          _this.isTermError = false;
          _this.displayErrorMsg(false);

        } else {
          if ($(_this._input).val() != '' || !_this.matchedValue){
            console.log($(_this._input).val());
            _this.isTermError = true;
            _this.displayErrorMsg(true);
          } else {
            _this.setValue('','');
          }
          //$(_this._input).attr('data_value',_this.$el.find('#' + _this.id ).val()).change();

        }
      };

      this.autocompleteSource.response = function(event,ui){
        event.preventDefault();
        if (ui.content.length == 1){
          var item = ui.content[0];
          _this.setValue(item.value,item.label);
          _this.displayErrorMsg(false);
          _this.isTermError = false;
          _this.matchedValue = item;

        } else {
          _this.matchedValue = undefined;
        }
      };

    },

    afterTpl: function() {

      this._input = this.$el.find('input[name="' + this.key + '" ]')[0];
      this.$el.find('#new').addClass('hidden');
      this.getTypes();
      this.displayGrid();
      this.displayFilter();
      this.translater = Translater.getTranslater();
    },

    getDisplayValue: function(val){
      var _this = this;
      $.ajax({
        url : _this.url+val,
        success : function(data){
          _this.setValue(val,data[_this.usedLabel]);
          
        }
      });
    },

    render: function(){
      if (this.displayingValue){
        if (this.initValue && this.initValue != null){
          this.getDisplayValue(this.initValue);
        }
        var _this = this;
        _(function () {
            $(_this._input).autocomplete(_this.autocompleteSource);
            //$(this._input).addClass(_this.options.schema.editorClass) ;
            /*if (_this.options.schema.editorAttrs && _this.options.schema.editorAttrs.disabled) {
                $(this._input).prop('disabled', true);
            }*/
        }).defer();
      }
      return this;
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
      var displayValue = row.model.get(this.usedLabel);
      this.setValue(id,displayValue);
      this.isTermError = false;
      this.displayErrorMsg(false);
    },

    rowDbClicked: function(row) {
      this.rowClicked(row);
    },

    getValue: function() {
      if (this.isTermError) {
        return null ;
      }
      if (this.noAutocomp){
        return $(this._input).val();
      }
      return $(this._input).attr('data_value');
    },

    setValue: function(value,displayValue) {
      $(this._input).val(displayValue).change();;
      $(this._input).attr('data_value',value).change();
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
    },

    displayErrorMsg: function (bool) {
/*      if (this.editable) {
        this.isTermError = bool;*/
        if (this.isTermError) {

          //this.termError = "Invalid term";
          $(this._input).addClass('error');
          //his.$el.find('#errorMsg').removeClass('hidden');
        } else {
          //this.termError = "";
          $(this._input).removeClass('error');
          //this.$el.find('#errorMsg').addClass('hidden');
        }
      //}
    },
  }
  );
});

