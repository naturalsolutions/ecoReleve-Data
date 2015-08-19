define([
	'jquery',
	'marionette',
	'radio',
	'config',
	'sweetAlert',

	// 'tmp/getFieldActivity',
	// 'tmp/getItems',
	// 'tmp/getUsers',
	// 'models/station',
	'ns_form/NSFormsModuleGit',
	'i18n'

], function($,Marionette, Radio, config, Swal, NsFormsModule
	//getFieldActivity, getItems, getUsers, Station
){
	'use strict';
	return Marionette.ItemView.extend({
		template:  'app/modules/input/templates/tpl-step3-station-details.html',
		events : {

		},
		ui : {

		},


		onShow: function(){
			this.stationType = this.options.stationType;
			this.stationId = this.options.stationId;
			this.parent = this.options.parent;

			var _this = this;

			
			this.nsForm = new NsFormsModule({
				name: 'StaForm',
				modelurl: config.coreUrl+'stations/',
				buttonRegion: ['stationFormBtns'],
				formRegion: 'stationForm',
				displayMode: 'display',
				objecttype: _this.stationType,
				id: _this.stationId,
				reloadAfterSave : true,
			});

			this.nsForm.savingSuccess = function(){
				_this.parent.protos.fetch({reset: true});
			};
		},


	});
});
