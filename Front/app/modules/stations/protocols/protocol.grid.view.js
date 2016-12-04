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
        'clearBtn': '.js-btn-form-grid-clear',
        'rowNumber': '.js-tbody-row-number'
      },

      events: {
        'click .js-btn-form-grid-edit': 'onEditBtnClick',
        'click .js-btn-form-grid-save': 'onSaveBtnClick',
        'click .js-btn-form-grid-cancel': 'onCancelBtnClick',
        'click .js-btn-form-grid-clear': 'onClearBtnClick',
        'click .js-btn-form-grid-delete': 'onClickDeleteObs',
        'blur .js-form-row': 'liveSave',
      },

      index: 0,

      liveSave: function(e){
        var _this = this;
        setTimeout(function(){
          //dirty
          var index = $(e.currentTarget).index('div.js-form-row');
          _this.lastRowDfd = _this.forms[index].butClickSave();
        },500);

      },

      onEditBtnClick: function(){
        for (var i = 0; i < this.forms.length; i++) {
          this.forms[i].butClickEdit();
        }
        this.mode = 'edit';
        this.toogleButtons();
      },

      onSaveBtnClick: function(){
        var _this = this;
          $.when(this.lastRowDfd).then(function(){
              for (var i = 0; i < _this.forms.length; i++) {
                if(_this.forms[i].model.get('id')){
                _this.forms[i].reloadingAfterSave();
              } else {
                _this.deleteObs(_this.forms[i]);
                i-=1;
              }
            }
            _this.mode = 'display';
            _this.toogleButtons();
          });
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
        var fieldset = this.model.get('obs').models[0].get('fieldsets')[0].fields;

        if(this.showLineNumber){}

        for (var i = 0; i < fieldset.length; i++) {
          var col = this.schema[fieldset[i]];

          // if(i == 0)
          //   col.fieldClass += ' fixedCol ';
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

            this.ui.thead.append('<div title="' + col.title + '" class="'+ col.fieldClass +'"> | ' + col.title + '</div>');
          }
        }
        //size = size*150;
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

        this.ui.tbody.append('<div class="js-form-row form-row"></div>');
        var formRowContainer = this.ui.tbody.find('.js-form-row:last-child');
        this.index++;

        var form = new NsForm({
          formRegion: formRowContainer,
          model: model,
          gridRow: true,
          //reloadAfterSave: true,
          modelurl: config.coreUrl + 'stations/' + this.stationId + '/protocols'
        });




        form.afterDelete = function() {
          var self = this;
          if(this.model.get('id')){
            this.model.destroy({
              url: this.model.urlRoot + '/' + this.model.get('id'),
              wait: true,
              success:function(){
                _this.deleteObs(self);
              }});
          } else {
            this.model.trigger('destroy', this.model, this.model.collection);
            _this.deleteObs(self);
          }

        };
        this.forms.push(form);
        this.ui.rowNumber.append('\
          <div class="row-action" index="' + this.forms.length + '">\
            <button type="button" class="js-btn-form-grid-delete btn btn-xs btn-danger pull-left"><span class="reneco reneco-trash"></span></button>\
            <span class="row-number pull-right">' + this.forms.length + '</span>\
          </div>');
      },

      updateLineNumber: function(){
        this.ui.rowNumber.html('');
        for(var i=0; i< this.forms.length; i++){
          this.ui.rowNumber.append('\
            <div class="row-action" index="' + (i+1) + '">\
              <button type="button" class="js-btn-form-grid-delete btn btn-xs btn-danger pull-left"><span class="reneco reneco-trash"></span></button>\
              <span class="row-number pull-right">' + (i+1) + '</span>\
            </div>');
        }
      },

      onClickDeleteObs: function(e){
        var index = $(e.currentTarget).parent().attr('index');
        var form = this.forms[index-1];
        form.butClickDelete();
      },

      deleteObs: function(form) {
        this.ui.tbody.find($(form.BBForm.el).parent()).remove();
        this.forms = _.reject(this.forms, function(f) {
          return f === form;
        });

        if(!this.model.get('obs')) {
          this.model.destroy();
        }

        this.updateLineNumber();
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
      // if(existingEmptyForm.length) {
      //   //?
      // } else {
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
      //}
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
