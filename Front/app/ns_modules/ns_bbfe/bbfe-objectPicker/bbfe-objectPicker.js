define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',

  'modules/monitoredSites/monitored_sites.view',
  'modules/monitoredSites/monitored_sites.new.view',

  'backbone-forms',
  'requirejs-text!./tpl-bbfe-objectPicker.html',
], function(
  $, _, Backbone, Marionette, Swal, Translater, 
  MonitoredSitesView, NewView,
  Form, Tpl
) {
  'use strict';
  return Form.editors.ObjectPicker = Form.editors.Base.extend({

    className: '',
    events: {
      'click span.picker': 'showPicker',
    },

    initialize: function(options) {
      options.schema.editorClass='';
      Form.editors.Text.prototype.initialize.call(this, options);
      this.validators = options.schema.validators || [];

      this.model = new Backbone.Model();

      this.model.set('key', options.key);
      this.model.set('type', 'text');
      
      var name = options.key.split('FK_')[1];
      this.objectName = name.charAt(0).toLowerCase() + name.slice(1) + 's';
      this.url = this.objectName + '/';

      var dictCSS = {
        'individuals':'reneco reneco-bustard',
        'sensors': 'reneco reneco-emitters',
        'monitoredSites': 'reneco reneco-site',
      };
      this.model.set('icon',dictCSS[this.objectName]);



      if (options.schema.options && options.schema.options.usedLabel){
        this.usedLabel = options.schema.options.usedLabel;
        this.displayingValue = true;
        this.initValue = value;
        this.validators.push({ type: 'Thesaurus', parent: this}); //?
        this.initAutocomplete();
      } else {
        this.usedLabel = 'ID';
        this.noAutocomp = true;
        this.model.set('type', 'number');
      }
      this.isTermError = false;

      var value;
      if (options) {
        if (options.model) {
          value = options.model.get(options.schema.name);
        }else {
          value = options.value;
        }

        if (value) {
          this.model.set('value', value);
          if (this.displayingValue) {
            this.model.set('value', '');
            this.matchedValue = value;
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

      this.template =  _.template(Tpl, this.model.attributes);
    },

    initAutocomplete: function() {
      var _this = this;
      this.autocompleteSource = {};
      this.autocompleteSource.source ='autocomplete/'+ this.objectName + '/'+this.usedLabel+'/ID';
      this.autocompleteSource.minLength = 3;
      this.autocompleteSource.select = function(event,ui){
        event.preventDefault();
        $(_this._input).attr('data_value',ui.item.value);
        $(_this._input).val(ui.item.label);

        _this.matchedValue = ui.item;
        _this.isTermError = false;
        _this.displayErrorMsg(false);
      };
      this.autocompleteSource.focus = function(event,ui){
        event.preventDefault();
      };

      this.autocompleteSource.change = function(event,ui){
        event.preventDefault();
          if ($(_this._input).val() != '' && !_this.matchedValue){
            _this.isTermError = true;
            _this.displayErrorMsg(true);
          }
          else {
            if ($(_this._input).val() == ''){
              $(_this._input).attr('data_value','');
            }
            _this.isTermError = false;
            _this.displayErrorMsg(false);
          }
          $(_this._input).change();
      };

      this.autocompleteSource.response = function(event,ui){
        event.preventDefault();
        if (ui.content.length == 1){
          var item = ui.content[0];
          _this.setValue(item.value,item.label);
          _this.matchedValue = item;

        } else {
          _this.matchedValue = undefined;
        }
      };
    },

    getDisplayValue: function(val){
      var _this = this;
      $.ajax({
        url : _this.url+val,
        success : function(data){
          $(_this._input).attr('data_value',val);
          $(_this._input).val(data[_this.usedLabel]);
          //_this.setValue(val,data[_this.usedLabel]);
          _this.displayErrorMsg(false);
          _this.isTermError = false;
        }
      });
    },

    render: function(){
      var _this = this;
      this.$el.html(this.template);
      
      this._input = this.$el.find('input[name="' + this.model.get('key') + '" ]')[0];
      if (this.displayingValue){
        if (this.initValue && this.initValue != null){
          this.getDisplayValue(this.initValue);
        }
        _(function () {
            $(_this._input).autocomplete(_this.autocompleteSource);
        }).defer();
      }
      
      this.initPicker();

      return this;
    },

    showPicker: function(){
      this.regionManager.get('modal').show(this.pickerView = new this.PickerView());
      $('#modal').css('display', 'block');
    },

    initPicker: function(){
      var _this = this;

      this.regionManager = new Marionette.RegionManager();
      this.regionManager.addRegions({
        modal: "#modal",
      });

      var NewView = window.app.entityConfs[this.objectName].newEntity;
      this.NewView = NewView.extend({
        back: function(e){
          e.preventDefault();
          _this.showPicker();
        },
        afterSaveSuccess: function(response){
          var id = response.ID
          var displayValue = this.model.get(_this.usedLabel);

          _this.setValue(id,displayValue);
          _this.isTermError = false;
          _this.displayErrorMsg(false);
          _this.hidePicker();
        },
      });

      var PickerView = window.app.entityConfs[this.objectName].entities;
      this.PickerView = PickerView.extend({
        onRowClicked: function(row){
          var id = row.data.ID;
          var displayValue = row.data[_this.usedLabel];
          _this.setValue(id,displayValue);
          _this.isTermError = false;
          _this.displayErrorMsg(false);
          _this.hidePicker();
        },
        back: function(e){
          e.preventDefault();
          _this.hidePicker();
        },
        new: function(e){
          e.preventDefault();

          if(this.model.get('availableOptions')){
            this.ui.btnNew.tooltipList({
              availableOptions: this.model.get('availableOptions'),
              liClickEvent: function(liClickValue) {
                _this.regionManager.get('modal').show(new _this.NewView({objectType: liClickValue}));
              },
              position: 'top'
            });
          } else {
            _this.regionManager.get('modal').show(new _this.NewView());
          }
        },
      });

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
      if (displayValue || displayValue == ''){
        $(this._input).val(displayValue);
      } else {
        this.getDisplayValue(value);
      }
      $(this._input).attr('data_value',value);
      this.matchedValue = value;
      $(this._input).change();
      this.hidePicker();
    },

    hidePicker: function() {
      $('#modal').css('display', 'none');
      this.regionManager.get('modal').empty();
    },

    displayErrorMsg: function (bool) {
        if (this.isTermError) {
          $(this._input).addClass('error');
        } else {
          $(this._input).removeClass('error');
        }
    },
  }
  );
});

