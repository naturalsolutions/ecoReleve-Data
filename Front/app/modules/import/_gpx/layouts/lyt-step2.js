define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'sweetAlert',

	'ns_stepper/lyt-step',

	'collections/waypoints',
	'tmp/xmlParser',
	'translater'

], function(
	$, _, Backbone, Marionette, Radio, Swal,
	Step, Waypoints, xmlParser,Translater
){

	'use strict';

	return Step.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/


		events : {
			'click #reset' : 'reset',
			'change input:file' : 'datachanged_FileName',
			'change #importFieldActivity' : 'setFieldActivity',
			'click #resetFieldActivity' : 'resetFieldActivity'
		},

		onShow: function(){
			$('#step-nav').show();
			$('#btnPrev').show();
			this.translater = Translater.getTranslater();
            this.$el.i18n();
		},

		onRender: function () {
			$('#btnPrev').show();
		},

		initModel: function(myTpl){// Initialisation du model à partir du template    
			//Step.prototype.parseOneTpl.call(this);
			this.name = 'data';
			this.waypointList = new Waypoints();
			this.model.set('data_FileContent', null);
			this.parseOneTpl(this.template);
			this.model.set('data_FileName', '');
			var obj={name : 'data_FileName',required : true};
			this.stepAttributes = [obj] ;

		},

		feedTpl: function(){
			var NomFichier = this.model.get('data_FileName');
			this.$el.find('#FileName').val(NomFichier) ;
		 /*   this.$el.find('#FileInput').val(NomFichier) ;*/

		},
		
		parseFichier: function(e){ 
			var fileSelectionSuccessMsg = this.translater.getValueFromKey('import.fileSelectionSuccessMsg');
			var waypointLabel = this.translater.getValueFromKey('import.waypoint');
			var alertTitle = this.translater.getValueFromKey('import.fileTypeError');
			var alertText = this.translater.getValueFromKey('import.fileTypeAlertMsg');
			var alertApiMsg = this.translater.getValueFromKey('import.fileApiError');
			var alertBrowserUpdateMsg = this.translater.getValueFromKey('import.fileBrowserApiError');
			var textLoadedPoints = this.translater.getValueFromKey('import.loadingFileMsg');
			var waypointLabel = this.translater.getValueFromKey('import.waypoint');
			var importCheckMsg = this.translater.getValueFromKey('import.fileDataError');
			var fileTypeMsgError = this.translater.getValueFromKey('fileTypeMsgError');

			this.loading = false;
			var self = this;
			//var selected_file = document.querySelector('#FileInput');
			var selected_file = $('#FileInput').get(0).files[0];
			// selected_file.onchange = function() {
				try {
					var reader = new FileReader();
					var xml;
					//var file = $(e.target).files[0];
					var fileName = selected_file.name;
					var tab = fileName.split('.');
					var fileType = tab[1];
					fileType = fileType.toUpperCase();
					if (fileType != 'GPX') {
						this.model.set('data_FileName', '');
						//alert('File type is not supported. Please select a "gpx" file');
						Swal({
							title: alertTitle,
							text: alertText,
							type: 'error',
							showCancelButton: false,
							confirmButtonColor: 'rgb(147, 14, 14)',
							confirmButtonText: "OK",
							closeOnConfirm: true,
						});
					} else {
						reader.onload = function(e, fileName) {
							xml = e.target.result;
							// get waypoints collection
							
							var importResulr =  xmlParser.gpxParser(xml);
							self.waypointList =  importResulr[0];
							var errosList = importResulr[1];
							var nbWaypoints = self.waypointList.length;
							self.model.set('data_FileContent', self.waypointList);
							if ((nbWaypoints > 0) && (errosList.length == 0)){
								$('#importGpxMsg').text(fileSelectionSuccessMsg + nbWaypoints + waypointLabel + '(s).');
								self.loading = true;
								self.displayFieldActivity(true);
								
							}
							else if((nbWaypoints > 0) && (errosList.length > 0)){
								$('#importGpxMsg').text( nbWaypoints + textLoadedPoints + (nbWaypoints + errosList.length )+  waypointLabel + '(s).');
								$('#importGpxMsg').append(importCheckMsg + ':<br/>');
								// read errors array
								for(var i=0; i< errosList.length; i++){
									$('#importGpxMsg').append(errosList[i] + '<br/>');
								}
								self.loading = true;
								self.displayFieldActivity(true);

							} else {
								$('#importGpxMsg').text(fileTypeMsgError);
								self.displayFieldActivity(false);
								
							}
						};
					}
					reader.readAsText(selected_file);
					
				} catch (e) {
					//alert('File API is not supported by this version of browser. Please update your browser and check again, or use another browser');
					Swal({
							title: alertApiMsg,
							text: alertBrowserUpdateMsg,
							type: 'error',
							showCancelButton: false,
							confirmButtonColor: 'rgb(147, 14, 14)',
							confirmButtonText: "OK",
							closeOnConfirm: true,
						});
					this.model.set('data_FileName', '');
				}
				//return loading;
			//}
		},

		datachanged_FileName: function(e){
			var val = $('#FileInput').val() ;
			// TODO ajouter gestion linux avec /
			var tab = val.split('\\');
			val = tab[tab.length-1];

			$('#FileName').val(val)  ;
			this.model.set( 'data_FileName', val);
			this.parseFichier(e);
			
		},
		nextOK: function(){
			return this.loading;
		},
		displayFieldActivity : function(val){
			var fAContainer = $("#importSelectGlobalActivity");
			if(val){
				$(fAContainer).css('display','');
			} else {
				$(fAContainer).css('display','none');
			}
		},
		setFieldActivity : function(e){
			var currentFieldVal = $(e.target).val();
			/*this.$el.find('#locations tr').each(function(){
				$(this).find('select').val(currentFieldVal);
			});*/
			var collection = this.model.get('data_FileContent') ; 
			 collection.each(function(model) {
				model.set('fieldActivity',currentFieldVal);
			});
		},

		resetFieldActivity : function(e){
			this.$el.find('#importFieldActivity').val('');
			/*this.$el.find('#locations tr').each(function(){
				$(this).find('select').val('');
			});*/
			var collection = this.model.get('data_FileContent') ; 
			 collection.each(function(model) {
				model.set('fieldActivity','');
			});
		}
	});

});
