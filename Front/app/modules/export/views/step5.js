define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'config',
	'sweetAlert',

], function(
	$, _, Backbone, Marionette, Radio, config,
	Swal
){

	'use strict';

	return Marionette.ItemView.extend({
		template: 'app/modules/export/templates/export-step5.html',
		
		events: {
			'click .exp-file': 'selectFileType',

			
		},
		
		initialize: function(options) {
			this.radio = Radio.channel('exp');

			
			this.viewName = options.viewName;
			this.filterCriteria = options.filterCriteria;
			this.boxCriteria = options.boxCriteria;
			this.columnCriteria = options.columnCriteria;

			
		},

		onDestroy: function() {
		   
		},
		onShow: function() {
			if ( this.viewName == 'V_Qry_ArgosGSM_lastData_withFirstCaptRelData_GeoCountry' ||
				this.viewName ==  'V_Qry_VIndiv_MonitoredLostPostReleaseIndividuals_LastStations' ) {

				this.$el.find('.exp-file').removeClass('hidden');
				this.typeFile = 'pdf';
			}else{
				this.typeFile = 'csv';

			}

			this.$el.find('.exp-file:not(.hidden)').first().addClass('active').find('input[type=radio]').prop('checked', true);
		},

		selectFileType: function(e){
			var elem = $(e.currentTarget); 
			var ctx = this;
			ctx.typeFile = elem.find('input[type=radio]').val();
			this.$el.find('.exp-file').each(function(){
				var radio = $(this).find('input[type=radio]');
				if(radio.val() == ctx.typeFile){
					$(this).addClass('active');
					radio.prop('checked', true);
				}else{
					$(this).removeClass('active');
					radio.prop('checked', false);
				}
			});
		},


		initFile: function(){
			this.datas= {
				type_export: this.typeFile,
				viewName: this.viewName,
				filters: this.filterCriteria,
				bbox: this.boxCriteria,
				columns: this.columnCriteria
			}
			this.getFile(this.typeFile);
		},


		getFile: function(type) {
			var that=this;
			var route = config.coreUrl + "/views/filter/" + this.viewName + "/export";
			Swal({
				showConfirmButton: false,
				html: true,
				title: '<br /> <br/> <div id="progress" class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%"> 0% </div> </div> <br />', 
				text: 'please wait a moment in order to download your file (gpx files takes more time to be ready for download)',

			});

			$.ajax({
				url: route,
				data: JSON.stringify({criteria: this.datas}),
				contentType:'application/json',
				type:'POST',
				context: this,

				xhrFields: {
				onprogress: function (e) {
					if (e.lengthComputable) {
						var progress = Math.floor( e.loaded / e.total * 100 ) + '%';
						console.info(progress);
						$('#progress > div').html(progress);
						$('#progress > div').width(progress);
						}
					}
				},


			}).done(function(data){
				var url = URL.createObjectURL(new Blob([data], {'type':'application/'+type}));
				var link = document.createElement('a');
				link.href = url;
				link.download = that.viewName+'_exports.'+type;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				setTimeout(function(){ 

					Swal({
						title: "Success",
						text: "Would you like to do an other exportation?",
						type: "success",
						showCancelButton: true,
						confirmButtonColor: "green",
						confirmButtonText: "Yes",
						cancelButtonText: "No (go to the dashboard)",
						closeOnConfirm: true,
						closeOnCancel: true
						},
						
						function(isConfirm){
							if (isConfirm) {

							} else {
								Backbone.history.navigate("", {trigger: true});
							}
					});



				}, 1000);
			}).fail(function(msg){
				Swal(
					{
						title: "An error occured",
						text: '',
						type: 'error',
						showCancelButton: false,
						confirmButtonColor: 'rgb(147, 14, 14)',
						confirmButtonText: "OK",
						closeOnConfirm: true,
					}
				);
			});
		},

		
	});
});
