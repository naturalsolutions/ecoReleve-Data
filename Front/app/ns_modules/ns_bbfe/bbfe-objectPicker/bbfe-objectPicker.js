define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'backbone-forms',
  'requirejs-text!./tpl-bbfe-objectPicker.html'
], function (
  $, _, Backbone, Marionette, Swal, Translater,
  Form, Tpl
) {
  'use strict';

  return Form.editors.ObjectPicker = Form.editors.Base.extend({

    className: '',
    events: {
      'click span.picker': 'showPicker',
      'click button#detailsShow': 'openDetails'
    },

    initialize: function (options) {
      this.fromGrid = options.fromGrid;

      options.schema.editorClass = '';
      Form.editors.Text.prototype.initialize.call(this, options);
      this.validators = options.schema.validators || [];
      this.options = options;
      this.model = new Backbone.Model();

      this.model.set('key', options.key);
      this.model.set('type', 'text');

      var name = options.key.split('FK_')[1];
      this.objectName = name.charAt(0).toLowerCase() + name.slice(1) + 's';
      this.url = this.objectName + '/';

      var dictCSS = {
        individuals: 'reneco reneco-bustard',
        sensors: 'reneco reneco-emitters',
        monitoredSites: 'reneco reneco-site'
      };
      this.model.set('icon', dictCSS[this.objectName]);

      var value;
      if (options.model) {
        value = options.model.get(options.schema.name) || options.value;
      }
      if (options.schema.options && options.schema.options.usedLabel) {
        this.usedLabel = options.schema.options.usedLabel;
        this.displayingValue = true;
        this.initValue = value;
        this.validators.push({ type: 'Thesaurus', parent: this }); // ?
        if (options.schema.options.target) {
          this.target = options.schema.options.target;
        }
        this.initAutocomplete();
      } else {
        this.usedLabel = 'ID';
        this.noAutocomp = true;
        this.model.set('type', 'number');
      }
      this.isTermError = false;
      this.options = options.schema.options;

      if (value) {
        this.model.set('value', value);
        if (this.displayingValue) {
          this.model.set('value', '');
          this.matchedValue = value;
        }
        this.model.set('data_value', value);
      } else {
        this.model.set('value', '');
        this.model.set('data_value', '');
      }

      if (options.schema.editable) {
        this.model.set('disabled', '');
        this.model.set('visu', '');
      } else {
        this.model.set('disabled', 'disabled');
        this.model.set('visu', 'hidden');
      }


      var required;
      if (options.schema.validators) {
        required = options.schema.validators[0];
      } else {
        required = '';
      }
      this.model.set('required', required);

      this.template = _.template(Tpl, this.model.attributes);
    },

    initAutocomplete: function () {
      var _this = this;
      this.autocompleteSource = {};
      this.autocompleteSource.source = 'autocomplete/' + this.objectName + '/' + this.usedLabel + '/ID';
      this.autocompleteSource.minLength = 2;
      this.autocompleteSource.select = function (event, ui) {
        event.preventDefault();
        _this.setValue(ui.item.value, ui.item.label);
        _this.matchedValue = ui.item;
        _this.isTermError = false;
        _this.displayErrorMsg(false);
      };
      this.autocompleteSource.focus = function (event, ui) {
        event.preventDefault();
      };

      this.autocompleteSource.change = function (event, ui) {
        event.preventDefault();
        if ($(_this._input).val() !== '' && !_this.matchedValue) {
          _this.isTermError = true;
          _this.displayErrorMsg(true);
        }
        else {
          if ($(_this._input).val() === '') {
            $(_this._input).attr('data_value', '');
          }
          _this.isTermError = false;
          _this.displayErrorMsg(false);
        }
        $(_this._input).change();
      };

      this.autocompleteSource.response = function (event, ui) {
        event.preventDefault();
        if (ui.content.length == 1) {
          var item = ui.content[0];
          _this.setValue(item.value, item.label);
          _this.matchedValue = item;
        } else {
          _this.matchedValue = undefined;
        }
      };
    },

    fetchDisplayValue: function (val) {
      var _this = this;
      $.ajax({
        url: _this.url + val,
        success: function (data) {
          // $(_this._input).attr('data_value',val);
          // $(_this._input).val(data[_this.usedLabel]);
          _this.setValue(val, data[_this.usedLabel]);
          _this.displayErrorMsg(false);
          _this.isTermError = false;
        }
      });
    },

    getItem: function () {
      if ($(this._input).val() === '') {
        $(this._input).attr('data_value', '');
      }
      return { label: $(this._input).val(), value: $(this._input).attr('data_value') };
    },

    render: function () {
      var _this = this;
      this.$el.html(this.template);
      this.$el.find('input').attr('min', '0');
      // quick (dirty) hack
      if (this.fromGrid) {
        this.$el.find('.form-control').removeClass('form-control').addClass('ag-cell-edit-input');
        this.$el.find('.span').addClass('');
      }

      this._input = this.$el.find('input[name="' + this.model.get('key') + '" ]')[0];
      if (this.displayingValue) {
        if (this.initValue && this.initValue !== null) {
          this.fetchDisplayValue(this.initValue);
        }
        _(function () {
          $(_this._input).autocomplete(_this.autocompleteSource);
        }).defer();
      }

      this.initPicker();

      return this;
    },

    getNewFunc: function (ctx) {
      var _this = this;
      switch (ctx.model.get('type')) {
      case 'individuals':
        var data;
        if (ctx.model.get('objectTypeLabel').toLowerCase() !== 'standard') {
          ctx.com.components = [];
          ctx.filters.update();
          data = {};
          for (var i = 0; i < ctx.filters.criterias.length; i++) {
            data[ctx.filters.criterias[i].Column] = ctx.filters.criterias[i].Value;
          }
        } else {
          data = {};
          if (_this.form.model.get('FK_Station')) {
            data.stationID = _this.form.model.get('FK_Station');
          }
        }
        _this.regionManager.get('modal').show(new _this.NewView({
          objectType: ctx.model.get('objectType') || 1,
          data: data
        }));
        break;

      case 'monitoredSites':
        _this.regionManager.get('modal').show(new _this.NewView({
          objectType: ctx.model.get('objectType')
        }));
        break;

      case 'sensors':
        ctx.ui.btnNew.tooltipList({
          position: 'top',
          availableOptions: ctx.availableTypeObj,
          liClickEvent: function (liClickValue) {
            _this.regionManager.get('modal').show(new _this.NewView({
              objectType: liClickValue
            }));
          }
        });
        break;
      }
    },

    showPicker: function () {
      this.regionManager.get('modal').show(this.pickerView = new this.PickerView());
      $('#modal').fadeIn('fast');
      $('#modal').on('click', $.proxy(this.checkHidePicker, this));
    },

    initPicker: function () {
      var _this = this;

      this.regionManager = new Marionette.RegionManager();
      this.regionManager.addRegions({
        modal: '#modal'
      });

      var NewView = window.app.entityConfs[this.objectName].newEntity;
      this.NewView = NewView.extend({
        back: function (e) {
          e.preventDefault();
          _this.showPicker();
        },
        afterSaveSuccess: function (response) {
          var id = response.ID;
          var displayValue = this.model.get(_this.usedLabel);

          _this.setValue(id, displayValue);
          _this.isTermError = false;
          _this.displayErrorMsg(false);
          _this.hidePicker();
        }
      });

      var PickerView = window.app.entityConfs[this.objectName].entities;
      this.PickerView = PickerView.extend({
        onRowClicked: function (row) {
          var id = row.data.ID;
          var displayValue = row.data[_this.usedLabel];
          _this.setValue(id, displayValue);
          _this.isTermError = false;
          _this.displayErrorMsg(false);
          _this.hidePicker();
        },

        setDefaultOperatorFilter: function () {
          if (this.model.get('objectType') == 2) {
            this.firstOperator = 'is null';
          } else {
            this.firstOperator = null;
          }
        },

        back: function (e) {
          e.preventDefault();
          _this.hidePicker();
          this.model.set('objectType', 1);
        },

        afterShow: function () {
          PickerView.prototype.afterShow.call(this);
          if (_this.options && _this.options.withToggle) {
            this.$el.find('.js-nav-tabs').removeClass('hide');
          }
        },
        new: function (e) {
          e.preventDefault();
          _this.getNewFunc(this);
        }
      });
    },

    getValue: function () {
      if (this.isTermError) {
        return null;
      }
      if (this.noAutocomp) {
        return $(this._input).val();
      }
      return $(this._input).attr('data_value');
    },

    getDisplayValue: function () {
      if (this.isTermError) {
        return null;
      }
      return $(this._input).val();
    },

    setValue: function (value, displayValue) {
      if (displayValue || displayValue === '') {
        $(this._input).val(displayValue);
      } else {
        this.fetchDisplayValue(value);
      }
      if (this.target) {
        this.model.set(this.target, value);
      }
      $(this._input).attr('data_value', value);
      this.matchedValue = value;
      $(this._input).change();
      this.hidePicker();
    },

    checkHidePicker: function (e) {
      if ($(e.target).attr('id') === 'modal') {
        this.hidePicker();
      }
    },

    hidePicker: function () {
      var _this = this;
      $('#modal').off('click', this.checkHidePicker);
      $('#modal').fadeOut('fast');
    },

    displayErrorMsg: function (bool) {
      if (this.isTermError) {
        $(this._input).addClass('error');
      } else {
        $(this._input).removeClass('error');
      }
    },

    openDetails: function (event) {
      var url = 'http://' + window.location.hostname + window.location.pathname + '#' + this.objectName + '/' + $(this._input).attr('data_value');
      var win = window.open(url, '_blank');
      win.focus();
    }

  });
});
