define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',

	'moment',
	'dateTimePicker',
	'sweetAlert',
	'backbone_forms',
	'config',

	'tmp/getUsers',
	'tmp/getFieldActivity',
	'tmp/getRegions',
	'models/station',

	'ns_form/NSFormsModuleGit',
	'ns_map/ns_map',

	'i18n'


], function($, _, Backbone, Marionette, Radio,
	moment, datetime, Swal, BbForms, config,
	getUsers, getFieldActivity, getRegions,
	Station, NsForm, NsMap
){

	'use strict';

	return Marionette.ItemView.extend({

		template: 'app/modules/input/views/templates/tpl-step2-new.html',
		events : {
			'focusout input[name="Date_"]':'checkDate',
			'change input[name="LAT"]' : 'getCoordinates',
			'change input[name="LON"]' : 'getCoordinates',
			'click #getPosition' : 'getCurrentPosition',
			'focusout input[name="Date_"]':'checkDate',
		},


		initialize: function(options) {
			this.parent = options.parent;
			this.type = options.type;
			this.parent.ajax = false;

			var NSFormCustom = NsForm.extend({
				onSavingModel: function () {
					if (_this.type) {
						this.model.set('FK_StationType',_this.type) ;
					}
				},
				afterShow: function(){
					//init model once form tpl is loaded
					_this.parent.initModel(this.BBForm.el);
					_this.parent.parent.check();
				},
				savingSuccess: function (model, response) {

					_this.parent.ajax = true;
					if(!_this.parent.model.get('station')){
						_this.parent.model.set('station', response.id);
					}
					_this.parent.parent.nextStepWithoutCheck();
				},
				savingError: function (model, response) {
					console.error('error saving the station');
				},
			});

			var _this = this;
			var id;
			if(this.parent.model.get('station')){
				id = this.parent.model.get('station');
			}else{
				id = 0;
			}

			this.nsform = new NSFormCustom({
				name: 'StaForm',
				modelurl: config.coreUrl+'stations/',
				buttonRegion: [],
				formRegion: 'StaForm',
				displayMode: 'edit',
				objecttype: this.type,
				id: id,
				reloadAfterSave : false,
				parent: this.parent
			});

			

			// TODO : fix
			this.parent.on('ns_modules__step_nextOk', function(){
				_this.nsform.butClickSave();
			});
		},

		onShow : function(){

			$('#inputStRight').html('<div id="map"></div>');
			this.map = new NsMap({
				popup: true,
				zoom : 8,
				element: 'map',
			});
			this.map.init();
			this.map.addMarker(false, 33.06, -3.96);
			
		},
		/*
		checkDate: function(){
			var siteType = $('#stMonitoredSiteType');
			var siteName = $('#stMonitoredSiteName');
			var datefield = $("input[name='StationDate']");
			var date = $(datefield).val();
			var date = moment($(datefield).val(),"DD/MM/YYYY HH:mm:ss"); //28/01/2015 15:02:28
			var now = moment();
			if (now < date) {
				//alert('Please input a valid date');
				Swal({
				title: "Error in date value",
				text: 'Please input a valid date.',
				type: 'error',
				showCancelButton: false,
				confirmButtonColor: 'rgb(147, 14, 14)',
				confirmButtonText: "OK",
				closeOnConfirm: true,
				});
				$(datefield).val('');
				$(siteType).attr('disabled','disabled');
				$(siteName).attr('disabled','disabled');
			} else {
				if(date){
					$(siteType).removeAttr('disabled');
					$(siteName).removeAttr('disabled');
				}
				//this.radio.command('changeDate');
			}
		},

		getCurrentPosition : function(){
			if(navigator.geolocation) {
				var loc = navigator.geolocation.getCurrentPosition(this.myPosition,this.erreurPosition);
			} else {
				Swal(
					{
						title: "Wrong file type",
						text: 'The browser dont support geolocalization API',
						type: 'error',
						showCancelButton: false,
						confirmButtonColor: 'rgb(147, 14, 14)',
						confirmButtonText: "OK",
						closeOnConfirm: true,
				 });
			}
		},

		myPosition : function(position){
			var latitude = parseFloat((position.coords.latitude).toFixed(5));
			var longitude = parseFloat((position.coords.longitude).toFixed(5));
			// update map
			var pos = new Position();
			pos.set("latitude",latitude);
			pos.set("longitude",longitude);
			pos.set("label","current station");
			pos.set("id","_");
			this.movePoint(pos);
		},

		movePoint : function(position){
			var latitude  =position.get("latitude");
			var longitude = position.get("longitude");
			this.map.addMarker(false, latitude, longitude );
		},
	*/
	});
});
