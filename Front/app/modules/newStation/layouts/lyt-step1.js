define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',

	'moment',
	'dateTimePicker',
	'sweetAlert',
	'config',


	'ns_form/NSFormsModuleGit',
	'ns_map/ns_map',

	'i18n'


], function($, _, Backbone, Marionette, Radio,
	moment, datetime, Swal, config, NsForm, NsMap
){

	'use strict';

	return Marionette.LayoutView.extend({

		className: 'full-height', 

		template: 'app/modules/newStation/templates/tpl-step1.html',
		events : {
			'focusout input[name="Date_"]':'checkDate',
			'change input[name="LAT"]' : 'getCoordinates',
			'change input[name="LON"]' : 'getCoordinates',
			'click #getPosition' : 'getCurrentPosition',
			'focusout input[name="Date_"]':'checkDate',
		},

		initialize: function(options) {

		},

		onShow : function(){
			/*
			this.nsform = new NsForm({
				name: 'StaForm',
				modelurl: config.coreUrl+'stations/',
				buttonRegion: [],
				formRegion: 'StaForm',
				displayMode: 'edit',
				objecttype: 1,
				id: 0,
				reloadAfterSave : false,
				parent: this.parent
			});*/


			this.map = new NsMap({
				popup: true,
				zoom : 2,
				element: 'map',
			});
			//this.map.addMarker(false, 33.06, -3.96);

		},


		onDestroy: function(){
			delete this.map;
			//this.nsform.unbind();
		}

	});
});
