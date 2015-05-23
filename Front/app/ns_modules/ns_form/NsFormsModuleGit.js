define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'backbone_forms',
	'requirejs-text!./Templates/NsFormsModule.html',
], function ($, _, Backbone, Marionette, BackboneForm, tpl, Swal) {
	return Backbone.View.extend({
		BBForm: null,
		modelurl: null,
		Name: null,
		objecttype: null,
		displayMode: null,
		buttonRegion: null,
		formRegion: null,
		id: null,
		reloadAfterSave: true,
		template: tpl,
		redirectAfterPost: "",
		eventsBinded :false,

		initialize: function (options) {
			this.modelurl = options.modelurl;

			this.name = options.name;
			this.buttonRegion = options.buttonRegion;
			this.formRegion = options.formRegion;
			if (options.reloadAfterSave != null) { this.reloadAfterSave = options.reloadAfterSave };
			// The template need formname as vrairable, to make it work if several NSForms in the same page
			// With adding formname, there will be no name conflit on Button class
			var variables = { formname: this.name };
			if (options.template) {
				// if a specific template is given, we use it
				this.template = _.template($(options.template).html(), variables);
			}
			else {
				// else use default template
				this.template = _.template($(tpl).html(), variables);
			}


			if (options.id && !isNaN(options.id)) {
				this.id = options.id;
			}
			else {
				this.id = 0;
			}

			if (options.displayMode) {
				this.displayMode = options.displayMode;
			}
			else {
				this.displayMode = 'edit';
			}
			if (options.objecttype) {
				this.objecttype = options.objecttype;
			}
			else {
				this.objecttype = null;
			}
			this.objecttype = options.objecttype;

			if (options.model) {
				this.model = options.model;
				this.BBForm = new BackboneForm({ model: this.model, fieldsets: this.model.fieldsets});
				this.showForm();
			}
			else {
				this.initModel();
			}


			if (options.redirectAfterPost) {
				// allow to redirect after creation (post) using the id of created object
				this.redirectAfterPost = options.redirectAfterPost;
			}


		},



		initModel: function () {
			//initialize model from AJAX call
			var _this = this;

			if(!this.model){
				this.model = new Backbone.Model();
			}

			console.log(this.model);

			var url = this.modelurl

			url += this.id;

			console.log(url);


			$.ajax({
				url: url,
				context: this,
				type: 'GET',
				data: { FormName: this.name, ObjectType: this.objecttype, DisplayMode: this.displayMode },
				dataType: 'json',
				success: function (resp) {
					_this.model.schema = resp.schema;
					_this.model.attributes = resp.data;
					if (resp.fieldsets) {
						// if fieldset present in response, we get it
						_this.model.fieldsets = resp.fieldsets;
					}
					// give the url to model to manage save
					_this.model.urlRoot = this.modelurl;
					_this.BBForm = new BackboneForm({ model: _this.model, data: _this.model.data, fieldsets: _this.model.fieldsets, schema: _this.model.schema });
					_this.showForm();
				},
				error: function (data) {
					//alert('error Getting Fields for Form ' + this.name + ' on type ' + this.objecttype);
				}
			});
		},
		showForm: function () {
			this.BBForm.render();
			// Call extendable function before the show call
			this.BeforeShow();
			var _this = this;
			$('#' + this.formRegion).html(this.BBForm.el);

			this.buttonRegion.forEach(function (entry) {
				$('#' + entry).html(_this.template);
			});

			this.displaybuttons();

			if(!this.eventsBinded){
				this.bindEvents();
			}
			this.afterShow();
		},

		bindEvents: function(){
			var _this = this;
			var name = this.name;
			$('.NsFormModuleCancel' + name).on('click', function(){
				_this.butClickCancel(this);
				console.log('cancel');
			})
			$('.NsFormModuleSave' + name).on('click', function(){
				_this.butClickSave(this);
			})
			$('.NsFormModuleClear' + name).on('click', function(){
				_this.butClickClear(this);
			})
			$('.NsFormModuleEdit' + name).on('click', function(){
				_this.butClickEdit(this);
			});
			this.eventsBinded = true;
		},


		displaybuttons: function () {
			var name = this.name;

			if(this.displayMode == 'edit'){
				$('.NsFormModuleCancel'+name).removeClass('hidden');
				$('.NsFormModuleSave'+name).removeClass('hidden');
				$('.NsFormModuleClear'+name).removeClass('hidden');

				$('.NsFormModuleEdit'+name).addClass('hidden');
				$('#' + this.formRegion).find('input:enabled:first').focus();
			}else{
				$('.NsFormModuleCancel'+name).addClass('hidden');
				$('.NsFormModuleSave'+name).addClass('hidden');
				$('.NsFormModuleClear'+name).addClass('hidden');

				$('.NsFormModuleEdit'+name).removeClass('hidden');
			}
		},

		afterShow: function(){

		},

		butClickSave: function (e) {
			this.BBForm.commit();
			if (this.model.attributes["id"] == 0) {
				// To force post when model.save()
				this.model.attributes["id"] = null;
			}
			var _this = this;
			this.onSavingModel();

			if (this.model.id == 0) {
				// New Record
				this.model.save(null, {
					success: function (model, response) {
						// Getting ID of created record, from the model (has beeen affected during model.save in the response)
						_this.savingSuccess(model, response);
						_this.id = _this.model.id;
						
						if (_this.redirectAfterPost != "") {
							// If redirect after creation
							var TargetUrl = _this.redirectAfterPost.replace('@id', _this.id);

							if (window.location.href == window.location.origin + TargetUrl) {
								// if same page, relaod
								window.location.reload();
							}
							else {
								// otherwise redirect
								window.location.href = TargetUrl;
							}
						}
						else {
							// If no redirect after creation
							if (_this.reloadAfterSave) {
								_this.reloadAfterSave();
							}
						}
					},
					error: function (response) {
						_this.savingError(response);
					}

				});
			}
			else {
				// UAfter update of existing record
				this.model.id = this.model.get('id');
				this.model.save(null, {
					success: function (model, response) {
						_this.savingSuccess(model, response);
						if (_this.reloadAfterSave) {
							_this.reloadingAfterSave();
						}
					},
					error: function (response) {
						_this.savingError(response);
					}
				});
			}
			this.afterSavingModel();
		},
		butClickEdit: function (e) {
			this.displayMode = 'edit';
			this.initModel();
			this.displaybuttons();
		},
		butClickCancel: function (e) {
			this.displayMode = 'display';
			this.initModel();
			this.displaybuttons();
		},
		butClickClear: function (e) {
			var formContent = this.BBForm.el;
			$(formContent).find('input').val('');
			$(formContent).find('select').val('');
			$(formContent).find('textarea').val('');
			$(formContent).find('input[type="checkbox"]').attr('checked', false);
		},



		reloadingAfterSave: function () {
			this.displayMode = 'display';
			// reaload created record from AJAX Call
			this.initModel();
			this.showForm();
			this.displaybuttons();
		},






		onSavingModel: function () {
			// To be extended, calld after commit before save on model
		},
		afterSavingModel: function () {
			// To be extended called after model.save()
		},
		BeforeShow: function () {
			// to be extended called after render, before the show function
		},

		savingSuccess: function (model, response) {
			// To be extended, called after save on model if success
		},
		savingError: function (response) {
			// To be extended, called after save on model if error
		},
	});

});
