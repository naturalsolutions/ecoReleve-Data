define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'config',
	'swiper',
	'sweetAlert',
	
	'simplePagination',


	'ns_stepper/lyt-step',


	'ns_form/NSFormsModuleGit',


	'../views/view-step3-station-details',

	// 'tmp/getProtocolsList',
	// 'tmp/getUsers',

	// 'models/station',
	'translater'

], function($, _, Backbone, Marionette, Radio, config, Swiper,
	Swal, simplePagination,
	Step, NsFormsModule,
	ViewStationDetail,
	/*
	getProtocolsList, getUsers,
	*/
	Station, Translater
){

	'use strict';

	return Step.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/
		events : {
		},


		regions: {
			rgStation: '#rgStation',
			rgProtos : '#rgProtos'
		},


		ui: {
			accordion : '#accordion'
		},



		/*
		ui:{
			addProto : 'select[name="add-protocol"]',
			 protosList : '#tabProtsUl'
		},*/

		initModel: function(myTpl){
			//this.parseOneTpl(this.template);
			this.activeProtcolsObj = []; 
			this.protosToRemove = [];
		},





		onShow: function(){

			var stationType = this.model.get('start_stationtype');
			this.stationId = this.model.get('station');

			this.stationId = 1;
			
			this.rgStation.show(new ViewStationDetail({
				stationId: this.stationId,
				stationType: stationType
			}));

			var jqxhr = $.ajax({
				url: config.coreUrl+'stations/'+this.stationId+'/protocols',
				method: 'GET',
				context: this,
				data : {
					FormName: 'ObsForm',
					DisplayMode : 'display'
				},
				contentType:'application/json'
			})
			.done(function(resp) {
				this.displayProtos(resp);
			})
			.fail(function(resp) {
				console.log(resp);
			});


			/*
			this.$el.i18n();
			this.translater = Translater.getTranslater();
			*/
		},

		displayProtos: function(protos){
			var first = true;
			for(var name in protos){

				var count = protos[name].length;
				var type = name.replace(/ /g,'');
				var collapseBody = ''; var collapseTitle = 'collapsed';
				if(first){collapseBody='in'; collapseTitle = '';}
				first=false;

				var tpl = Marionette.Renderer.render('app/modules/input/templates/tpl-accordion.html', {
						name : name,
						type : type,
						count: count,
						collapseBody : collapseBody,
						collapseTitle : collapseTitle
				});
				this.ui.accordion.append(tpl);
				this.displayObs(protos[name], type);

			}
		},

		displayObs: function(obs, type){
			
			for (var i = 0; i < obs.length; i++) {

				var key = type+i;

				var classes;
				(i==0)? classes="" : classes = "hidden";

				this.ui.accordion.find('#'+type+'Collapse > .panel-body').append('<div id="page'+type+i+'" class="'+classes+'"> <div id="'+key+'"></div><div id="stationFormBtns'+key+'"></div></div>');


				var Md = Backbone.Model.extend({
					schema : obs[i].schema,
					fieldsets: obs[i].fieldsets,
				});

				var model = new Md(obs[i].data);

				var mode = 'edit';
				if(model.get('id') > 0){
					mode = 'display';
				}

				model.urlRoot = config.coreUrl+'stations/'+this.stationId+'/protocols/';

				this.nsform = new NsFormsModule({
					name: type,
					unique : i,
					model: model,
					id : model.get('id'),
					modelurl : config.coreUrl+'stations/'+this.stationId+'/protocols/',
					buttonRegion: ['stationFormBtns'+key],
					formRegion: key,
					displayMode: mode,
					reloadAfterSave : false,
				});

				this.paginateObs(obs.length, type);
			}

		},

		paginateObs: function(nsObs, type){
				var _this = this;
				var current = _this.ui.accordion.find('#page'+type+'0');
				this.ui.accordion.find('#'+type+'Pagination').pagination({
					items: nsObs,
					cssStyle: 'light-theme',
					hrefTextPrefix: '',
					onPageClick: function(pageNumber){
						current.addClass('hidden');
						current = _this.ui.accordion.find('#page'+type+(pageNumber-1)); 
						current.removeClass('hidden');
					},
				});
		},























		updateForm : function(e,element){
			var selectedProtoName;
			if(!element){
				selectedProtoName = $(e.target).attr('name');
			}
			else {
				selectedProtoName = $(element).attr('name');
			}
			// check if we have only one instance or not of selected proto
			this.selectedProtoName = selectedProtoName;
			this.updateInstanceDetails(selectedProtoName);
		},
		updateInstanceDetails : function(protoName){
			for(var key in this.activeProtcolsObj) {
				if(key == protoName){
					var pk_list = this.activeProtcolsObj[key].PK_data;
					var nbProtoInstances = pk_list.length;
					if(nbProtoInstances==1){
						var idProto = pk_list[0];
						$('#formsIdList ul').html('');
						this.getProtocol(protoName,idProto);
						this.selectedProtoId = idProto;   
						$('#idProtosContainer').addClass('hidden');
					} else {
						this.genInterfaceForCurrentProto(pk_list,protoName );
						$('#idProtosContainer').removeClass('hidden');
					}
				}
			}
		},
		getProtocolsList : function(idStation){
			var url= config.coreUrl + 'station/'+ idStation + '/protocol';  
			var listElement = $(this.ui.protosList);
			$.ajax({
				url:url,
				context:this,
				type:'GET',
				success: function(data){
					if(!_.isEmpty(data)){
						this.activeProtcolsObj = data;
						this.generateNavBarProtos();
					}
					else {
						//$('#protosListContainer').text('');
						$('#tabProtsUl').text('');
						this.formsRegion.empty();
						// bug, empty method dont work
						$('#formsContainer').html('');
						this.activeProtcolsObj = {};
						$('#NsFormButton').addClass('hidden');
					}
				},
				error: function(data){
					//alert('error in loading protocols');
					Swal({
						title: "Error in loading protocols",
						//text: 'Please input a valid value (>0).',
						type: 'error',
						showCancelButton: false,
						confirmButtonColor: 'rgb(147, 14, 14)',
						confirmButtonText: "OK",
						closeOnConfirm: true,
					});
				}
			}).done(function(data){
				if(!_.isEmpty(data)){
					var element = $(listElement).find('div.swiper-slide:first a');
					this.updateForm(null, element );
					$(listElement).find('div.swiper-slide').removeClass('swiper-slide-active');
					$(listElement).find('div.swiper-slide:first').addClass('swiper-slide-active');
					$('.swiper-slide-active').find('.onglet').addClass('active');
					// update protocols that we can add by integrating unicity constraints
					// (if protocol can be used only 1 time and its already inserted, we remove it from list)
				}
			});
		},
		getProtocol: function(protoName, id){
			var idProto = protoName.replace(/ /g,"_");
			this.formsRegion.empty();
			$('#formsContainer').text('');
			var url= config.coreUrl +'station/'+ this.idStation + '/protocol/' + protoName + '/' + id ;
			// extend NsForms Module to replace thesaurus fields values by 'fullpath' values stored in hidden fields
			var NsForm = NsFormsModule.extend({
				butClickSave: function (e) {
					var errors = this.BBForm.commit();
					var changedAttr = this.BBForm.model.changed;
					if(!errors){  
						var self = this;   
						//replace thesaurus fields values by 'fullpath' values stored in hidden fields
						$('input.autocompTree').each(function() {
							// get fullpath value 
							var fieldName = $(this).attr('name');
							var hiddenFieldName = fieldName + '_value';
							var fullpathValue = $('input[name="' + hiddenFieldName + '"]').val();
							self.model.set(fieldName,fullpathValue);
						});
						
						var staId = this.model.get('FK_TSta_ID');
						if(staId){
							this.model.set('FK_TSta_ID', parseInt(staId));
						}
						for (var attr in this.model.attributes) {
							var val = this.model.get(attr);
							if (Array.isArray(val) ){
								if (val[0] == 'true' && val.length == 0)
									this.model.set(attr,1)
							}
						}
						var self = this;
						this.model.save([],{
						dataType:"text",
						success:function(model, response) {
							self.displayMode = 'display';
							self.displaybuttons();
							self.radio.command('successCommitForm', {id: response});
							// update this.modelurl  if we create a new instance of protocol
							var tab = self.modelurl.split('/');
							var ln = tab.length;
							var newId = parseInt(response);
							var currentProtoId = parseInt(tab[ln - 1]);
							if (currentProtoId ===0){
								var url ='';
								for (var i=0; i<(ln -1);i++){
									url += tab[i] +'/';
								}
								self.modelurl = url + newId;
							}
						 },
						error:function(request, status, error) {
							//alert('error in saving data');
							Swal({
								title: "Error in saving data",
								//text: 'Please input a valid value (>0).',
								type: 'error',
								showCancelButton: false,
								confirmButtonColor: 'rgb(147, 14, 14)',
								confirmButtonText: "OK",
								closeOnConfirm: true,
							});
						 }
						});
					}
				}
			});
			this.formView = new NsForm({
				modelurl : url,
				formRegion :'formsContainer',
				buttonRegion : 'formButtons',
				stationId : this.idStation,
				id : idProto
			});

		},
		getProtocols : function(){
			// server call
			/*var protocols  = getProtocolsList.getElements('protocols/list');
			$('select[name="add-protocol"]').append(protocols);*/
			// load protocols from json 
			// TODO : update file ...
			var self = this;
			$.getJSON( './app/modules/input/data/protocols_summary.json', function(data) {
				// object to store protocols properties (id, name, relations)
				var html = [];
				self.protosToAdd = [];
				self.protocolsSummary  = data;
				self.uniqProtoInstances = []; // used to have protocols that can be instanciated only 1 time per station
				for (var i=0;i<data.length;i++){
					var protocolLabel = data[i].label;
					//html.push('<option>' + protocolLabel +'</option>');
					self.protosToAdd.push(protocolLabel);
					if(data[i].isOneInstance =="true"){
						self.uniqProtoInstances.push(protocolLabel);
					}
				}
				//html.sort();
				//var content = html.join('');
				self.generateSelectProtoContent(self.protosToAdd);
				//$(self.ui.addProto).append(content);
			});
		},
		generateSelectProtoContent: function(list, listToRemove){
			// get difference between arrays
			var diff = [];
			if(listToRemove){
				var diff = $(list).not(listToRemove).get();
			} else {
				diff = list;
			}
			diff.sort();
			var html = '<option></option>';
			for (var i=0;i<diff.length;i++){
				html += '<option>' + diff[i]+ '</option>';
			}
		   $(this.ui.addProto).html(html);
		},
		generateNavBarProtos : function(){
			// generate interface with list content
			$('.pagination.protocol').html('');
			var htmlContent ='';

			if(_.isEmpty(this.activeProtcolsObj)){
				 this.formsRegion.empty();
				$('#formsContainer').html('');
				$('#NsFormButton').addClass('hidden');

			} else {
				$('#NsFormButton').removeClass('hidden');
			}
				for(var key in this.activeProtcolsObj) {
						var nbProtoInstances = this.activeProtcolsObj[key].PK_data.length;
						htmlContent +=  '<div class="swiper-slide"><div class="onglet"><a name="'+ key ;
						htmlContent += '"><span><i></i></span>' + key ;
						if(nbProtoInstances > 1){
							htmlContent += '<span class="badge">' + nbProtoInstances + '</span>';
						}
						else {
							// one instance, check if it is new instance to add del btn
							var protoId = this.activeProtcolsObj[key].PK_data[0];
							if(protoId == 0){
								htmlContent += '<i class="glyphicon glyphicon-remove deleteProt"></i>';
							}
						}
						htmlContent += '</a></div></div>';
						// update list of protocols that we cant re-use for current station
						this.updateAddProtocolsList(key, this.uniqProtoInstances);
				 }
				// remove duplicated elements from tab
				this.protosToRemove = this.cleanArray(this.protosToRemove);
				 // update select control content to remove uniq instances protocols added to UI
				this.generateSelectProtoContent(this.protosToAdd,this.protosToRemove);
				//$(this.ui.protosList).html('');
				$(this.ui.protosList).html(htmlContent);
				





				this.swiper = new Swiper('.swiper-container', {
					spaceBetween: 30,
					slidesPerView: 2,
					simulateTouch: false,
					mousewheelControl: true,
				});

				var _this = this;

				$('#proto_name-left').on('click', function(e){
					e.preventDefault();
					_this.swiper.slidePrev();
				});
				$('#proto_name-right').on('click', function(e){
					e.preventDefault();
					_this.swiper.slideNext();
				});

				// activate first protocol display in active protocols obj
				var firstProtoName, firstProtoId;  
				for (var key in this.activeProtcolsObj) {
					firstProtoName = key;
					firstProtoId = this.activeProtcolsObj[key].PK_data[0];

					this.getProtocol(firstProtoName,firstProtoId)
					// to exit 
					return false;
				}
		},
		updateAddProtocolsList : function(protoName, singleProtos){

			for(var i=0;i<singleProtos.length;i++){
				if(singleProtos[i] == protoName){
					this.protosToRemove.push(protoName);
					return;
				}
			}
		},
		addForm : function(){
			var selectedProtocolName = $(this.ui.addProto).val();
			if(selectedProtocolName){
				var exists = false;
				for(var key in this.activeProtcolsObj) {
					if(key == selectedProtocolName){
						exists = true;
						// a new instance of protocol have id = 0
						this.activeProtcolsObj[key].PK_data.push(0);
					} 
				}
				if (!exists){
					var protoObj = {};
					protoObj.PK_data = [0];
					this.activeProtcolsObj[selectedProtocolName] = protoObj;
				}
				// refrech view
				this.generateNavBarProtos();
				// if form to add == active protocol => update current proto instances UI
				if(selectedProtocolName == this.selectedProtoName){
					this.updateInstanceDetails(selectedProtocolName);
				}
			}
		},
		genInterfaceForCurrentProto: function(pkList, protocolName){
			this.formsRegion.empty();
			
			$('#formsContainer').text('');
			$('#idProtosContainer .pagination').text('');

			var content =''; 
			var nbInstances = pkList.length;
			for(var i=0;i<nbInstances;i++){
				var idProto = pkList[i];



				content +=  '<div class="swiper-slide"><div class="onglet"><a class="pkProtocol" idProto="'+
							 idProto +'" name ="'+ protocolName+ '">' + (i+1) ;

				if(idProto == 0){
					content += '<i class="glyphicon glyphicon-remove deleteProInstance"></i>';
				}

				content += '</a></div></div>';




			}
			$('#formsIdList').html('');
			//$('#idProtosContainer').append('<div id="simplePage"></div>');
			this.pkList = pkList;
			var self = this;
			$('#formsIdList').pagination({
				//items: nbInstances,
				itemsOnPage: 5,
				pages :nbInstances, 
				cssStyle: 'light-theme',
				hrefTextPrefix: '',
				currentPage: 1,
				 onPageClick: function(pageNumber, event){
					event.preventDefault();
					self.getProtoByPkId(pageNumber);
				}
			});
			this.getProtoByPkId(1);
		},
		getProtoByPkId : function(id){
			if(id || id===0){
				var tmp = this.pkList[id-1];
				this.getProtocol(this.selectedProtoName, tmp);
				// store pkId to save proto
				this.selectedProtoId = tmp;
			}
		},
		nextStation : function(){
			var currentStation = this.model.get('station_position');
			var currentStationId = currentStation.get('PK');
			var oldstations = this.model.get('oldStations');
			if(oldstations){
				this.getNextInCollection(oldstations, currentStationId,'prev');
			}else{
				
				var url= config.coreUrl + 'station/'+ currentStationId + '/next';
				this.getStationDetails(url);
			}
		},
		prevStation:function(){
			var currentStation = this.model.get('station_position');
			var currentStationId = currentStation.get('PK');
			var oldstations = this.model.get('oldStations');
			if(oldstations){
				this.getNextInCollection(oldstations, currentStationId,'next');
			}else{
				var url= config.coreUrl + 'station/'+ currentStationId  + '/prev';
				this.getStationDetails(url);
			}
			//$(this.ui.addProto).val('');
		},
		getNextInCollection : function(collection, stId, order){
			var navigationMsg = this.translater.getValueFromKey('input.stationNavigationAlert'),
			updateStationAlertTitle = this.translater.getValueFromKey('input.stationNavigationTitle'),
			updateStationErr = this.translater.getValueFromKey('shared.alertMsg.errorLoadingStation');

			//get order of current model in station to select next one
			var newId, increment = 1 ;
			var self = this;
			var url= config.coreUrl + 'station/';
			if(order=='prev'){increment = -1;}
			var ln = collection.length;
			var currentOrderVal;
			if (ln == 1){
				//alert('You don\'t have next or prev record');
				this.sweetAlert('navigation','warning',navigationMsg);
			} else {
				for (var i=0;i<ln; i++){
					if(collection.models[i].get('PK') == stId){
						currentOrderVal = i;
						break;
					}
				}
			}
		   
			if (((order =='next') && (currentOrderVal < (ln -1))) || ((order =='prev') && (currentOrderVal >0))){
				var nextPkId = collection.models[currentOrderVal + increment].get('PK');
				url += nextPkId;
				self.getStationDetails(url);
			} else {
				// fetch collection with nex page if possible, we need to check pages number, current page if it not the last one
				var currentPage =  collection.state.currentPage;
				var lastPage = collection.state.lastPage;
				var firstPage = collection.state.firstPage
				 // for next
				if (((order=='next') && (currentPage == lastPage)) || ((order=='prev') && (currentPage == firstPage))) {
					this.sweetAlert('navigation','warning',navigationMsg);
				}
				else {
					// 
					collection.state.currentPage += increment;

					collection.fetch({
						reset: true,
						success: function (collection, response, options) {
							// if prev get last model PK else get first model PK in collection
							if(order =='prev'){
								var ln = collection.length;
								newId = collection.models[ln -1].get('PK');
							}
							else {
								 newId = collection.models[0].get('PK');
							}
							url += newId;
							self.getStationDetails(url);
						},
						error: function (collection, response, options) {
							this.sweetAlert('updationg station','error','Error in loading station from server');
						}
					});
				}
			}
			
		},
		getStationDetails : function(url){
			$.ajax({
				url:url,
				context:this,
				async : false,
				type:'GET',
				success: function(data){
					var station = new Station(data);

				   for(var key in data){
						if(key =='TSta_PK_ID'){
							station.set('PK', data[key]);
						} else if (key =='date'){
							station.set('Date_', data[key]);
						}
						else{
							//this.model.set(key, data[key]);
						}
					}
					this.model.set('station_position',station);
					this.addViews();
				},
				error: function(data){
					//alert('error in loading station data');
					Swal({
						title: "Error in loading station data",
						//text: 'Please input a valid value (>0).',
						type: 'error',
						showCancelButton: false,
						confirmButtonColor: 'rgb(147, 14, 14)',
						confirmButtonText: "OK",
						closeOnConfirm: true,
					});
				}
			}).done(function(){
			   
			});
		},
		addViews : function(){
			this.protosToRemove = [];
			var stationModel = this.model.get('station_position');
			var stationView = new StationDetails({model:stationModel});
			this.stationRegion.show(stationView);
			this.idStation = stationModel.get('PK');
			this.getProtocolsList(this.idStation);
			//this.getProtocols();
		},
		isInt : function (value){
		  if((parseFloat(value) == parseInt(value)) && !isNaN(value)){
			  return true;
		  } else {
			  return false;
		  }
		},
		updateFormUI : function(){
			var self = this;
			$('.timePicker').each(function(){
				var currentVal =  $(this).val();
				$(this).datetimepicker({});
				$(this).data('DateTimePicker').format('HH:mm');
				$(this).val(currentVal);
			});
			//$(datefield).data('DateTimePicker').format('DD/MM/YYYY HH:mm:ss');
			$('.timePicker').on('dp.show', function(e) {
				/* $(this).val('');
				 $(this).attr('placeholder','HH:mm');*/
			});
			$('.timePicker').on('dp.change', function(e) {
				self.checkTime(e);
			});


			/*$('.timePicker').datetimepicker({ 
			});
			$('.timePicker').data('DateTimePicker').format('HH:mm');*/
			// append options to select control 'user list' to display full name other then id
			var selectFields = $('select[user_list="username_list"]');
			var nbFields =  selectFields.length;
			if (nbFields > 0){
				var options = $('#usersList').html();
				for(var i=0; i<nbFields;i++){
					var field = $(selectFields)[i];
					var fieldName = $(field).attr('name');
					$(field).append(options);
					// set user name in the input by using stored user id in the form model
					var userId = this.formView.model.get(fieldName);
					$(field).find('option[value="' + userId +  '"]').attr('selected', true);
				}
			}
			// min value in number fields is 0
			$('input[type="number"]').attr('min', 0);

			// if form id is vertebrate group, reorganize fields with
			/*var isVGForm = $('form#Vertebrate_group').length > 0;
			if(isVGForm){
				this.updateFormforVG();
			}*/

		},
		activeOnglet: function(e) {
			$(e.target).parents('.swiper-wrapper').find('.onglet.active').removeClass('active');
			$(e.target).parent().addClass('active');
		}, 
		nextOK: function() {
			return true;
		},
		getUserName : function(id){
			var option = $('#usersList').find('option[value="'+ id +'"]')[0];
			var userName = $(option).text();
			return userName;
		},
		successState : function(obj){
			var protoId = obj.id;
			var activOnglet  = $('#tabProtsUl div.onglet.active');
			//<i class="icon small reneco reneco-validated"></i>
			// display picto for selected ongle
			var element = $(activOnglet).find('i')[0];
			$(element).removeClass('edit');
			$(element).addClass('icon small reneco reneco-validate');
			// disable delete icon if protocol is stored to ovoid deleting it
			var delelem = $(activOnglet).find('i.deleteProt')[0];
			$(delelem).removeClass('glyphicon-remove');

			// update id protocol 
			var protoOnglet = $('#idProtosContainer div.onglet.active').find('a')[0];
			$(protoOnglet).attr('idproto', protoId);
			$('form input').attr('disabled', 'disabled');
			$('form textarea').attr('disabled', 'disabled');
			$('form select').attr('disabled', 'disabled');
			// disable delete icon if protocol is stored to ovoid deleting it
			delelem = $(protoOnglet).find('i.deleteProInstance')[0];
			$(delelem).removeClass('glyphicon-remove');
			//update instance id in  this.activeProtcolsObj[key].PK_data
			var tabProtocol = this.activeProtcolsObj[this.selectedProtoName].PK_data;
			for (var i = tabProtocol.length - 1; i >= 0; i--) {
				if(tabProtocol[i] === 0 ){
					tabProtocol[i] = parseInt(protoId);
					return;
				}
			};
		},
		editState : function(resp){
			var self = this;
			var element = $('#tabProtsUl div.onglet.active').find('i')[0];
			$(element).removeClass('validated');
			$(element).addClass('edit');
			$('form input').removeAttr('disabled');
			$('form textarea').removeAttr('disabled');
			$('form select').removeAttr('disabled');
			// for thesaurus fields, replace fullpath value by terminal value and set hidden field with fullpath val
			$('input.autocompTree').each(function() {
				// get fullpath value 
				var fieldName = $(this).attr('name');
				var fullpathValue = resp.model.get(fieldName);
				var hiddenFieldName = fieldName + '_value';
				$('input[name="' + hiddenFieldName + '"]').attr('value', fullpathValue);
				if(fullpathValue){
					var tab = fullpathValue.split('>');
					var terminalVl = tab[tab.length - 1];
					$(this).val(terminalVl);
				}
			});
		},
		/*updateFormforVG : function(){
			$('form#Vertebrate_group').find('div.col-sm-4').each(function(){
				$(this).removeClass('col-sm-4');
				$(this).addClass('col-sm-3');
			});
		},*/
		deleteProtocol : function(e){
			Array.prototype.unset = function(val){
				var index = this.indexOf(val)
				if(index > -1){
					this.splice(index,1)
				}
			};
			var self = this;
			/*swal({
			  title: "Are you sure to delete it?",
			  text: "",
			  type: "warning",
			  showCancelButton: true,
			  confirmButtonColor: "#DD6B55",
			  confirmButtonText: "Yes, delete it!",
			  cancelButtonText: "No, cancel !",
			  closeOnConfirm: true,
			  closeOnCancel: true
			},
			function(isConfirm){
			  //if (isConfirm) {*/
					var protocolName = $(e.target).parent().attr('name');
					// find protocol instance and remove it
					 if(protocolName){
						for(var key in self.activeProtcolsObj) {
							if(key == protocolName){
								var tabProtos = self.activeProtcolsObj[key].PK_data;
								tabProtos.unset(0);
								if(tabProtos.length ==0){
									// delete key entry
									delete self.activeProtcolsObj[key];
								}
							} 
						}
						// update select control content for protocols list to add
						self.protosToRemove.unset(protocolName);
						self.generateSelectProtoContent(self.protosToAdd, self.listToRemove);
					}
					// refrech view
					self.generateNavBarProtos();
				//swal("Deleted!", "", "success");
			  //} else {
				   // swal("Cancelled", "", "error");
			  //}
			//});

		},
		deleteProtInstance : function(e){
			var protocolName = $(e.target).parent().attr('name');
			this.deleteProtocol(e);
			this.updateInstanceDetails(protocolName);
		},
		updateSation : function(obj){
			var self = this;
			var model = obj.model ; 
			var data = model.changed;
			data.PK = model.get('PK');
			$.ajax({
				url: config.coreUrl +'station/addStation/insert',
				context: this,
				data: data,
				type:'POST',
				success: function(data){
				},
				error: function (xhr, ajaxOptions, thrownError) {
				//alert('error in updating current station value(s)');
					Swal({
						title: "Error in updating current station value(s)",
						//text: 'Please input a valid value (>0).',
						type: 'error',
						showCancelButton: false,
						confirmButtonColor: 'rgb(147, 14, 14)',
						confirmButtonText: "OK",
						closeOnConfirm: true,
					});
				}
			}).done(function(){
				if(data.FieldActivity_Name){
					self.getProtocolsList(data.PK);
				}
			});
		},
		updateTotalIndiv : function (e){
			var total = 0;
			$('form input.indivNumber').each(function(key,value) {
				if($(this).val()){
					var val = parseInt($(this).val());
					total += val;
				}
			});
			$('input[name="Nb_Total"]').val(total);
		},
		updateFieldsConstraints : function(e){
			// only one field having class 'oneRequired' is required. If one is inputed, move  'required constraints in form model'
			var self = this;
			var oneInputed = false;
			$('.oneRequired').each(function() {
				if($(this).val()){
					return (oneInputed = true);
				}
			});
			// set the constraint in the form model
			$('.oneRequired').each(function() {
				var fieldName = $(this).attr('name');
				var test = self;
				if(oneInputed){
					self.formView.BBForm.schema[fieldName].validators = [];
					self.formView.BBForm.fields[fieldName].schema.validators = [];
 
				} else {
					self.formView.BBForm.schema[fieldName].validators = ["required"];
					self.formView.BBForm.fields[fieldName].schema.validators = ["required"];
				}
			});
		},
		checkTime : function(e){
			var time = $(e.target).val();
			var error = false;
			if(time){
				var tab = time.split(':');
				if(tab.length> 0){
					var heure = tab[0];
					var minutes = tab[1];
					if(parseInt(heure) > 24 || (parseInt(minutes) > 59)) {
						error = true;
					}
				} else {
					error = true;
				}
				if(error){
					//alert('Please input a valid time');
					Swal({
						title: "Error value",
						text: 'Please input a valid time',
						type: 'error',
						showCancelButton: false,
						confirmButtonColor: 'rgb(147, 14, 14)',
						confirmButtonText: "OK",
						closeOnConfirm: true,
					});
					$(e.target).val('');
				}
			}
		},
		cleanArray : function(array) {
		  var i, j, len = array.length, out = [], obj = {};
		  for (i = 0; i < len; i++) {
			obj[array[i]] = 0;
		  }
		  for (j in obj) {
			out.push(j);
		  }
		  return out;
		},
		checkNumberVal : function(e){
			var val = $(e.target).val();
			if(val){
				var intVal = parseInt(val);
				if(intVal < 0 ){
					$(e.target).val('');
				}
			}
		},

		sweetAlert : function(title,type,message){

			Swal({
				title: title,
				text: message,
				type: type,
				showCancelButton: false,
				confirmButtonColor: 'rgb(147, 14, 14)',
				confirmButtonText: "OK",
				closeOnConfirm: true,
			});
		}
	});
});
