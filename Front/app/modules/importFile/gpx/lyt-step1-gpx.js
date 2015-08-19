//waypoints?

define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'sweetAlert',

	'tmp/XmlParser',

	'i18n'

], function($, _, Backbone, Marionette, config, Swal, XmlParser
){

	'use strict';

	return Marionette.LayoutView.extend({
		className: 'full-height',
		template: 'app/modules/importFile/gpx/templates/tpl-step1-gpx.html',

		name : 'GPX file upload',

		events: {
			'change #fileInput' : 'importFile',
			'change #selectFieldActivity' : 'setFieldActivity',
			'click #resetFieldActivity' : 'resetFieldActivity'
		},

		ui: {
			'fielActivity' : '#fielActivity',
			'selectFieldActivity' : '#selectFieldActivity',
			'fileInput': 'input#fileInput',
		},

		initialize: function(){
			this.model = new Backbone.Model();
			this.wayPointList = new Backbone.Collection();
			this.errors = true;
			this.deferred = $.Deferred();
		},

		onShow : function(){
			var _this = this;
			var collFieldActivity =  new Backbone.Collection();
			collFieldActivity.url = config.coreUrl + 'fieldActivity';

			collFieldActivity.fetch({
				success : function (data) {
					//could be a collectionView
					for (var i in data.models ) {
						var current = data.models[i];
						_this.ui.selectFieldActivity.append('<option value ='+current.get('value')+'>'+current.get('label')+'</option>');
					}
				}
			});
		},

		importFile: function(e){
			var _this = this;
			var file = e.target.files[0];
			var reader = new FileReader();
			var fileName = file.name;
			var tab = fileName.split('.');
			var fileType = tab[1].toUpperCase();
			
			if (fileType != 'GPX') {
				this.swalError('error file type');
				this.model.set('data_FileName', '');
				this.errors = true;
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
						_this.ui.fielActivity.removeClass('hidden');
						//warning
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
						_this.ui.fielActivity.addClass('hidden');
						_this.errors = true;
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


	});
});
