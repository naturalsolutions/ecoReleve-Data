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
			'click .tab-link' : 'displayTab',
			'change select[name="FieldWorker"]' : 'checkUsers'
		},

		name : 'Station creation',

		ui: {
			'staForm' : '#staForm',
			'StaFormCoords' : '#staFormCoords'
		},


		initialize: function(options){
			this.parent = options.parent;
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
			/*this.nsForm = new NsForm({
				name: 'StaForm',
				modelurl: config.coreUrl+'stations/',
				buttonRegion: [],
				formRegion: this.ui.staForm,
				displayMode: 'edit',
				objectType: 1,
				id: 0,
				reloadAfterSave : false,
			});
			this.map = new NsMap({
				popup: true,
				zoom : 2,
				element: 'map',
			});
			this.rdy = this.nsForm.jqxhr;*/
			this.refrechView('#stWithCoords');
			this.map = new NsMap({
				popup: true,
				zoom : 2,
				element: 'map',
			});
			//this.rdy = this.nsForm.jqxhr;
		},

		onDestroy: function(){
			this.map.destroy();
			this.nsForm.destroy();
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
		displayTab : function(e){
			e.preventDefault();
			var ele = $(e.target);
			var tabLink = $(ele).attr('href');
			$('.tab-ele').removeClass('active');
			$(ele).parent().addClass('active');
			$(tabLink).addClass('active in');
			this.refrechView(tabLink);
		},
		refrechView : function(stationType){
			var stTypeId;
			var _this = this;
			var formContainer= this.ui.StaFormCoords;
			switch(stationType){
				case '#stWithCoords':
					stTypeId = 1;
					formContainer =this.ui.StaFormCoords;
					$(this.ui.staForm).empty();
					break;
				case '#stWithoutCoords':
					stTypeId = 3;
					formContainer =this.ui.staForm;
					$(this.ui.StaFormCoords).empty();
					break;	
				default:
					break;
			}
			if(this.nsForm){
				this.nsForm.destroy();
				console.log('*********** parent stepper***********');
				//console.log(this.parent);
				this.parent.unbindRequiredFields();
				this.parent.disableNextBtn();
			}
			this.nsForm = new NsForm({
				name: 'StaForm',
				modelurl: config.coreUrl+'stations/',
				buttonRegion: [],
				formRegion: formContainer,
				displayMode: 'edit',
				objectType: stTypeId,
				id: 0,
				reloadAfterSave : false,
				afterShow: function(){
					console.log('********affichage form************');
					_this.parent.bindRequiredFields();
				}
			});
			
			this.rdy = this.nsForm.jqxhr;

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
				
			} 
		}
	});
});
