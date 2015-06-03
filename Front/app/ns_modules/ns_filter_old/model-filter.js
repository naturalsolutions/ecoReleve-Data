define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'radio',
	'backbone_forms',
	'moment',
	'vendors/backboneForm-editors'

], function($, _, Backbone, config, Radio, BbForms, moment, tpl, BE){
	'use strict';
	return Backbone.Model.extend({


		/*=====================================
		=            Filter Module            =
		=====================================*/
		
		initialize: function(options){
			this.channel= options.channel;
			this.radio=Radio.channel(this.channel);
			this.clientSide = options.clientSide;

			this.com = options.com;
			this.url = options.url;

			this.datas={};
			this.form;
			this.datas;

			this.url = options.url + 'getFilters';

			this.forms=[];
			
			
			if(options.filters){
				this.initFilters(options.filters);
			}
			else{
				this.getFields();
			}
		},



		getFields: function(){
			var ctx=this;

			var jqxhr = $.ajax({
				url: ctx.url,
				data: JSON.stringify({criteria: ctx.datas}),
				contentType:'application/json',
				type:'GET',
				context: this,
			}).done(function(data){
				this.initFilters(data);
				this.datas=data;
			}).fail(function(msg){
				console.log(msg);
			});
		},

		initFilters: function(data){
			var form;

			for(var key in data){
				form = this.initFilter(data, key);
				$('#filters').append(form.el);
				this.forms.push(form);
			};
		},

		displayFilter: function(){
		},

		initFilter: function(data, key){
			var form;
			var type=data[key];
			var fieldName = key;
			var classe ='';
			if(fieldName == 'Status') classe = 'hidden';

			var md = Backbone.Model.extend({
				schema : {
					Column : {type: 'Hidden', title: null, value: fieldName},
					Operator : {type : 'Select', title: null, options: this.getOpOptions(type),editorClass: 'form-control '+classe,
					 },
						
					Value : {
						type : this.getFieldType(type),
						title : fieldName,
						editorClass: 'form-control filter', 
						options: this.getValueOptions(type)
					}
				},
				defaults: {
					Column : fieldName,
				}
			});


			var mod = new md();

			var tpl = Marionette.Renderer.render('app/ns_modules/ns_filter/tpl-filters.html', {filterName: key});

			form = new BbForms({
				template: _.template(tpl),
				model: mod,
				data: {
					Column: key,
				},
			}).render();


			return form;
		},


		getValueOptions: function(type){
			var valueOptions;
			switch(type){
				case 'Select': 
					return valueOptions = [];
					break;
				case 'DateTimePickerBS':
					return valueOptions = [{
						dateFormat: 'dd/mm/yyyy',
						defaultValue: new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear() 
						}];
					break;
				default:
					return valueOptions = '';
					break;
			}
		},

		getOpOptions: function(type){
			var operatorsOptions;
			switch(type){
				case 'String': 
					return operatorsOptions= ['Is', 'Is not', 'Contains'];
					break;
				case 'Select': 
					return operatorsOptions= ['Is', 'Is not'];
					break;
				case 'DateTimePickerBS':
					return operatorsOptions= ['<', '>', '=', '<>', '<=', '>='];
					break;
				case 'Checkboxes':
					return operatorsOptions= ['='];
				default:
					return operatorsOptions= ['<', '>', '=', '<>', '<=', '>='];
					break;
			}
		},

		getFieldType: function(type){
			var typeField;
			switch(type){
				case 'String': 
					return typeField='Text';
					break;
				case 'Select': 
					return typeField='Select';
					break;
				case 'DateTimePickerBS':
					return typeField='DateTimePickerBS';
					break;
				case 'Checkboxes':
					return typeField='Checkboxes';
					break;
				default:
					return typeField='Number';
					break;
			}  
		},

		update: function(){
			var filters= [];
			var currentForm, value;
			for (var i = 0; i < this.forms.length; i++) {
				currentForm=this.forms[i];
				if(!currentForm.validate() && currentForm.getValue().Value){

					value = currentForm.getValue();

					filters.push(value);
					


					currentForm.$el.find('input.filter').addClass('active');
				}else{
					currentForm.$el.find('input.filter').removeClass('active')

				};
			};


			this.radio.command(this.channel+':grid:update', { filters : filters });

			if(this.clientSide){
				this.clientFilter(filters)
			}

		},





		feed: function(type){
			$.ajax({
				url: config.coreUrl+'monitoredSite/'+type,
				context: this,
			}).done(function( data ) {
				this.feedOpt(type, data);
			}).fail(function( msg ) {
				console.log(msg);
			});
		},

		feedOpt: function(type, list){
			var optTpl;
			$('#'+type+' select[name=Value]').append('<option value=""></option>');
			for (var i = 0; i < list.length; i++) {
				optTpl = '<option value=""'+list[i]+'>'+list[i]+'</option>';
				$('#'+type+' select[name=Value]').append(optTpl);
			};
		},


		clientFilter: function(filters){
			var tmp = this.com.getMotherColl();
			var mod = [];
			var filter;
			var col, op, val;
			var result = [];
			var ctx = this;
			

			var pass, rx, objVal;
			if(filters.length){
				var coll = _.clone(tmp);
				_.filter(coll.models, function(obj){
					pass = true;

					for (var i = filters.length - 1; i >= 0; i--) {
						if(pass){
							filter = filters[i];
							col = filter['Column'];
							op = filter['Operator'];
							val = filter['Value'];

							objVal = obj.attributes[col];

							//date
							if(moment.isMoment(val)){
								pass = ctx.testDate(val, op, objVal);
							}else{
								pass = ctx.testMatch(val, op, objVal);
							};
						}
					};
					if(pass){
						mod.push(obj);
					};
				});
				coll.reset(mod);
				this.com.action('filter', coll);
			}else{
				this.com.action('filter', tmp);
			}
		},


		/*
		reset: function(){
			$('#filters').find('select').each(function(){
				$(this).prop('selectedIndex',0);                
			});
			$('#filters').find('input').each(function(){
				$(this).reload();
			});
		},*/


		testMatch : function(val, op, objVal){
			var rx;
			switch(op.toLowerCase()){
				case 'is':
					val = val.toUpperCase();
					rx = new RegExp('^'+val+'$');
					if(!rx.test(objVal.toUpperCase())){
					   return false;
					};
					break;
				case 'is not':
					val = val.toUpperCase();
					rx = new RegExp('^(^'+val+')$'); //todo : not sure
					if(!rx.test(objVal.toUpperCase())){
					   return false;
					};
					break;
				case 'contains':
					val = val.toUpperCase();
					rx = new RegExp(val);
					if(!rx.test(objVal.toUpperCase())){
					   return false;
					};
					break;
				case '=':
					if(!(objVal == val)){
						return false;
					};
					break;
				case '<>':
					if(!(objVal != val)){
						return false;
					};
					break;
				case '>':
					if(!(objVal > val)){
						return false;
					};
					break;
				case '<':
					if(!(objVal < val)){
						return false;
					};
					break;
				case '>=':
					if(!(objVal >= val)){
						return false;
					};
					break;
				case '<=':
					if(!(objVal <= val)){
						return false;
					};
					break;
				default:
					console.warn('wrong opperator');
					return false;
					break;
			};
			return true;
		},

		testDate: function(val, op, objVal){
			var dateA = moment(objVal);
			var dateB =  moment(val);

			switch(op.toLowerCase()){
				case '=':
					if(!(dateB.isSame(dateA))){
						return false;
					};
					break;
				case '!=':
					if(dateB.isSame(dateA)){
						return false;
					};
					break;
				case '>':
					if(!(dateA.isAfter(dateB))){
						return false;
					};
					break;
				case '<':
					//moment('2010-10-20').isBefore('2010-10-21'); // true
					if(!(moment(dateA).isBefore(dateB))){
						return false;
					};
					break;
				//todo : verify those 2
				case '>=':
					if(!(dateA.isAfter(dateB)) && !(dateB.isSame(dateA))){
						return false;
					};
					break;
				case '<=':
					if(!(dateA.isBefore(dateB)) && !(dateB.isSame(dateA))){
						return false;
					};
					break;
				default:
					console.log('wrong opperator');
					return false;
					break;

			};
			return true;

		},


	});
});

