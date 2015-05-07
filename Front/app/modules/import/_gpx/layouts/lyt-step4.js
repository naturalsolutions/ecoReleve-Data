define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'config',
	'sweetAlert',

	'ns_stepper/lyt-step',
	'collections/waypoints',
	'tmp/getUsers',
	'translater'
], function($, _, Backbone, Marionette, Radio, config, Swal,
	Step, Waypoints, getUsers,Translater
){

	'use strict';

	return Step.extend({

		events : {
			'change .fiedWrk' : 'checkFWName'
		},
		importFile: function(){
			var ImportingDataAlert = this.translater.getValueFromKey('import.ImportingDataAlert');
			var loadingDataAlert = this.translater.getValueFromKey('import.loadingDataAlert');
			var importingDataWarning = this.translater.getValueFromKey('import.importingDataWarning');
			var importServerError = this.translater.getValueFromKey('import.importServerError');


			// create a new collection for models to import
			var filteredCollection  = new Waypoints(this.model.get('data_FileContent').where({import: true}));
			var fieldWorkersNumber = this.model.get(this.name + '_import-fwnb');
			var user1 = this.model.get(this.name + '_importWorker1');
			var self = this;
			filteredCollection.each(function(model) {
				//model.set('fieldActivity', self.selectedActivity);
				// get current value, if not exisits, replace it with the global val
				var currentFieldActivity = model.get('fieldActivity');
				/*if(!currentFieldActivity ) {
					currentFieldActivity = self.model.get(self.name + '_importFieldActivity');
				}*/
				model.set('fieldWorker1', user1);
				model.set('fieldWorker2', self.model.get(self.name + '_importWorker2'));
				model.set('fieldWorker3', self.model.get(self.name + '_importWorker3'));
				model.set('fieldWorker4', self.model.get(self.name + '_importWorker4'));
				model.set('fieldWorker5', self.model.get(self.name + '_importWorker5'));
				model.set('fieldActivity',currentFieldActivity);
				model.set('Precision', 10);
				model.set('fieldWorkersNumber', fieldWorkersNumber);
			});
			// send filtred collection to the server
			var url=config.coreUrl + 'station/addMultStation/insert';
			var result = false; 
			$.ajax({
				url:url,
				context:this,
				type:'POST',
				data: JSON.stringify(filteredCollection.models),
				dataType:'json',
				async: false,
				success: function(resp){
					var typeAlert = 'success';
					var storedCollection = new Waypoints();
					storedCollection.fetch();
					storedCollection.reset(resp.data);
					storedCollection.save();
					var msg = resp.response;
					var message = resp.response;
					var nb = msg.substring(0,1);
					if(nb =="0"){
						message = importingDataWarning;
						typeAlert ='warning';
					}
					this.model.set('ajax_msg', msg) ; 
					result = true; 
					Swal({
						title: ImportingDataAlert,
						text: message,
						type: typeAlert,
						showCancelButton: false,
						confirmButtonColor: 'green',
						confirmButtonText: "OK",
						closeOnConfirm: true,
					},
						function(isConfirm){
							Radio.channel('route').command('home');
					});
					//$('#btnNext').removeClass('masqued');
				},
				error: function(data){
					Swal({
						title: loadingDataAlert,
						text: importServerError,
						type: 'error',
						showCancelButton: false,
						confirmButtonColor: 'rgb(147, 14, 14)',
						confirmButtonText: "OK",
						closeOnConfirm: true
					});
				}
			});
			return false;
		},
		onShow: function(){
			this.getUsersList();
			this.translater = Translater.getTranslater();
            this.$el.i18n();
		},
		generateDatalist : function(data){
			var UsersList = '';
			data.forEach(function(user) {
				//value="' + user.PK_id +'"
				UsersList += '<option>' + user.fullname + '</option>';
			});
			$('#import-worker1').append(UsersList);
		},
		checkFWName : function(e){
			var fieldWorkerNameErr = this.translater.getValueFromKey('import.fieldWorkerNameErr');
			var fieldWorkerNameErrMsg = this.translater.getValueFromKey('import.fieldWorkerNameErrMsg');
			
			var selectedField = $(e.target);
			var fieldName = $(e.target).attr('name');
			var selectedOp = $(e.target).find(":selected")[0];
			var selectedName = $(selectedOp).val();
			var nbFW = 0;
			$(".fiedWrk").each(function() {
				var selectedValue = $(this).val();
				if ($(this).attr('name') != fieldName){
					if (selectedName && (selectedValue == selectedName)){
						Swal({
							title: fieldWorkerNameErr,
							text: fieldWorkerNameErrMsg,
							type: 'error',
							showCancelButton: false,
							confirmButtonColor: 'rgb(147, 14, 14)',
							confirmButtonText: "OK",
							closeOnConfirm: true,
						});

						$(selectedField).val('');
					}
				}
				if(selectedValue){
					nbFW+=1;
				}
			});
			// update totalNbFieldworkers
			$('#import-fwnb').val(nbFW);
		},
		getUsersList : function(){
			var content = getUsers.getElements('user');
			$(".fiedWrk").each(function() {
				$(this).append(content);
			});
		},
		nextOK: function(){
			var returnVal = this.importFile();
			return returnVal;
		}
	});

});
