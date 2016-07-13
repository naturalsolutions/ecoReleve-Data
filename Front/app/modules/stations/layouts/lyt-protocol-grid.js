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
      template: 'app/modules/stations/templates/tpl-protocol-grid.html',
      className: 'full-height hidden protocol full-height',

      ui: {
        'total': '#total',
        'obs': '#observations',
        'thead': '.js-thead',
        'tbody': '.js-tbody',

        'editBtn': '.js-btn-form-grid-edit',
        'saveBtn': '.js-btn-form-grid-save',
        'cancelBtn': '.js-btn-form-grid-cancel',
        'clearBtn': '.js-btn-form-grid-clear'
      },

      events: {
        'click .js-btn-form-grid-edit': 'onEditBtnClick',
        'click .js-btn-form-grid-save': 'onSaveBtnClick',
        'click .js-btn-form-grid-cancel': 'onCancelBtnClick',
        'click .js-btn-form-grid-clear': 'onClearBtnClick',
      },

      modelEvents: {
        'change:current': 'changeVisibility',
      },

      index: 0,


      onEditBtnClick: function(){
        for (var i = 0; i < this.forms.length; i++) {
          this.forms[i].butClickEdit();
        }
        this.mode = 'edit';
        this.toogleButtons();
      },

      onSaveBtnClick: function(){
      //dirty
      var _this = this;
      var noErrors = true;
      for (var i = 0; i < this.forms.length; i++) {
        noErrors = this.forms[i].BBForm.commit();
      }

      //???
      setTimeout(function(){
        if(!noErrors) {

          for (var i = 0; i < _this.forms.length; i++) {
            console.log(_this.forms[i].BBForm.getValue());
            _this.forms[i].butClickSave();
          }
          _this.mode = 'display';
          _this.toogleButtons();
        }
      }, 1000);

    },

    onCancelBtnClick: function(){
      for (var i = 0; i < this.forms.length; i++) {
        this.forms[i].butClickCancel();
      }
      this.mode = 'display';
      this.toogleButtons();
    },

    onClearBtnClick: function(){
      for (var i = 0; i < this.forms.length; i++) {
        this.forms[i].butClickClear();
      }
    },

    initialize: function(options) {

      this.model.attributes.obs = new Backbone.Collection(this.model.get('obs'));

      var total = this.model.get('obs').filter(function(md){
        if(md.attributes.data.ID) {
          return true;
        } else {
          return false;
        }
      }).length;

      this.model.set({total: total});

      this.objectType = this.model.get('obs').models[0].attributes.data.FK_ProtocoleType;

      this.stationId = options.stationId;
      this.forms = [];

      this.bindModelEvts();
    },



    createThead: function() {
      this.schema = this.model.get('obs').models[0].get('schema');
      delete this.schema['defaultValues'];

      var size=0;
      for (var key in this.schema) {
       var col = this.schema[key];
         //sucks
         var test = true;
         if(col.fieldClass){
          test = !(col.fieldClass.split(' ')[0] == 'hide'); //FK_protocolType
          col.fieldClass += ' grid-field';
        }





        if(col.title && test) {
          switch(col.size) {
              case 10:
                  size += 250;
                  break;
              case 8:
                  size += 200;
                  break;
              case 6:
                  size += 150;
                  console.log(size);
                  break;
              case 4:
                  size += 100;
                  break;
              case 3:
                  size += 75;
                  break;
              case 2:
                  size += 50;
                  break;
              default:
                  size += 150;
          }

          this.ui.thead.prepend('<div title="' + col.title + '" class="'+ col.fieldClass +'"> | ' + col.title + '</div>');
          size++;
        }
      }
      //size = size*150;
      size += 36; //trash button

      this.ui.thead.width(size);
      this.ui.tbody.width(size);
    },

    createTbody: function() {
      var obs = this.model.get('obs');

      if (obs.models[0].attributes.data.id) {
        this.mode = 'display';
        for (var i = 0; i < obs.models.length; i++) {
            // if(i >= this.nbByDefault) {
            //     this.defaultRequired = false;
            // }
            this.addForm(obs.models[i]);
          }
              // if (data.length < this.nbByDefault) {
              //     for (var i = 0; i < data.length; i++) {
              //         this.addForm(model);
              //     }
              // }
              // this.defaultRequired = false;
            } else {
              this.mode = 'edit';
              this.addForm(obs.models[0]);
          //no obs
          // if (this.nbByDefault >= 1) {
          //     for (var i = 0; i < this.nbByDefault; i++) {
          //         this.addForm(model);
          //     }
          //     this.defaultRequired = false;
          // }
        }

        this.toogleButtons();
      },

      toogleButtons: function() {
        var name = this.name;
        if(this.mode == 'display'){
          this.ui.editBtn.removeClass('hidden');

          this.ui.saveBtn.addClass('hidden');
          this.ui.cancelBtn.addClass('hidden');
          this.ui.clearBtn.addClass('hidden');

          this.$el.find('input:enabled:first').focus();
        }else{
          this.ui.editBtn.addClass('hidden');

          this.ui.saveBtn.removeClass('hidden');
          this.ui.cancelBtn.removeClass('hidden');
          this.ui.clearBtn.removeClass('hidden');
        }
      },

      addForm: function(model){
        var _this = this;

        //model is unformated yet

        model.schema = model.get('schema');
        model.fieldsets = model.get('fieldsets');
        model.attributes = model.get('data');
        model.urlRoot =  config.coreUrl + 'stations/' + this.stationId + '/protocols' + '/'

        this.ui.tbody.append('<div class="js-form-row js-form-row-' + this.index +' form-row"></div>');
        var formRowContainer = this.ui.tbody.find('.js-form-row-' + this.index);
        this.index++;


        var form = new NsForm({
          formRegion: formRowContainer,
          model: model,
          gridRow: true,
          reloadAfterSave: true,
          modelurl: config.coreUrl + 'stations/' + this.stationId + '/protocols'
        });

        form.afterDelete = function() {
          if (_this.model.get('id') == 0) {
            _this.deleteObs();
          } else {
            var jqxhr = $.ajax({
              url: this.model.urlRoot + '/' + this.model.get('id'),
              method: 'DELETE',
              contentType: 'application/json',
              context: this
            }).done(function(resp) {
              _this.deleteObs(this);
            }).fail(function(resp) {
              console.error(resp);
            });
          }
        };
        this.forms.push(form);
      },

      deleteObs: function(form) {
        this.ui.tbody.find($(form.BBForm.el).parent()).remove();

        this.forms = _.reject(this.forms, function(f) {
          return f === form;
        });

        form.model.destroy();
        if(!this.model.get('obs')) {
          this.model.destroy();
        }
      },

      onRender: function() {
        this.createThead();
        this.createTbody();
      },

      addObs: function(e) {
        var _this = this;

        if(this.mode == 'display') {
          return;
        }

        var emptyFormIndex = 0;
      //check if there is already an empty form
      var existingEmptyForm = this.model.get('obs').filter(function(model, i){
        if(model.get('id')) {
          return false;
        } else {
          emptyFormIndex=i;
          return true;
        }
      });
      if(existingEmptyForm.length) {
        //?
      } else {
        this.name = '_' + this.objectType + '_';
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
            var patern = new Backbone.Model(resp);
            _this.model.get('obs').push(patern);
            _this.addForm(patern);
          },
          error: function(msg) {
            console.warn('request error');
          }
        });
      }
    },



    bindModelEvts: function() {
      this.listenTo(this.model.get('obs'), 'destroy', this.update);
      this.listenTo(this.model.get('obs'), 'add', this.update);
      this.listenTo(this.model.get('obs'), 'change', this.update);
    },

    onDestroy: function() {

    },

    changeVisibility: function() {
      if (this.model.get('current')) {
        this.$el.removeClass('hidden');
      } else {
        this.$el.addClass('hidden');
      }
    },

    update: function() {
      var total = this.model.get('obs').length;

      total = this.model.get('obs').filter(function(model){
        if(model.get('id'))
          return model;
      }).length;

      this.model.set({'total': total});
      this.ui.total.html(total);
    },

  });
});
