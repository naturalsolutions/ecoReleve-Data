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

		className: 'full-height white',

		template: 'app/modules/stations/templates/tpl-station-new.html',
		events : {
			'focusout input[name="Dat e_"]':'checkDate',
			'keyup input[name="LAT"], input[name="LON"]' : 'getLatLng',
			'click #getCurrentPosition' : 'getCurrentPosition',
			'click .tab-link' : 'displayTab',
			'change select[name="FieldWorker"]' : 'checkUsers',
			'click button#save' : 'save'
		},

		name : 'Station creation',

		ui: {
			'staForm' : '#staForm',
			'saveBtn' : 'button#save'
		},


		initialize: function(options){
		},


		onShow : function(){
			this.refrechView('#stWithCoords');
			this.map = new NsMap({
				popup: true,
				zoom : 2,
				element: 'map',
			});
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
						_this.$el.find('input[name="LAT"]').val(lat).change();
						_this.$el.find('input[name="LON"]').val(lon).change();
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
			switch(stationType){
				case '#stWithCoords':
					stTypeId = 1;
					$('#getCurrentPosition').removeClass('hidden');
					break;
				case '#stWithoutCoords':
					stTypeId = 3;
					$('#getCurrentPosition').addClass('hidden');
					break;
				case '#stFromMS':
					stTypeId = 4;
					$('#getCurrentPosition').removeClass('hidden');
				default:
					break;
			}

			if(this.nsForm){
				this.nsForm.destroy();
			}
			
			this.ui.staForm.empty();

			this.nsForm = new NsForm({
				name: 'StaForm',
				modelurl: config.coreUrl+'stations/',
				buttonRegion: [],
				formRegion: this.ui.staForm,
				displayMode: 'edit',
				objectType: stTypeId,
				id: 0,
				afterShow : function(){
					$("#dateTimePicker").on("dp.change", function (e) {
            $('#dateTimePicker').data("DateTimePicker").maxDate(e.date);
        });
				}
			});

			this.nsForm.savingSuccess =  function(model, resp){
				_this.afterSave(model, resp);
			}
			
			this.rdy = this.nsForm.jqxhr;
		},

		afterSave: function(model, resp){
			var id = model.get('ID');
			Backbone.history.navigate('#stations/' + id, {trigger: true});
		},

		save: function(){
			this.nsForm.butClickSave();
		},

	});
});
