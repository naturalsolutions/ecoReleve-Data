define([
	'jquery',
	'underscore',
	'backbone',
	'backbone_forms',
	'requirejs-text!./Templates/tpl-filters.html',
	'requirejs-text!./Templates/tpl-CheckBoxes.html',
	'radio',
	'moment',
	'vendors/backboneForm-editor-dateTimePicker',
	'vendors/backboneForm-editor-timePicker',
	//'vendors/backboneForm-editor-autoCompTree',
	'vendors/backboneForm-editor-Number',
	

], function ($, _, Backbone, BbForms, tpl, tplcheck, Radio, moment) {
	'use strict';
	return Backbone.View.extend({


		events: {
			"click input": "clickedCheck",
			//"keypress input:not(:checkbox,:radio)" : "updateQuery",
		},

		/*=====================================
		=            Filter Module            =
		=====================================*/

		initialize: function (options) {
			this.filterContainer = options.filterContainer
			this.clientSide = options.clientSide;
			this.name = options.name || '';
			this.com = options.com;
			this.typeObj = options.typeObj;
			this.url = options.url;

			this.datas = {};
			this.form;
			this.datas;

			this.url = options.url + 'getFilters';

			this.forms = [];

			if(!options.custom){
				if (options.filters) {
					this.filters = options.filters;
					this.initFilters(options.filters);
				} else {
					// Otherwise initialized from AJAX call
					this.getFilters();
				}
			}

			// If filters are given we use them

			this.criterias = {};
			if (options.filterLoaded){
				this.filterLoaded = options.filterLoaded ;
			}
		},

		getFilters: function() {
			var _this = this;
			this.forms = [];
			var jqxhr = $.ajax({
				url: _this.url,
				data: {
					'FilterName': _this.name,
					'typeObj' : _this.typeObj,
				},
				contentType: 'application/json',
				type: 'GET',
				context: this,
			}).done(function (data) {
				this.initFilters(data);
				this.datas = data;
			}).fail(function (msg) {
			});
		},

		initFilters: function (data) {
			var form;
			for (var key in data) {
				form = this.initFilter(data[key]);
				this.filterContainer.append(form.el);


				if (data[key].type == 'Checkboxes') {
					this.filterContainer.find('input[type="checkbox"]').each(function () {
						$(this).prop('checked', true);
					});
				}
				this.filterContainer.find('input[type="checkbox"]').on('click', this.clickedCheck);
				this.filterContainer.find('form').on('keypress',  $.proxy(this.updateQuery, this));

				this.forms.push(form);
				this.filterLoaded();
			};
		},

		addFilter: function(data){
			var form;
			for (var key in data) {
				form = this.initFilter(data[key]);
				this.filterContainer.append(form.el);

				$(form.el).find('select').focus();
				if (data[key].type == 'Checkboxes') {
					this.filterContainer.find('input[type="checkbox"]').each(function () {
						$(this).prop('checked', true);
					});
				}
				this.filterContainer.find('input[type="checkbox"]').on('click', this.clickedCheck);
				this.filterContainer.find('form').on('keypress',  $.proxy(this.updateQuery, this));


				this.forms.push(form);
			};
		},

		initFilter: function (dataRow) {
			var form;
			var fieldName = dataRow['name'];
			var classe = '';
			var editorClass = 'form-control filter';
			var type = dataRow['type'];
			var template = tpl;

			if (fieldName == 'Status') classe = 'hidden';
			var options = this.getValueOptions(dataRow);
			if (type == 'Select' || type == 'Checkboxes') {
				editorClass += ' list-inline ';
				options = dataRow['options'];
				if (type == 'Checkboxes') {
					options.splice(0, 0, { label: 'All', val: -1, checked: true });
					template = tplcheck;
				}
				else {
					options.splice(0, 0, { label: ' ', val: -1 });
				}
			}

			editorClass += ' ' + fieldName;

			var schm = {
				Column: { name: 'Column', type: 'Hidden', title: dataRow['label'], value: fieldName },
				ColumnType: { name: 'ColumnType', title:'',type: 'Hidden', value: type },
				Operator: {
					type: 'Select', title: dataRow['label'], options: this.getOpOptions(type), editorClass: 'form-control ' + classe,
				},
				
				Value: {
					type: this.getFieldType(type),
					title: dataRow['label'],
					editorClass: editorClass,
					options: this.getValueOptions(dataRow)
				}
			}

			var Formdata = {
				ColumnType: type,
				Column: fieldName,
				Operator: schm['Operator'].options[0]
			};

			var md = Backbone.Model.extend({
				schema: schm,
				defaults: {
					Column: fieldName,
					ColumnType: type,
				}
			});

			var mod = new md();

			form = new BbForms({
				template: _.template(template),
				model: mod,
				data: Formdata,
				templateData: { filterName: dataRow['label'],ColumnType:type }
			}).render();

			return form;
		},
		filterLoaded : function(){


		}
		,
		clickedCheck: function (e) {
			// Keep the new check value
			var IsChecked = e.target.checked;
			if (e.target.value > 0) {
				//'Not checkall', We change the checkall if new target value is uncheked
				$(this).parent().parent().find('input:checkbox').each(function () {
					if (this.value == -1 && !IsChecked) {
						$(this).prop('checked', IsChecked);
					}
				});
			}
			else {
				// CheckAll, all check input affected to checkAll Value
				$(this).parent().parent().find('input:checkbox').each(function () {
					$(this).prop('checked', IsChecked);
				});
			}
		},

		getValueOptions: function (DataRow) {

			var valueOptions;
			switch (DataRow['type']) {
				case "Select": case 'Checkboxes':
					return DataRow['options']
					break;
				case "DATETIME":
					return valueOptions = [{
						dateFormat: 'd/m/yyyy',
						defaultValue: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear()
					}];
					break;
				default:
					return valueOptions = '';
					break;
			}
		},

		getOpOptions: function (type) {
			console.log(type);
			var operatorsOptions;
			switch (type) {
				case "Text":
					return operatorsOptions = [{ label: 'Is', val: 'Is' }, { label: 'Is not', val: 'Is not' }, { label: 'Contains', val: 'Contains' }];
					break;
				case "DATETIME":
					return operatorsOptions = ['<', '>', '=', '<>', '<=', '>='];
					break;
				case "Select":
					return operatorsOptions = ['Is', 'Is not'];
					break;
				case "Checkboxes":
					return operatorsOptions = ['Checked'];
					break;
					break;
				default:
					return operatorsOptions = ['<', '>', '=', '<>', '<=', '>='];
					break;
			}
		},

		getFieldType: function (type) {
			var typeField;
			switch (type) {
				case "Text":
					return typeField = "Text";
					break;
				case "DateTimePicker":
					return typeField = "DateTimePicker"; 
					break;
				case "Select":
					return typeField = "Select";
					break;
				case "Checkboxes":
					return typeField = "Checkboxes";
					break;
				case "LatitudeEditor":
					return typeField = "LatitudeEditor";
					break;	
				case "LongitudeEditor":
					return typeField = "LongitudeEditor";
					break;	
				default:
					return typeField = "Number";
					break;
			}
		},

		update: function () {
			var filters = [];
			var currentForm, value;
			for (var i = 0; i < this.forms.length; i++) {
				currentForm = this.forms[i];

				var type = typeof currentForm.getValue().Value;

				if (!currentForm.validate() && (currentForm.getValue().Value || type == 'number')) {
					value = currentForm.getValue();
					filters.push(value);
					currentForm.$el.find('input.filter').addClass('active');
				} else {
					currentForm.$el.find('input.filter').removeClass('active')
				};
			};
			this.criterias = filters;

			if (this.clientSide) {
				this.clientFilter(filters);
			}else{
				this.interaction('filter', filters);
			}
			return filters;
		},

		reset: function () {
			this.filterContainer.empty();
			if (this.clientSide) {
				this.initFilters(this.filters);
			}
			else {
				// Otherwise initialized from AJAX call
				this.getFilters();
			}
			this.update();
		},

		clientFilter: function (filters) {
			var tmp = this.com.getMotherColl();
			var mod = [];
			var filter;
			var col, op, val;
			var result = [];
			var ctx = this;


			var pass, rx, objVal;
			if (filters.length) {
				var coll = _.clone(tmp);
				_.filter(coll.models, function (obj) {

					pass = true;

					for (var i = filters.length - 1; i >= 0; i--) {
						if (pass) {
							filter = filters[i];
							col = filter['Column'];
							op = filter['Operator'];
							val = filter['Value'];

							objVal = obj.attributes[col];

							console.log(objVal);

							var isDate = moment(objVal).isValid();

							if (isDate) {
								pass = ctx.testDate(val, op, objVal);
							} else {
								pass = ctx.testMatch(val, op, objVal);
							};
						}
					};
					if (pass) {
						mod.push(obj);
					};
				});
				coll.reset(mod);
				this.com.action('filter', coll);

			} else {
				this.com.action('filter', tmp);
			}
		},


		testMatch: function (val, op, objVal) {
			var rx;
			switch (op.toLowerCase()) {
				case 'is':
					val = val.toUpperCase();
					rx = new RegExp('^' + val + '$');
					if (!rx.test(objVal.toUpperCase())) {
						return false;
					};
					break;
				case 'is not':
					val = val.toUpperCase();
					rx = new RegExp('^(^' + val + ')$'); //todo : not sure
					if (!rx.test(objVal.toUpperCase())) {
						return false;
					};
					break;
				case 'contains':
					val = val.toUpperCase();
					rx = new RegExp(val);
					if (!rx.test(objVal.toUpperCase())) {
						return false;
					};
					break;
				case '=':
					if (!(objVal == val)) {
						return false;
					};
					break;
				case '<>':
					if (!(objVal != val)) {
						return false;
					};
					break;
				case '>':
					if (!(objVal > val)) {
						return false;
					};
					break;
				case '<':
					if (!(objVal < val)) {
						return false;
					};
					break;
				case '>=':
					if (!(objVal >= val)) {
						return false;
					};
					break;
				case '<=':
					if (!(objVal <= val)) {
						return false;
					};
					break;
				default:
					return false;
					break;
			};
			return true;
		},

		testDate: function (filterVal, op, colVal) {
			var filterDate = moment(filterVal, 'DD/MM/YYYY HH:mm:ss');
			var colDate = moment(colVal);


			console.log(filterDate);
			console.log(colDate);

			
/*			filterDate = filterDate.format('YYYY-MM-DD hh:mm:ss');
			colDate = colDate.format('YYYY-MM-DD hh:mm:ss');*/
/*
			console.log(val);
			console.log(collVal);
			console.log(filterDate);
			console.log(colDate);

*/
			switch (op.toLowerCase()) {
				case '=':
					if (!(colDate.isSame(filterDate))) {
						return false;
					};
					break;
				case '<>':
					if (colDate.isSame(filterDate)) {
						return false;
					};
					break;
				case '>':
					if ((filterDate.isAfter(colDate))) {
						return false;
					};
					break;
				case '<':
					if ((filterDate.isBefore(colDate))) {
						return false;
					};
					break;
					//todo : verify those 2
				case '>=':
					if ((filterDate.isAfter(colDate)) || (colDate.isSame(filterDate))) {
						return false;
					};
					break;
				case '<=':
					if ((filterDate.isBefore(colDate)) || (colDate.isSame(filterDate))) {
						return false;
					};
					break;
				default:
					return false;
					break;
			};
			return true;

		},

		interaction: function (action, id) {
			if (this.com) {
				this.com.action(action, id);
			} else {
				this.action(action, id);
			}
		},

		action: function (action, params) {
			// Rien à faire
			return;
		},
		updateQuery : function(e){
			if (e.keyCode === 13) {
				e.preventDefault();
				this.update();
				return false;
   			}
		}

	});
});
