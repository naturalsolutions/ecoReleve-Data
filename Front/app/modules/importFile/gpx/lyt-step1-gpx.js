//waypoints?

define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'sweetAlert',
	'tmp/XmlParser',
	'ns_form/NSFormsModuleGit',
	'models/gpxForm',
	'FileUploadEditor',
	'i18n',


], function($, _, Backbone, Marionette, config, Swal, XmlParser,NsForm , GpxForm, FileEditor
){

	'use strict';

	return Marionette.LayoutView.extend({
		className: 'full-height',
		template: 'app/modules/importFile/gpx/templates/tpl-step1-gpx.html',

		name : 'GPX file upload',

		events: {
			'change input[type="file"]' : 'importFile',
			'change select[name="fieldActivity"]' : 'setFieldActivity',
			'click #resetFieldActivity' : 'resetFieldActivity',
			'click button[data-action="add"]' : 'setUsers',
			'change select[name="FieldWorker"]' : 'checkUsers'
		},

		ui: {
			'fielActivity' : '#fielActivity',
			//'selectFieldActivity' : '#selectFieldActivity',
			'selectFieldActivity' : '#c14_fieldActivity',
			'fileInput': 'input#fileInput',
			'form': '#form',
		},

		initialize: function(){
			this.model = new Backbone.Model();
			this.wayPointList = new Backbone.Collection();
			this.errors = true;
			this.deferred = $.Deferred();
			
		},

		onShow : function(){
			this.displayForm();
			// fieldactivity
			this.loadCollection (config.coreUrl + 'fieldActivity', 'select[name="fieldActivity"]');
			$('button[data-action="add"]').attr('disabled','disabled');
		},

		importFile: function(e){

			var _this = this;
			var file = e.target.files[0];
			var reader = new FileReader();
			var fileName = file.name;
			var tab = fileName.split('.');
			var fileType = tab[1].toUpperCase();
			var fieldAfield = $('select[name="fieldActivity"]');
			var userBtn = $('button[data-action="add"]');
			
			if (fileType != 'GPX') {
				this.swalError('error file type');
				this.model.set('data_FileName', '');
				this.errors = true;
				$(fieldAfield).attr('disabled', 'disabled');	
				$(userBtn).attr('disabled', 'disabled');	
				$('#importGpxMsg').removeClass('hidden');
			} else {
				reader.onload = function(e, fileName){
					var xml = e.target.result;
					
					// get waypoints collection

					var importResulr =  XmlParser.gpxParser(xml);
					_this.wayPointList =  importResulr[0];
					var errosList = importResulr[1];

					_this.model.set('data_FileContent', _this.wayPointList);

					//success
					if(_this.wayPointList.length > 0){
						//_this.ui.fielActivity.removeClass('hidden');
						//warning
						$(fieldAfield).removeAttr('disabled');	
						$(userBtn).removeAttr('disabled');	
						$('#importGpxMsg').addClass('hidden');

						if(errosList.length > 0){
							for(var i=0; i< errosList.length; i++){
								_this.displayErrors(errosList[i] + '<br/>');
							}
						}
						_this.errors = false;
						_this.deferred.resolve();
					//error
					} else {
						_this.displayErrors('file error');
						//_this.ui.fielActivity.addClass('hidden');
						_this.errors = true;
						$(fieldAfield).attr('disabled','disabled');	
						$(userBtn).attr('disabled','disabled');	
					}
				};
			}
			reader.readAsText(file);
		},

		displayErrors: function(errors){
			this.ui.importGpxMsg.append(errors);
		},

		swalError: function(title){
			Swal({
				title: title,
				text: 'error',
				type: 'error',
				showCancelButton: false,
				confirmButtonColor: 'rgb(147, 14, 14)',
				confirmButtonText: 'OK',
				closeOnConfirm: true,
			},
			function(isConfirm){   

				$('form')[0].reset();

			});
		},


		setFieldActivity: function(e){
			//could be bugged
			var fieldActivity = $(e.target).val();
			this.wayPointList.each(function(model) {
				model.set('fieldActivity', fieldActivity);
			});
		},
		onDestroy: function(){
		},

		isRdyAccess: function(){

		},

		isRdyNext: function(){
			return this.deferred;
		},

		validate: function(){
			//defered here
			//change the status of the deferred
			//then return the deferred
			return this.wayPointList;
		},

		check: function(){
			return this.deferred;
		},
		displayForm : function(){
			var model = new GpxForm();
			this.nsform = new NsForm({
				//name: 'ImportGpxFileForm',
				//modelurl: config.coreUrl+'stations/fileImport',
				model : model,
				buttonRegion: [],
				formRegion: this.ui.form,
				//displayMode: 'display',
				reloadAfterSave : false,
				//parent: this.parent
			});
		},
		loadCollection : function(url, element){
			var collection =  new Backbone.Collection();
			collection.url = url;
			var elem = $(element);
			elem.append('<option></option>');
			collection.fetch({
				success : function (data) {
					//could be a collectionView
					for (var i in data.models ) {
						var current = data.models[i];
						var value = current.get('value') || current.get('PK_id');
						var label = current.get('label') || current.get('fullname');
						elem.append('<option value ='+ value +'>'+ label +'</option>');
					}
				}
			});
		},
		setUsers : function (){
			var url = config.coreUrl + 'user';
			var collection =  new Backbone.Collection();
			collection.url = url;
			var elem = '<option></option>';
			collection.fetch({
				success : function (data) {
					var options = [];
					for (var i in data.models ) {
						var current = data.models[i];
						var value =  current.get('PK_id');
						var label =  current.get('fullname');
						elem +='<option value ='+ value +'>'+ label +'</option>';
					}
					$('select[name="FieldWorker"]').each(function() {
						if ($(this).text()==''){
							$(this).append(elem);
						}
					});
				}
			});
		},
		checkUsers : function(e){
			var usersFields = $('select[name="FieldWorker"]');
			var selectedUser = $(e.target).val();
			var exists = 0;
			$('select[name="FieldWorker"]').each(function() {
				var user = $(this).val();
				if (user == selectedUser){
					exists += 1;
				}
			});
			if(exists > 1){
				Swal({
				title: 'Fieldworker name error',
				text: 'Already selected ! ',
				type: 'error',
				showCancelButton: false,
				confirmButtonColor: 'rgb(147, 14, 14)',
				confirmButtonText: 'OK',
				closeOnConfirm: true,
				},
				function(isConfirm){   
					$(e.target).val('');
				});
				
			} else {
				this.updateUsers(e);
			}
		},
		updateUsers : function(e){
			var users = [];
			$('select[name="FieldWorker"]').each(function() {
				var user = parseInt($(this).val());
				if (user){
					users.push(user);
				}
			});
			this.wayPointList.each(function(model) {
				model.set('FieldWorkers', users);
			});
		},
	});
});
