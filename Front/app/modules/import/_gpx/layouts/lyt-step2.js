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


], function(
	$, _, Backbone, Marionette, Radio, Swal,
	Step, Waypoints, xmlParser
){

	'use strict';

	return Step.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/


		events : {
			'click #reset' : 'reset',
			'change input:file' : 'datachanged_FileName',
		},

		onShow: function(){
			$('#step-nav').show();
			 $('#btnPrev').show();
		},

		onRender: function () {
			$('#btnPrev').show();
		},

		initModel: function(myTpl){// Initialisation du model à partir du template    
			//Step.prototype.parseOneTpl.call(this);
			this.name = 'data';
			this.waypointList = new Waypoints();
			this.model.set(this.name + '_FileContent', null);
			this.parseOneTpl(this.template);
			this.model.set(this.name + '_FileName', "");
			var obj={name : this.name + '_FileName',required : true};
			this.stepAttributes = [obj] ;

		},

		feedTpl: function(){
			var NomFichier = this.model.get(this.name + '_FileName');
			this.$el.find('#FileName').val(NomFichier) ;
		 /*   this.$el.find('#FileInput').val(NomFichier) ;*/

		},
		
		parseFichier: function(e){ 
			var loading = false;
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
						this.model.set(this.name + '_FileName', "");
						//alert('File type is not supported. Please select a "gpx" file');
						Swal({
							title: "File type is not supported",
							text: 'Please select a "gpx" file',
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
							
							console.log(xmlParser.gpxParser(xml));

							var importResulr =  xmlParser.gpxParser(xml);



							self.waypointList =  importResulr[0];
							var errosList = importResulr[1];
							// display parsing message
							console.log(self);
							console.log(self.waypointList);


							var nbWaypoints = self.waypointList.length;
							self.model.set(self.name + '_FileContent', self.waypointList);
							if ((nbWaypoints > 0) && (errosList.length == 0)){
								$('#importGpxMsg').text('Gpx file is successfully loaded. You have ' + nbWaypoints + ' waypoints.');
								loading = true;
								
							}
							else if((nbWaypoints > 0) && (errosList.length > 0)){
								$('#importGpxMsg').text( nbWaypoints + '  waypoints are loaded from a total of ' + (nbWaypoints + errosList.length )+' waypoints.');
								$('#importGpxMsg').append(' Please check data for the following waypoints:<br/>');
								// read errors array
								for(var i=0; i< errosList.length; i++){
									$('#importGpxMsg').append(errosList[i] + '<br/>');
								}
								loading = true;

							} else {
								$('#importGpxMsg').text('Please check gpx file structure. There is not stored waypoints !');
								
							}
						};
					}
					reader.readAsText(selected_file);
					
				} catch (e) {
					//alert('File API is not supported by this version of browser. Please update your browser and check again, or use another browser');
					Swal({
							title: "File API is not supported by this version of browser",
							text: 'Please update your browser and check again, or use another browser',
							type: 'error',
							showCancelButton: false,
							confirmButtonColor: 'rgb(147, 14, 14)',
							confirmButtonText: "OK",
							closeOnConfirm: true,
						});
					this.model.set(this.name + '_FileName', "");
				}
				return loading;
			//}
		},

		datachanged_FileName: function(e){
			var val = $('#FileInput').val() ;
			// TODO ajouter gestion linux avec /
			var tab = val.split('\\');
			val = tab[tab.length-1];

			$('#FileName').val(val)  ;
			this.model.set(this.name + '_FileName', val);
			this.parseFichier(e);
			
		}
	});

});
