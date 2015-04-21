//radio

define([
	'jquery',
	'marionette',
	'sweetAlert',
	'config',
	'radio',
	
	'tmp/getUsers',
	'tmp/forms',
	'tmp/getFieldActivity',
	'tmp/getRegions',
	'tmp/getSitesTypes',
	'tmp/getSitesNames',
	
	'dateTimePicker'

], function($, Marionette, Swal, config, Radio,
	getUsers, forms, getFieldActivity, getRegions, getSitesTypes, getSitesNames
){
	"use strict";

	return Marionette.ItemView.extend({
		template: 'app/modules/input/templates/stations-filter.html',

		events: {
			'click #clear-btn': 'clear',
			'change input[type=text]': 'update',
			'change select' : 'update',
			'focus input[type=text]': 'fill',
			'submit': 'catch',
			'change input[name="all-stationType"]' : 'updateStationType',
			'change input.coords' : 'checkVal',
			'change coord-min' : 'checkMinVal',
			'change coord-max' : 'checkMaxVal',
			'change input[name="allSt-beginDate"]' : 'update',
			//'change  div.dateTimePicker' : 'updateDate',
			'change #allSt-beginDate-op' : 'updateBeginDateOp',
			'change #allSt-endDate-op' : 'updateEndDateOp',
			'change select[name="allSt-monitoredSiteType"]' :'updateSiteName',
			'click #allSt-filter-btn' : 'filterQuery',
			'click #allSt-clear-btn' : 'clearFilter',
			'focusout input.pickerDate':'updateDate',
			'keyup input' : 'updateSearch'

		},
		ui: {
			beginDate: 'input[name="allSt-beginDate"]',
			endDate : 'input[name="allSt-endDate"]',
			stationField :'#st-station',
			indivId : 'input[name="allSt-indivId"]',
			fieldworker :'input[name="allSt-fieldWorker"]',
			datePicker : 'input.pickerDate'
		
		},
		initialize: function(options) {
			this.radio = Radio.channel('input');
			this.radio.comply('indivId', this.updateIndivId, this);
			
		},
		catch: function(evt) {
			evt.preventDefault();
		},
		updateSearch : function(e) {
			e.preventDefault();
			e.stopPropagation();
			if(e.keyCode == 13) {
				this.update(e);
				return false;
			}
		},
		clearFilter: function(evt) {
			this.clearForm();
			// init this.filter values
			for(var key in this.filter){
				this.filter[key].Value = null;
			}
			this.updateGrid();
		},
		clearForm: function() {
			this.$el.find('form').trigger('reset');
			this.$el.find('input').prop('value', '');
		},
		onShow: function(evt) {
			
			// this.$el.parent().addClass('no-padding');
			// var height=$(window).height();
			// height -= $('#header-region').height();
			// this.$el.height(height);
			// $('#left-panel').css('padding-top', '0');
			// this.$el.addClass('filter-bg-image');

			// this.$el.find('.panel').css({'background-color' : 'rgba(0,0,0,0)', 'border':'none'});
			// this.$el.find('.panel-heading').css({'border-radius':'0px'});

			// this.$el.find('.panel-body').css({'background-color' : 'white'});
			/*$('.dateTimePicker').datetimepicker({
			}); */
			var self = this;
			$(this.ui.indivId).change( function() {  
				self.getIndivId();
			});
			this.generateSelectLists();

			$(this.ui.datePicker).datetimepicker({
				defaultDate:""
			});
			$(this.ui.datePicker).each(function() {
				$(this).data('DateTimePicker').format('DD/MM/YYYY');
			});
			$(this.ui.datePicker).on('dp.show', function(e) {
				$(this).val('');
				var name = $(this).attr('name').split('-')[1];
				self.filter[name].Value = null; 
			});  
			$(this.ui.datePicker).on('dp.change', function(e) {
				var name = $(this).attr('name').split('-')[1];
				var value = $(this).val() || null;
				self.filter[name].Value = value; 
				self.updateGrid();
			});
			this.initForm();        
		},

		onDestroy: function(evt) {
			$('#left-panel').css('padding-right', '15');
			$('#left-panel').css('padding-top', '20');
		},

		onRender: function() {
   
		},
		update: function(e) {
			e.preventDefault();
			e.stopPropagation();
			var input = $(e.target);
			var id =  $(input).attr('id');
			if(id!='allSt-beginDate-op' && (id!='allSt-endDate-op') && (id!='allSt-Name-op')){
				var name = $(input).attr('name').split('-')[1];
				var value = e.target.value;
				if (!value){ value =null;}
				if(name !='fieldWorker' && name !='siteName' && name !='PK'){   // for this field we need to get worker id from datalist
					this.filter[name].Value = value;
				} else if(name =='fieldWorker') {
					this.filter[name].Value = parseInt(value); 
				} else if(name =='Name') {
					 this.filter[name] = value; 
				} else if(name =='PK') {
					 this.filter[name].Value = parseInt(value); 
				} else {
					this.filter[name].Value = value; 
					this.filter[name].Operator = '='; 
				}
			} else {
				var operator = $(input).val();
				// set value in filter
				var fieldName = id.substring(6, id.length - 3);
				//alert(fieldName);
				this.filter[fieldName].Operator = operator; 
			}
			this.updateGrid();
		},
		filterQuery : function(){
			this.updateGrid();
		},
		getIndivId : function(){
			var indivId = this.ui.indivId.val();
			if (!indivId){ indivId =null;}
			this.filter.indivId.Value = indivId;
			this.updateGrid();
		},
		updateDate: function(e){
			var input = $(e.target);
			var name = $(input).attr('name').split('-')[1];
			var value = $(input).val();
			this.filter[name].Value = value || null;
			if(name =='beginDate'){
				var operator = $('#allSt-beginDate-op option:selected').text();
				this.filter.beginDate.Operator = operator;

			}
			if(name =='endDate'){
				var operator = $('#allSt-endDate-op option:selected').text();
				this.filter.endDate.Operator = operator;
			}
			this.updateGrid();
		},
		updateStationType : function(e){
			var stationType = $('input[name="all-stationType"]:checked').val();
			if (stationType =='Name'){
				this.filter.siteName.Value = null;
				//this.filter.siteName = null;
				$('#stMonitoredSiteName').addClass('masqued');
				$('#st-station').removeClass('masqued');
			} else {
				this.filter.Name = null;
				$('#stMonitoredSiteName').removeClass('masqued');
				$('#st-station').addClass('masqued');
			}
		},
	   updateSiteName : function(e){
			var siteType = $(e.target).val();
			if(siteType){
				var sitesNames  = getSitesNames.getElements('monitoredSite/name', siteType);
				$('#stMonitoredSiteName').html('<option></option>');
				$('#stMonitoredSiteName').append(sitesNames);
			}
		},
		updateBeginDateOp : function(){
			var operator = $('#allSt-beginDate-op option:selected').text();
			this.filter.beginDate.Operator = operator;
			if(this.ui.beginDate.val()){
				this.updateGrid();
			}
		},
		updateEndDateOp : function(){
			var operator = $('#allSt-endDate-op option:selected').text();
			this.filter.endDate.Operator = operator;
			var bdeginDateValue = $('input[name="allSt-beginDate"]');
			if(this.ui.endDate.val()){
				this.updateGrid();
			}
		},
		checkVal : function(e){
			var value = parseFloat($(e.target).val());
			if((isNaN(value)) || ((value > 180.0) || (value < -180.0))){
				//alert('please input a valid value.');
				 Swal({
					title: 'Error value',
					text: 'Please input a valid value.',
					type: 'error',
					showCancelButton: false,
					confirmButtonColor: 'rgb(147, 14, 14)',
					confirmButtonText: "OK",
					closeOnConfirm: true,
				});
				$(e.target).val('');
			}
		},
		checkMaxVal : function(e){
			var value = parseFloat($(e.target).val());
			if((isNaN(value)) || ((value > 180.0) || (value < -180.0))){
				//alert('please input a valid value.');
				Swal({
					title: 'Error value',
					text: 'Please input a valid value.',
					type: 'error',
					showCancelButton: false,
					confirmButtonColor: 'rgb(147, 14, 14)',
					confirmButtonText: "OK",
					closeOnConfirm: true,
				});
				$(e.target).val('');
			}
		},
		updateGrid: function(){
			this.radio.command('updateStationsGrid', {filter:this.filter});
			console.log('filter val : ');
			 console.log(this.filter);
		},
		generateSelectLists : function(){
			var content = getUsers.getElements('user');
			$('select[name="allSt-fieldWorker"]').append(content);
			var fieldList = getFieldActivity.getElements('theme/list');
			$('select[name="allSt-fieldActivity"]').append(fieldList);
			var regionList = getRegions.getElements('station/area');
			$('select[name="allSt-region"]').append(regionList);
			var sites  = getSitesTypes.getElements('monitoredSite/type');
			$('select[name="allSt-monitoredSiteType"]').append(sites);
		},
		updateIndivId : function(id){
			var indivId = id.id;
			$('input.pickerInput.target').val(indivId);
			this.filter['indivId'].Value = indivId; 
			this.updateGrid();
		},
		initForm : function(){
			// init filter value
			this.filter =  {
				PK : {Operator: '=' , Value: null },  
				Name : {Operator: 'Is' , Value: null },    
				siteName : {Operator: '=' ,Value: null  },    
				beginDate: {Operator: '=' ,Value: null  },    
				endDate: {Operator: '<' ,Value: null  },    
				fieldWorker : {Operator: '=' ,Value: null  },    
				fieldActivity: {Operator: '=' ,Value: null  },  
				monitoredSiteType : {Operator: '=' ,Value: null  },    
				region: {Operator: '=' ,Value: null  },    
				minLat : {Operator: '>=' ,Value: null  },    
				maxLat: {Operator: '<=' ,Value: null  },    
				minLon: {Operator: '>=' ,Value: null  },    
				maxLon: {Operator: '<=' ,Value: null },    
				indivId: {Operator: '=' ,Value: null  }  
			};
		// set storeds vals in the form if exists
			var oldStations = this.model.get('oldStations');
			if (oldStations){
				var searchCriteria = oldStations.searchCriteria ; 
				console.log('filter params crit');
				console.log(searchCriteria);
				if(searchCriteria){
					for (var key in searchCriteria){
						var element = this.$el.find( "input[name*='" + key +"']" )[0];
						if (!element){
							element = this.$el.find( "select[name*='" + key +"']" )[0];
						}
						$(element).val(searchCriteria[key].Value);
						if(key == 'beginDate' || key =='endDate'){
							var operator =  searchCriteria[key].Operator;
							var opElement = this.$el.find( "select[id*='" + key +"-op']" )[0];
							$(opElement).val(operator);
						}
					}
				}

			}
		}
	});
});
