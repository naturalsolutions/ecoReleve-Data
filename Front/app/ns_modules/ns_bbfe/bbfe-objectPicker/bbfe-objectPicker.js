define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'backbone-forms',
  'moment',
  'requirejs-text!./tpl-bbfe-objectPicker.html',
], function(
  $, _, Backbone, Marionette, Swal, Translater,
  Form, moment, Tpl
) {
  'use strict';
  return Form.editors.ObjectPicker = Form.editors.Base.extend({

    className: '',
    events: {
      'click span.picker': 'showPicker',
      'click button#detailsShow': 'openDetails',
      'change': 'onChange'
    },

    initialize: function(options) {
      options.schema.editorClass='';
      Form.editors.Text.prototype.initialize.call(this, options);
      this.validators = options.schema.validators || [];

      this.formGrid = options.formGrid;
      this.options = options;
      this.valueToDisplay = options.valueToDisplay;

      this.model = new Backbone.Model();

      this.model.set('key', options.key);
      this.model.set('type', 'text');

      var name = options.key.split('FK_')[1];
      this.objectName = name.charAt(0).toLowerCase() + name.slice(1) + 's';
      this.url = this.objectName + '/';

      var dictCSS = {
        'individuals':'reneco reneco-bustard',
        'sensors': 'reneco reneco-ECOL-emitters',
        'monitoredSites': 'reneco reneco-site',
      };
      this.model.set('icon',dictCSS[this.objectName]);


      var value;
      if (options.model) {
        value = options.model.get(options.key) || options.value;
        //individuals
        if(!(options.model.get(options.key) instanceof Object)){
          var values = {
            value: value,
            displayValue: value
          }
          options.model.set(options.key, values);
          value = values;
        }
      }

      this.usedLabel = options.key;
      if (options.schema.options && options.schema.options.usedLabel){
        this.usedLabel = options.schema.options.usedLabel;
        this.displayingValue = true;
        this.initValue = value;
        this.validators.push({ type: 'Thesaurus', parent: this}); //?
        if (options.schema.options.target){
          this.target = options.schema.options.target;
        }
        this.initAutocomplete();
      } else {
        //individuals
        this.usedLabel = 'ID';
        this.noAutocomp = true;
        this.model.set('type', 'number');
      }

      this.isTermError = false;
      this.options = options.schema.options;

      if (value) {
        this.model.set('value', value.value);
        if (this.displayingValue) {
          this.model.set('value', '');
          this.matchedValue = value.displayValue;
        }
        this.model.set('data_value', value.value);
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
      this.autocompleteSource.source = 'autocomplete/' + this.objectName + '/' + this.usedLabel + '/ID';
      this.autocompleteSource.minLength = 2;
      this.autocompleteSource.select = function(event,ui){
        event.preventDefault();
        _this.setValue(ui.item.value,ui.item.label,true);
        _this.matchedValue = ui.item;
        _this.isTermError = false;
        _this.displayErrorMsg(false);
      };
      this.autocompleteSource.focus = function(event,ui){
        event.preventDefault();
      };

      this.autocompleteSource.change = function(event,ui){
        event.preventDefault();
          if (_this.$input.val() !== '' && !_this.matchedValue){
            _this.isTermError = true;
            _this.displayErrorMsg(true);
          }
          else {
            if (_this.$input.val() === ''){
              _this.$input.attr('data_value','');
            }
            _this.isTermError = false;
            _this.displayErrorMsg(false);
          }
          _this.$input.change();
      };

      this.autocompleteSource.response = function(event,ui){
        event.preventDefault();
        if (ui.content.length == 1){
          var item = ui.content[0];
          _this.setValue(item.value,item.label,false);
          _this.matchedValue = item;
          _this.isTermError = false;

        } else {
          var val = _this.$input.val();
          var valueFound = ui.content.find(function(item){
            return val == item.label;
          });
          if (valueFound){
            _this.setValue(valueFound.value,valueFound.label,false);
            _this.matchedValue = valueFound;
            _this.isTermError = false;
          } else {
            _this.matchedValue = undefined;
          }
        }
      };
    },

    fetchDisplayValue: function(val){
      var _this = this;
      if (val instanceof Object && val.displayValue){
        val = val.displayValue;
      }
      $.ajax({
        url : _this.url+val,
        success : function(data){
          // _this.$input.attr('data_value',val);
          // _this.$input.val(data[_this.usedLabel]);
          _this.setValue(val,data[_this.usedLabel],false);
          _this.displayErrorMsg(false);
          _this.isTermError = false;
        }
      });
    },

    getItem : function(){
      if (this.$input.val() === ''){
        this.$input.attr('data_value','');
      }
      return {label: this.$input.val(), value: this.$input.attr('data_value')};
    },

    render: function(){
      var _this = this;
      this.$el.html(this.template);

      this.$el.find('input').attr('min','0');

      /*if(this.valueToDisplay){
        this.$el.find('input').attr('value', this.valueToDisplay);
      }*/

      this.$input= this.$el.find('input[name="' + this.model.get('key') + '" ]');
      if (this.displayingValue){
        if (this.initValue && this.initValue !== null){
          //this.fetchDisplayValue(this.initValue);
        }
        this.$input.val(this.matchedValue);
        _(function () {
            _this.$input.autocomplete(_this.autocompleteSource);
        }).defer();
      }

      this.initPicker();
      this.$input.on('keypressed', function(e){
        _this.input.change()
      });
      this.listenForm();
      return this;
    },

    loadData: function(){
      var data = {};
      switch (this.objectName){
        case 'individuals':
          break;
        case 'monitoredSites':
          var model = this.form.getValue();

          data['LAT'] = model.LAT;
          data['LON'] = model.LON;
          data['Name'] = model.Name;
          data['ELE'] = model.ELE;
          data['Precision'] = model.precision;
          data['StartDate'] = model.StationDate;
          data['Place'] = model.Place
          data['FK_Region'] = model.FK_Region
          break;
        case 'sensors':
          break;
      }
      return data;
    },

    listenForm: function(){
      var _this = this;
      switch (this.objectName){
          case 'individuals':
            break;
          case 'monitoredSites':
            if (this.form.fields.StationDate){
              this.form.fields.StationDate.editor.on('change',function(e, v){
                _this.onChange();
              });
            }
            break;
          case 'sensors':
            break;
      }
    },

    onChange: function(){
      var _this = this;
      switch (this.objectName){
          case 'individuals':
            break;
          case 'monitoredSites':
            var id_ = this.getValue();
            if(!id_){
              return;
            }
            var data = this.loadData();

            $.ajax({
              context: this,
              url: 'monitoredSites/'+id_+'/history',
            }).done(function(positions) {
              var positions = positions[1];
              var minPosition = positions.reduce(function(min, next){
                var minDate = new moment(min.StartDate, 'DD/MM/YYYY HH:mm:ss').valueOf();
                var nextDate = new moment(next.StartDate, 'DD/MM/YYYY HH:mm:ss').valueOf();
                return minDate < nextDate ? min : next;
              });
              if(data.StartDate){
                var stationDate = new moment(data.StartDate, 'DD/MM/YYYY HH:mm:ss');
                var minPositionDate = new moment(minPosition.StartDate, 'DD/MM/YYYY HH:mm:ss');
                if (stationDate.valueOf() < minPositionDate.valueOf()){
                  _this.ruleOnchange(minPosition);
                }
              }
              }).fail(function() {
                // console.error('an error occured');
                // _this.histoMonitoredSite.error = true;
              });
            break;
          case 'sensors':
            break;
        }
    },

    ruleOnchange: function(data){
      var _this = this;
      switch (this.objectName){
        case 'individuals':
          break;
        case 'monitoredSites':
          Swal({
             title: 'Careful, there is no coordinate for this monitored site at this date',
             text: 'The creationdate of this monitored site\'s coordinates will be modified. Do you want to proceed?',
             type: 'warning',
             showCancelButton: true,
             confirmButtonColor: 'rgb(147, 14, 14)',
             confirmButtonText: 'OK',
             closeOnConfirm: true,
            },
            function(isConfirm) {
              var stationDate = _this.loadData().StartDate;
              if( isConfirm ) { //update startdate monitored site
                data.StartDate = stationDate;
                $.ajax({
                  context: _this,
                  url: 'monitoredSites/'+_this.getValue(),
                  data: JSON.stringify(data),
                  dataType: "json",
                  type: "PUT",
                  contentType: "application/json; charset=utf-8",
                  success: function (data) {
                      //_this.nsForm.butClickSave();
                  },
                  error: function (data) {
                    console.error('an error occured');
                  }
                });
              }
              else {//remove MonitoredSite's stations
                _this.setValue('','');
              }
            });
          break;
        case 'sensors':
          break;
      }
    },

    getNewFunc: function(ctx) {
      var _this = this;
      var model;
      if( _this.form) {
        model =  _this.form.model;
      }
      else {
        model = new Backbone.Model();
        model.set({"FK_Station":window.location.hash.replace('#stations/' , '').split('?')[0]});
      }

      switch (ctx.model.get('type')){
        case 'individuals':
          var data;
          if(ctx.model.get('objectTypeLabel').toLowerCase() !== 'standard'){
            ctx.com.components = [];
            ctx.filters.update();
            data = {};
            for (var i = 0; i < ctx.filters.criterias.length; i++) {
              if( ctx.filters.criterias[i]['Operator'] == 'Is') {
                data[ctx.filters.criterias[i]['Column']] = ctx.filters.criterias[i]['Value'] === 'null' ? '': ctx.filters.criterias[i]['Value'];
              }
              else {
                data[ctx.filters.criterias[i]['Column']] = ''
              }
            }
          } else {
            data = {};
            if (model.get('FK_Station')) {
              data['stationID'] = model.get('FK_Station');
            }
          }
          _this.regionManager.get('modal').show(new _this.NewView({
            objectType: ctx.model.get('objectType') || 1,
            data: data
          }));
          break;

        case 'monitoredSites':
          data =  _this.loadData();

          _this.regionManager.get('modal').show(new _this.NewView({
            objectType: ctx.model.get('objectType'),
            data: data,
          }));
          break;

        case 'sensors':
         var _ctx = ctx; 
          var ulElem = document.createElement("ul");
          var tabLength = ctx.availableTypeObj.length;
          for( var i = 0 ; i < tabLength ; i++ ) {
            var elem = ctx.availableTypeObj[i];
            var liElem = document.createElement('li');
            liElem.onclick = function(e) {
              _ctx.ui.btnNew.tooltipster('close');
              _this.regionManager.get('modal').show(new _this.NewView({
                objectType: this.getAttribute('data-value')
              }));
            };
            liElem.setAttribute('data-value' , elem.val)
            liElem.innerHTML = elem.label;
            ulElem.appendChild(liElem);
          }
          ctx.ui.btnNew.tooltipster({
            theme : 'tooltipList',
            position: 'top',
            interactive : true,
            content: '',
            contentAsHTML : true,
            functionReady: function(instance,helper) {
              var elemRoot = instance.elementTooltip(); //.appendChild(ulElem)
              var elemContent = elemRoot.getElementsByClassName('tooltipster-content');
              $(elemContent).append(ulElem);
              instance.reposition();
            },
            functionAfter : function( instance, helper) {
              instance.destroy();
            }
          });
          ctx.ui.btnNew.tooltipster('open');
          break;
      }
    },

    showPicker: function(){
      this.regionManager.get('modal').show(this.pickerView = new this.PickerView());
      $('#modal').fadeIn('fast');
      $('#modal').on('click', $.proxy(this.checkHidePicker, this));
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
          var id = response.ID;
          var displayValue = this.model.get(_this.usedLabel);

          _this.setValue(id,displayValue, true);
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
          _this.setValue(id, displayValue, true);
          _this.isTermError = false;
          _this.displayErrorMsg(false);
          _this.hidePicker();
        },

        setDefaultOperatorFilter: function(){
          if(this.model.get('objectType') == 2){
            this.firstOperator = 'is null';
          } else {
            this.firstOperator = null;
          }
        },

        back: function(e){
          e.preventDefault();
          _this.hidePicker();
          this.model.set('objectType', 1);
        },

        afterShow: function(){
          PickerView.prototype.afterShow.call(this);
          if(_this.options && _this.options.withToggle){
            this.$el.find('.js-nav-tabs').removeClass('hide');
          }
        },
        new: function(e){
          e.preventDefault();
          _this.getNewFunc(this);
        },
      });
    },

    getValue: function() {
      if (this.isTermError) {
        return null ;
      }
      if (this.noAutocomp){
        return this.$input.val();
      }
      return this.$input.attr('data_value');
    },

    getDisplayValue: function() {
      if (this.isTermError) {
        return null ;
      }
      return this.$input.val();
    },

    setValue: function(value, displayValue, confirmChange) {
      if (displayValue || displayValue === ''){
        this.$input.val(displayValue);
      } else {
        this.fetchDisplayValue(value);
      }
      if (this.target){
        this.model.set(this.target,value);
      }
      this.$input.attr('data_value',value);
      this.matchedValue = value;
      this.hidePicker();

      if(confirmChange){
        this.$input.change();
      }
    },

    checkHidePicker: function(e){
      if($(e.target).attr('id') === 'modal'){
        this.hidePicker();
      }
    },

    hidePicker: function() {
      var _this = this;
      $('#modal').off('click', this.checkHidePicker);
      $('#modal').fadeOut('fast');
      this.$input.focus();
    },

    displayErrorMsg: function (bool) {
        if (this.isTermError) {
          this.$input.addClass('error');
        } else {
          this.$input.removeClass('error');
        }
    },

    openDetails: function(event) {
      var url = 'http://'+window.location.hostname+window.location.pathname+'#'+this.objectName+'/'+ this.$input.attr('data_value');
      var win = window.open(url, '_blank');
      win.focus();
    }

  });
});
