define([
	'jquery',
	'marionette',
	'radio',
	'config',
	'sweetAlert',

	'tmp/getFieldActivity',
	'tmp/getItems',
	'tmp/getUsers',
	'models/station',

], function($,Marionette, Radio, config, Swal,
	getFieldActivity, getItems, getUsers, Station
){
	'use strict';
	return Marionette.ItemView.extend({
		template:  'app/modules/input/templates/tpl-station-details.html',
		events : {
			'change input[name="stAccuracy"]' : 'checkAccuracyValue',
			'change .fieldworker' : 'checkFWName',
			'change .editField' : 'updateStationData',
			'change .indivNumber' : 'updateTotalIndivNumber',
			'focusout #stPlace' : 'updateStationData',
			'click #treeViewstPlace ul li'  : 'updatePlace',
			'click #editSt-btn' :'editStation'
		},
		ui : {
			fieldActivity : 'select[name="st_FieldActivity_Name"]',
			places : 'select[name="stPlace"]',
			accuracy : 'input[name="stAccuracy"]'
		},
		onShow : function(){
			this.generateSelectLists();
			this.checkSiteNameDisplay();
			this.getUsersList();
			this.radio = Radio.channel('froms');
			this.createAutocompTree();
			//replace user id by user name
			 var fieldActivity = this.model.get('FieldActivity_Name');
			$('select[name="st_FieldActivity_Name"]').val(fieldActivity);
			var place = this.model.get('Place');
			if(place){
				$('select[name="stPlace"]').val(place);
			}
			var accuracy = this.model.get('Precision');
			$('input[name="stAccuracy"]').val(accuracy);
			var distFromObs = this.model.get('Name_DistanceFromObs');
			$('#stDistFromObs').val(distFromObs);
			this.updateUsers();
		},
		updateUsers : function(){
			for(var i=1;i<6;i++){
				var user = this.model.get('FieldWorker'+ i); 
				if(this.isInt(user)){
				$('select[name="detailsStFW' + i + '"]').val(user);
				} else {
					$('select[name="detailsStFW' + i + '"] option').each(function () {
						if ($(this).html() == user) {
							$(this).attr("selected", "selected");
							return;
						}
					});
			   }
			}
		},
		onBeforeDestroy: function() {
		},
		isInt : function (value){
		  if((parseFloat(value) == parseInt(value)) && !isNaN(value)){
			  return true;
		  } else {
			  return false;
		  }
		},
		generateSelectLists : function(){
			var fieldList = getFieldActivity.getElements('theme/list');
			$(this.ui.fieldActivity).append(fieldList);
			var placesList = getItems.getElements('station/locality');
			$(this.ui.places).append(placesList);
		},
		checkSiteNameDisplay: function(){
			// mask name site row if value is null
			var siteName = this.model.get('id_site');
			if(!siteName){
				$('#stNameSite').addClass('masqued');
			}
		},
		checkAccuracyValue : function(){
			var value = parseInt($(this.ui.accuracy).val());
		   if(value < 0 ){
				//alert('please input a valid value (>0) ');
				Swal({
					title: "Error in value",
					text: 'Please input a valid value (>0).',
					type: 'error',
					showCancelButton: false,
					confirmButtonColor: 'rgb(147, 14, 14)',
					confirmButtonText: "OK",
					closeOnConfirm: true,
				});
				$(this.ui.accuracy).val('');
		   }

		},
		getUsersList : function(){
			var content = getUsers.getElements('user');
			$(".fieldworker").each(function() {
				$(this).append(content);
			});
			// set stored values 
				for(var i=1;i<6;i++){
					var fieldworker = this.model.get('FieldWorker' + i);
				   $('select[name="detailsStFW' + i + '"]').val(fieldworker);
				}
			// set users number
			$("#stDtailsNbFW").val(this.model.get('NbFieldWorker'));
		},
		checkFWName : function(e){
			var selectedField = $(e.target);
			var fieldName = $(e.target).attr('name');
			var selectedOp = $(e.target).find(":selected")[0];
			var selectedName = $(selectedOp).val();
			var nbFW = 0;
			$(".fieldworker").each(function() {
				var selectedValue = $(this).val();
				if ($(this).attr('name') != fieldName){
					if (selectedName && (selectedValue == selectedName)){
						Swal({
							title: "Error in name value",
							text: 'This name is already selected, please select another name.',
							type: 'error',
							showCancelButton: false,
							confirmButtonColor: 'rgb(147, 14, 14)',
							confirmButtonText: "OK",
							closeOnConfirm: true,
						});
						//alert('this name is already selected, please select another name');
						$(selectedField).val('');
					} else {
						//this.updateUser();
					}
				}
				if(selectedValue){
					nbFW+=1;
				}
			});
			$("#stDtailsNbFW").val(nbFW);
			this.model.set('NbFieldWorker',parseInt(nbFW));
		},
		updateTotalIndivNumber : function(){
			var total = 0;
			$('.indivNumber').each(function(){
				var number = parseInt($(this).val());
				if(number){
					total += number;
				}
			});
			$('input[name="Nb_Total"]').val(total);
			this.model.set('NbFieldWorker',parseInt(total));
		},
		updateStationData : function(e){
			var value = $(e.target).val();
			var fieldName = $(e.target).attr('name');
			if (value){
				switch(fieldName){
					case 'stPlace':
						this.model.set('Place',value);
						break;
					case 'stAccuracy':
						this.model.set('Precision',value);
						break;
					case 'stDistance':
						this.model.set('Name_DistanceFromObs',value);
						break;
					case 'st_FieldActivity_Name':
						this.model.set('FieldActivity_Name',value);
						break;
					case 'detailsStFW1':
						this.model.set('FieldWorker1',parseInt(value));
						break;
					 case 'detailsStFW2':
						this.model.set('FieldWorker2',parseInt(value));
						break;
					case 'detailsStFW3':
						this.model.set('FieldWorker3',parseInt(value));
						break;
					case 'detailsStFW4':
						this.model.set('FieldWorker4',parseInt(value));
						break;
					case 'detailsStFW5':
						this.model.set('FieldWorker5',parseInt(value));
						break;
					case 'detailsStFWTotal':
						this.model.set('NbFieldWorker',parseInt(value));
						break;
					default:
						break;
				}
				this.radio.command('updateStation', {model: this.model});
			}
		},
		updatePlace : function(){
			var place = $('#stPlace').val();
			this.model.set('Place',place);
			this.radio.command('updateStation', {model: this.model});
		},
		createAutocompTree : function(e){
			//var startId = $(e.target).attr('startId');
			var elementsList = $('.autocompTree_st');
			for(var i=0;i<elementsList.length;i++){
				//$(e.target).autocompTree({
				var startId = parseInt($(elementsList[i]).attr('startId')) + 204081;
				// get current value
				var currentVal = $(elementsList[i]).val();
				$(elementsList[i]).autocompTree({
					wsUrl: config.serverUrl+'/ThesaurusREADServices.svc/json',
					//display: {displayValueName:'value', storedValueName: 'fullpath'},
					webservices: 'fastInitForCompleteTree',  
					language: {hasLanguage:true, lng:"en"},
					display: {
						isDisplayDifferent: true,
						suffixeId: '_value',
						displayValueName: 'value',
						storedValueName: 'value'
					},
					startId: startId 
				});
				// set current valua after applying autocompTree
				$(elementsList[i]).val(currentVal);
			}
		},
		editStation : function(){
			$( '.editField' ).each(function() {
				if($( this ).attr('disabled')){
					$( this ).removeAttr('disabled');
				} else {
					$( this ).attr('disabled','disabled');
				}
			});
		}
	});
});
