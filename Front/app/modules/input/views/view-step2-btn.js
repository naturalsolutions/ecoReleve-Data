define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'i18n'
], function($, _, Backbone, Marionette){
	'use strict';
	return Marionette.ItemView.extend({
		className: 'inputBtnView',
		template: 'app/modules/input/templates/tpl-usersBtn.html',
		events : {
			'click  #addUser-btn' : 'addUser',
			'click  #removeUser-btn' : 'removeUser',
			'click #geolocation-btn' : 'getCurrentPosition'
		},
		 ui: {
            add: '#addUser-btn',
            remove : '#removeUser-btn'
        },
		initialize: function(options) {
			this.filterView = options.filterView ; 
		},
		addUser : function(){
			var nbelements = this.filterView.$el.find('.fieldworker.masqued').length;

			if (nbelements == 1){
				// mask add users btn
				$(this.ui.add).addClass('masqued');
			} else {
				$(this.ui.remove).removeClass('masqued');
			}
			var ele = this.filterView.$el.find('.fieldworker.masqued').first();
			$(ele).removeClass('masqued');
			$(ele).addClass('visible');
		},
		removeUser : function(){
			var nbelements = this.filterView.$el.find('.fieldworker.visible').length;
			if (nbelements == 1){
				// mask add users btn
				$(this.ui.remove).addClass('masqued');
			} else {
				$(this.ui.add).removeClass('masqued');
			}
			var ele = this.filterView.$el.find('.fieldworker.visible').last();
			$(ele).find('select').first().val('-1');
			$(ele).addClass('masqued');
			$(ele).removeClass('visible');
		},
		getCurrentPosition : function(){
			var self = this;
			if(navigator.geolocation) {
				var loc = navigator.geolocation.getCurrentPosition(function(position) { self.myPosition(position,self) },self.erreurPosition);
			} else {
				alert("Ce navigateur ne supporte pas la géolocalisation");
				/*Swal(
					{
						title: "Wrong file type",
						text: 'The browser dont support geolocalization API',
						type: 'error',
						showCancelButton: false,
						confirmButtonColor: 'rgb(147, 14, 14)',
						confirmButtonText: "OK",

						closeOnConfirm: true,
						
				 });*/
			}
		},
		myPosition : function(position,self){
			var latitude = parseFloat((position.coords.latitude).toFixed(5));
			var longitude = parseFloat((position.coords.longitude).toFixed(5));
			self.filterView.map.addMarker(false, latitude, longitude );
			$('input[name="LAT"]').val(latitude);
			$('input[name="LON"]').val(longitude);
		},
		erreurPosition : function(error){
			var info = "Erreur lors de la géolocalisation : ";
			switch(error.code) {
			case error.TIMEOUT:
				info += "Timeout !";
			break;
			case error.PERMISSION_DENIED:
			info += "Vous n’avez pas donné la permission";
			break;
			case error.POSITION_UNAVAILABLE:
				info += "La position n’a pu être déterminée";
			break;
			case error.UNKNOWN_ERROR:
			info += "Erreur inconnue";
			break;
			}
			alert(info);
		}
	});
});
