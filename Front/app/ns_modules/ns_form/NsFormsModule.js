define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'backbone_forms',
	'radio',
	'config',
	'autocompTree',
	'fancytree',
	'./NsFormsCustomFields',
	'i18n',
	'ListOfNestedModel',
], function ($, _, Backbone, Marionette, BackboneForm,Radio, config, AutocompTree ,ListOfNestedModel
){
	return Marionette.ItemView.extend({
		BBForm: null,
		modelurl: null,
		Name: null,
		objecttype: null,
		displayMode: null,
		buttonRegion: null,
		formRegion: null,
		isNew: null,
		id: null,
		async: true,
		template: 'app/ns_modules/ns_form/NsFormsModule.html',
		regions: {
			nsFormButtonRegion: '#NsFormButton'
		},
		initialize: function (options) {
			//TODO Gestion Fields/Get à partir de la même url  

			this.BackboneFormsModel = BackboneForm.extend({
				getValue: function(key) {

				if (key) return this.fields[key].getValue();

				var values = {};

				_.each(this.fields, function(field) {
					var val = field.getValue();
					if (val === ''){ val =null;
				}

				values[field.key] = val;
				});

				return values;
				},
			});

			this.radio = Radio.channel('froms');

			this.modelurl = options.modelurl;
			this.file = options.file;
			this.name = options.name;
			this.buttonRegion = options.buttonRegion;
			this.formRegion = options.formRegion;
			this.stationId = parseInt(options.stationId);
			this.async = options.async || this.async;
			if (options.id) {
				this.id = options.id;
				this.isNew = false;
			}
			else {
				this.id = null;
				this.isNew = true;
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
			this.displaybuttons();
			this.$el.i18n();
			if (options.model) {
				this.model = options.model;
				this.BBForm = new BackboneForm({ model: this.model });
			}
			else {
				this.initModel();
			}
		},
		initModel: function (mode) {
			//Initialisation du model et sema depuis l'url
			var dipsMode = 'display';
			if(mode){
				dipsMode = mode;
			}
			this.model = new Backbone.Model();
			var url = this.modelurl   ;
			var protoType = this.getProtocolType(url);
			/*if (!this.isNew) {
				url += this.id;
			}
			else if (this.modelurl) {
				url += '0';
			}*/
			if(this.modelurl) {
				$.ajax({
					url: url,
					context: this,
					type: 'GET',
					data: { FormName: this.name, ObjectType: this.objecttype,DisplayMode:this.displayMode },
					dataType: 'json',
					success: function (resp) {
						this.model.schema = resp.schema;
						var data = resp.data;
						if(data && (! _.isEmpty(data))){
							this.model.attributes = data;
						} else {
							this.model.attributes = resp.defaults || {};
						}
						if(this.model.schema.FK_TSta_ID){
							this.model.set('FK_TSta_ID', this.stationId);
						}
						if (resp.fieldsets.length > 0) {
							this.model.fieldsets = resp.fieldsets;
						}
						this.model.url = this.modelurl;
						//this.model.trigger('change');
						this.showForm();
						if(data && (! _.isEmpty(data))){
						   this.radio.command('editState',{model: this.model});
						  
						}
						if((dipsMode == 'display') && protoType =='old'){
							this.displayState();
							this.displayMode = 'display';
						   this.displaybuttons();
						}

					},
					error: function (data) {
						alert('error Getting Fields for current protocol ');
					}
				});
			}
			return false;
			
			/*if(this.file) {
				var self = this;
				var deferreds = [];
				var filePath ='./modules/input/data/' + this.file;
				deferreds.push($.getJSON(filePath, function(data) {
					self.model.schema = data.schema;
					 self.model.attributes = data.defaults;
					if (data.fieldsets) {
						self.model.fieldsets = data.fieldsets;
					}
					self.showForm();
				}));
			}*/
		},
		showForm: function () {
			this.BBForm = new this.BackboneFormsModel({ model: this.model });
			this.BBForm.render();
			var formContent = this.BBForm.el;
			if(this.id){
				$(formContent).attr('id',this.id);
			}
			// format fields to have bootstrap style
			$(formContent).find('fieldset>div').addClass('col-sm-3');
			$(formContent).find('.wideField').each(function() {
				var divContainer =  $( this ).parent().parent().parent();
				$(divContainer).removeClass('col-sm-3');
				$(divContainer).addClass('col-sm-6');
			});
			$(formContent).find('input[type="text"]').addClass('form-control');
			$(formContent).find('input[type="number"]').addClass('form-control');
			$(formContent).find('select').addClass('form-control');
			$(formContent).find('textarea').addClass('form-control');
			$('#' + this.formRegion).html(this.BBForm.el);


			var html = Marionette.Renderer.render(this.template);
			$('#' + this.buttonRegion).html(html);
			this.radio.command('updateForm');
			this.displaybuttons();
			this.createAutocompTree();
		   
			/*$('.timePicker').on('dp.show', function(e) {
					$('input.timeInput').val('');    
			});*/
			$('input.timeInput').attr('placeholder' ,'hh:mm');
		},
		createAutocompTree : function(e){
			//var startId = $(e.target).attr('startId');
			var elementsList = $('.autocompTree');
			for(var i=0;i<elementsList.length;i++){
				//$(e.target).autocompTree({
				var startId = parseInt($(elementsList[i]).attr('startId')) + 204081;
				// get current value
				var currentVal = $(elementsList[i]).val();
				$(elementsList[i]).autocompTree({
					wsUrl: config.serverUrl+'/ThesaurusREADServices.svc/json',					
					//display: {displayValueName:'value', storedValueName: 'fullpath'},
					webservices: 'fastInitForCompleteTree',  
					language: {hasLanguage:true, lng:"en"},
					display: {
						isDisplayDifferent: true,
						suffixeId: '_value',
						displayValueName: 'value',
						storedValueName: 'fullpathTranslated'
					},
					startId: startId 
				});
				// set current valua after applying autocompTree
				$(elementsList[i]).val(currentVal);
			}
		},


		/*
		gethtml: function () {
			this.BBForm = new BackboneForm({ model: this.model });
			this.BBForm.render();
			var formContent = this.BBForm.el;
			//this.displaybuttons();
			return formContent;
		},

		getbuttonhtml: function () {
			this.displaybuttons();
			return this.template;
		},

		*/
		displaybuttons: function () {
			if (this.displayMode == 'edit') {
				$('#' + this.buttonRegion).find('#NsFormModuleSave').attr('style', 'display:');
				$('#' + this.buttonRegion).find('#NsFormModuleClear').attr('style', 'display:');
				$('#' + this.buttonRegion).find('#NsFormModuleEdit').attr('style', 'display:none');
			}
			else {
				$('#' + this.buttonRegion).find('#NsFormModuleSave').attr('style', 'display:none');
				$('#' + this.buttonRegion).find('#NsFormModuleClear').attr('style', 'display:none');
				$('#' + this.buttonRegion).find('#NsFormModuleEdit').attr('style', 'display:');
			} 
		   // $('#' + this.buttonRegion).on('click #NsFormModuleSave', this.butClickSave);
			$('#NsFormModuleSave').click($.proxy(this.butClickSave, this));
			$('#NsFormModuleEdit').click($.proxy(this.butClickEdit, this));
			$('#NsFormModuleClear').click($.proxy(this.butClickClear, this));
		   
		},
		butClickSave: function (e) {
			//e.preventDefault();
			// TODO gérer l'appel AJAX
			var errors = this.BBForm.commit();
			var changedAttr = this.BBForm.model.changed;
			if(!errors){
				//this.model.set('id', null);
				
				var staId = this.model.get('FK_TSta_ID');
				if(staId){
					this.model.set('FK_TSta_ID', parseInt(staId));
				}
				for (attr in this.model.attributes) {
				   var val = this.model.get(attr);
				   if (Array.isArray(val) ){
						if (val[0] == 'true' && val.length == 0)
							this.model.set(attr,1)
				   }                
			   }
				var self = this;
				this.model.save([],{
				 dataType:"text",
				 async: this.async,
				 success:function(model, response) {
					self.displayMode = 'display';
					self.displaybuttons();
					self.radio.command('successCommitForm', {id: response});
					// update this.modelurl  if we create a new instance of protocol
					var tab = self.modelurl.split('/');
					var ln = tab.length;
					var newId = parseInt(response);
					var currentProtoId = parseInt(tab[ln - 1]);
					if (currentProtoId ===0){
						var url ='';
						for (var i=0; i<(ln -1);i++){
							url += tab[i] +'/';
						}
						self.modelurl = url + newId;
					}
				 },
				 error:function(request, status, error) {
					alert('error in saving data');
				 }
				});
			}
			return false;
		},
		butClickEdit: function (e) {
			e.preventDefault();
			this.displayMode = 'edit';
			this.initModel('edit');
			return false;
		},

		butClickClear: function (e) {
			//this.displaybuttons();
			var formContent = this.BBForm.el;
			$(formContent).find('input').val('');
			$(formContent).find('select').val('');
			$(formContent).find('textarea').val('');
			$(formContent).find('input[type="checkbox"]').attr('checked', false);
			//this.displayMode = 'edit';
			//initModel();
			// TODO gérer l'appel AJAX
		},
		displayState : function(){
			var formContent = this.BBForm.el;
			$(formContent).find('input').attr('disabled','disabled');
			$(formContent).find('select').attr('disabled','disabled');
			$(formContent).find('textarea').attr('disabled','disabled');
		},
		getProtocolType : function(url){
			var typeProtocol = 'new';
			var tab = url.split('/');
			var id = tab[tab.length -1];
			if (parseInt(id) != 0 ) typeProtocol = 'old';
			return typeProtocol;
		}
	});

});
