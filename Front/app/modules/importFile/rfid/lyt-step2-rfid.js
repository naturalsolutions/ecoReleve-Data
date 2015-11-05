define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'sweetAlert',
	'i18n',

], function($, _, Backbone, Marionette,config,swal
){

	'use strict';

	return Marionette.LayoutView.extend({

		className: 'full-height', 
		template: 'app/modules/importFile/rfid/templates/tpl-step2-rfid.html',

		name : 'step2 RFID',
		ui: {
            progress: '.progress',
            progressBar: '.progress-bar',
            fileHelper: '#help-file',
            fileGroup: '#group-file',
            modHelper: '#help-mod',
            modGroup: '#group-mod',
            modInput: '#input-mod'
    },
		events: {
			'change input[type="file"]' : 'importFile',
			'click button#clear' : 'clearFile'
		},

		initialize: function(options){
			this.sensorId = options.model.attributes.sensorId;
		},

		onShow : function(){
			this.reset();
		},
		clearFile : function(){
			$('#input-file').val("");
		},
		importFile: function(event) {
            this.clear();
            var module = this.ui.modInput.val();
            if( module !== '') {

                var reader = new FileReader();
                var file = $('#input-file').get(0).files[0] || null;

                var ext = file.name.split('.');
				if (ext[ext.length-1] != "txt") {
						swal(
							{
								title: "Wrong file type",
								text: 'The file should be a text file (.txt)',
								type: 'error',
								showCancelButton: false,
								confirmButtonColor: 'rgb(147, 14, 14)',
								confirmButtonText: "OK",

								closeOnConfirm: true,
							}
						);
						return false;
				} else {
					var url = config.coreUrl + 'sensors/rfid/datas';
	                var data = new FormData();
	                var self = this;

				}


                reader.onprogress = function(data) {
                    if (data.lengthComputable) {
                        var progress = parseInt(data.loaded / data.total * 100).toString();
                        self.ui.progressBar.width(progress + '%');
                       
                    }
                };

                reader.onload = function(e, fileName) {
                    data.append('data', e.target.result);
                    //data.append('module', self.model.get(self.parent.steps[self.parent.currentStep-1].name+'_RFID_identifer'));
                    data.append('FK_Sensor',self.sensorId);
                    $.ajax({
                        type: 'POST',
                        url: url,
                        data: data,
                        processData: false,
                        contentType: false
                    }).done(function(data) {
                        $('.cancel').removeAttr('disabled');
                         
                        self.ui.progressBar.css({'background-color':'green'})
                        swal(
                            {
                              title: "Succes",
                              text: "importing RFID file",
                              type: 'success',
                              showCancelButton: true,
                              confirmButtonColor: 'green',
                              confirmButtonText: "Import new RFID",
                              cancelButtonText: "Go to Validate",
                              closeOnConfirm: true,
                             
                            },
                            function(isConfirm){
                                self.ui.progress.hide();
                                if (isConfirm) {
                                    Backbone.history.navigate('importFile',{ trigger:true});
                                }
                                else {
                                    Backbone.history.navigate('validate/rfid',{ trigger:true});
                                }
                            }
                        );
                        


                    }).fail( function(data) {
                        
                        console.error(data);
                        $('#btnNext').attr('disabled');
                        if (data.status == 500 || data.status == 510  ) {
                            var type = 'warning';
                            var title = "Warning !"
                            self.ui.progressBar.css({'background-color':'rgb(218, 146, 15)'})
                            var color = 'rgb(218, 146, 15)';
                        }
                        else {
                            var type = 'error';
                            var title = "Error !"
                            self.ui.progressBar.css({'background-color':'rgb(147, 14, 14)'})
                            var color = 'rgb(147, 14, 14)';
                            

                         }
                         if (data.responseText.length > 100) {
                         	data.responseText = 'An error occured, please contact an admninstrator';
                         }
                        swal(
                            {
                              title: title,
                              text: data.responseText,
                              type: type,
                              showCancelButton: false,
                              confirmButtonColor: color,
                              confirmButtonText: "OK",
                
                              closeOnConfirm: true,
                             
                            },
                            function(isConfirm){
                                self.ui.progress.hide();
                            }
                        );
                    });
                };

                if(file) {
                    this.clear();
                    this.ui.progress.show();
                    reader.readAsText(file);
                }
                else {
                    this.ui.fileGroup.addClass('has-error');
                    this.ui.fileHelper.text('Required');
                }
            }
            else {
                this.ui.modGroup.addClass('has-error');
                this.ui.modHelper.text('Required');
            }
        },

        clear: function() {
            this.ui.progressBar.width('0%');
            this.ui.progress.hide();
            this.ui.fileHelper.text('');
            this.ui.fileGroup.removeClass('has-error');
            this.ui.modHelper.text('');
            this.ui.modGroup.removeClass('has-error');
        },

	});
});
