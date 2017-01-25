define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',
	'ns_form/ns.form.view',
], function(
  $, _, Backbone, Marionette, Swal, Translater,
  NsForm
){

  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/modules/objects/object.new.tpl.html',
    className: 'white full-height new',

    regions: {
      'rgForm': '.js-rg-form',
    },

    events: {
      'click .js-btn-save': 'save',
      'click .js-link-back': 'back',
    },

    model: new Backbone.Model(),

    initialize: function(options) {
			this.data = options.data;
      this.model.set('objectType', options.objectType || 1);
    },

    onShow: function() {
      this.displayForm();
    },

    displayForm: function() {
      var _this = this;
      this.rgForm.show(this.nsForm = new NsForm({
        modelurl: this.model.get('type'),
        buttonRegion: [],
        displayMode: 'edit',
        objectType: this.model.get('objectType'),
        id: 0,
        data: this.data,
        reloadAfterSave: false,
        afterSaveSuccess: this.afterSaveSuccess.bind(this),
        savingError: function(response) {
          var msg = 'in creating a new sensor';
          if (response.status == 520 && response.responseText){
            msg = response.responseText;
          }
          Swal({
            title: 'Error',
            text: msg ,
            type: 'error',
            showCancelButton: false,
            confirmButtonColor: 'rgb(147, 14, 14)',
            confirmButtonText: 'OK',
            closeOnConfirm: true,
          });
        }
      }));
    },

    afterSaveSuccess: function(){
      var _this = this;
      Swal({
        title: 'Succes',
        text: 'creating new ' + _this.model.get('single'),
        type: 'success',
        showCancelButton: true,
        confirmButtonColor: 'green',
        confirmButtonText: 'create another ' + _this.model.get('single'),
        cancelButtonText: 'cancel',
        closeOnConfirm: true,
      },
      function(isConfirm) {
        if (!isConfirm) {
          _this.cancel();
        } else {
          _this.nsForm.butClickClear();
        }
      });
    },

    save: function() {
      this.nsForm.butClickSave();
    },

    back: function() {
    },

		cancel: function() {
			Backbone.history.navigate(this.model.get('type'),{trigger: true});
		},
  });
});
