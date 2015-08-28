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

		template: 'app/modules/stations/new/templates/tpl-station-new.html',
		events : {
			'focusout input[name="Dat e_"]':'checkDate',
			'keyup input[name="LAT"], input[name="LON"]' : 'getLatLng',
			'click #getCurrentPosition' : 'getCurrentPosition',
		},

		name : 'Station creation',


		initialize: function(){
		},

		check: function(){
			if(this.nsForm.BBForm.commit()){
				return false;
			}else{
				return true;
			}
		},

		validate: function(){
			this.model = this.nsForm.model;
			return this.nsForm.butClickSave();
		},


		onShow : function(){
			this.nsForm = new NsForm({
				name: 'StaForm',
				modelurl: config.coreUrl+'stations/',
				buttonRegion: [],
				formRegion: 'StaForm',
				displayMode: 'edit',
				objecttype: 1,
				id: 0,
				reloadAfterSave : false,
			});
			this.map = new NsMap({
				popup: true,
				zoom : 2,
				element: 'map',
			});
			this.rdy = this.nsForm.jqxhr;
		},

		onDestroy: function(){
			this.map.destroy();
			this.nsForm.unbind();
		},

		getCurrentPosition : function(){
			var _this = this;
			if(navigator.geolocation) {
				var loc = navigator.geolocation.getCurrentPosition( function(position){
						var lat = parseFloat((position.coords.latitude).toFixed(5));
						var lon = parseFloat((position.coords.longitude).toFixed(5));
						_this.updateMarkerPos(lat, lon);
						_this.$el.find('input[name="LAT"]').val(lat);
						_this.$el.find('input[name="LON"]').val(lon);
				});
			} else {
				Swal({
					title: 'The browser dont support geolocalization API',
					text: '',
					type: 'error',
					showCancelButton: false,
					confirmButtonColor: 'rgb(147, 14, 14)',
					confirmButtonText: 'OK',
					closeOnConfirm: true,
				});
			}

		},

		getLatLng: function(){
			var lat = this.$el.find('input[name="LAT"]').val();
			var lon = this.$el.find('input[name="LON"]').val();
			this.updateMarkerPos(lat, lon);
		},

		updateMarkerPos: function(lat, lon){
			if(lat && lon){
				this.map.addMarker(null, lat, lon);
			}
		},

	});
});
