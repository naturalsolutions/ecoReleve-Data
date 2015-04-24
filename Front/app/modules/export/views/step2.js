define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'config',

	'backbone_forms',
], function(
	$, _, Backbone , Marionette, Radio, config, 
	BbForms
){
	'use strict';

	return Marionette.ItemView.extend({
		template: 'app/modules/export/templates/export-step2-filters.html',
		events: {
			'change #export-view-fields': 'selectField',
			'click #filter-query-btn': 'check',
			'click #filter-delete': 'deleteFilter'
		},
		className: 'full-height',

		initialize: function(options) {
			this.radio = Radio.channel('exp');

			this.selectedFields = [];
			this.filterList=[];
			this.filterInfosList= {};
			this.labels="";
			this.viewName= options.viewName;


			this.generateFilter();
			this.getFieldsListForSelectedView(this.viewName);

			

		},
		onShow: function(){
			//$("#filterViewName").text(this.viewName);
		},
		
		onBeforeDestroy: function(){
		},
		
		
		deleteFilter: function(e){
			var elem=$(e.target).parent('.filter-row');
			var index = ($('.filter-row').index($(elem)));
			//var index= nodeList.indexOf(e.target.parentNode);

			//var nodeList = Array.prototype.slice.call( document.getElementById('export-filter-list').children );
			//var index= nodeList.indexOf(e.target.parentNode);
			this.filterList.splice(index, 1);
			$(e.target).parent('.filter-row').remove();

		},

		generateFilter : function() {
			var viewUrl = config.coreUrl + "/views/" + this.viewName + "/count";
			var jqxhr = $.ajax({
				url: viewUrl,
				context: this,
				dataType: "json",
			}).done(function(count){
				$("#countViewRows").text(count);
				$('#geo-query-result').html(count);
			}).fail(function(msg){
				$("#countViewRows").text("error");
			});
		},

		getFieldsListForSelectedView : function() {
			var viewUrl = config.coreUrl + "/views/details/" + this.viewName;
			var jqxhr = $.ajax({
				url: viewUrl,
				context: this,
				dataType: "json"
			}).done(function(data){
				var fieldsList = [];
				var exportFieldsList =[];
				$("#export-view-fields").append('<option value="choose">Add a filter</option>');
				for (var i = 0; i < data.length; i++) {
					var optionItem = "<option type='" + data[i].type + "'>" + data[i].name + "</option>";
					$("#export-view-fields").append(optionItem);
					exportFieldsList.push(data[i].name);
				}
				$("#filter-btn").removeClass("masqued");
			}).fail(function(msg){
				alert('error');
			});
		},

		selectField: function() {


			/**
			*
			* Set options per type
			*
			**/
			var filter = $("#export-view-fields option:selected").val();
			if(filter == 'choose'){
				return;
			}

			var fieldName = $("#export-view-fields option:selected").text();
			//var fieldId = fieldName.replace("@", "-");
			var typeField, operatorsOptions;
			var type = $("#export-view-fields option:selected").attr('type');
			switch(type){
				case "string": 
					typeField="Text";
					operatorsOptions= ['Not Like', 'Like', 'Contains'];
					break;
				case "DATETIME":
					typeField="Date";
					operatorsOptions= ['>', '<', '=', '<>', '>=', '<='];
					break;
				default:
					typeField="Number";
					operatorsOptions= ['>', '<', '=', '<>', '>=', '<='];
					break;
			}


			var schem = {
				Column: {type: 'Hidden', title:'Column', value: fieldName},
				Operator: { type: 'Select', title: null, options: operatorsOptions, editorClass: 'form-control' },
				Value: { type: typeField, validators: ['required'],  title:null, editorClass: 'form-control' },
			};


			/**
			*
			* Instanciate a new BbForm
			*
			**/

			var html = Marionette.Renderer.render('app/modules/export/tools/tpl-filters.html', {filterName : fieldName});
			
			var form = new BbForms({
				template: _.template(html),
				schema: schem,
				data: {
					Column: fieldName,
				},
			}).render();

			$("#export-view-fields").val('choose');



			$('#filter-query').append(form.el);
			this.filterList.push(form);

			form.on('Operator:change', function(form, titleEditor, extra) {
			});


			$('#export-filter-list').append(form.el).removeClass('masqued');
			$('#filter-query').removeClass("masqued");
		},


		/*check*/
		filterQuery: function() {
			var currentFilter;


			/**
			*
			* Push filters
			*
			**/
			
			for (var i = 0; i < this.filterList.length; i++) {
				var currentForm=this.filterList[i];
				if(!currentForm.validate()){
					this.filterInfosList.filters.push(currentForm.getValue());
				}
			};

			/**
			*
			* Ajax Call
			*
			**/

			var fieldName, operator, condition;
			var query = "";
			var self = this;
			$(".filterElement").each(function() {

				fieldName = $(this).find("div.name").text();
				condition = $(this).find("input.fieldval").val();
				operator = $(this).find("select.filter-select-operator option:selected").text();

			});

		},


		check: function(){
			this.filterInfosList= {
				viewName: this.viewName,
				filters: []
			} 

			/**
			*
			* push filter if it passes validation
			*
			**/

			var currentForm;
			for (var i = 0; i < this.filterList.length; i++) {
				currentForm=this.filterList[i];
				if(!currentForm.validate()){
					this.filterInfosList.filters.push(currentForm.getValue());
				}
			};


			/**
			*
			* Call
			*
			**/
			

			var viewUrl = config.coreUrl + "/views/filter/" + this.viewName + "/count" ;
			$.ajax({
				url: viewUrl,
				data: JSON.stringify({criteria:this.filterInfosList}),
				contentType:'application/json',
				type:'POST',
				context: this,
			}).done(function(count){
				$('#geo-query-result').html(count);
				this.validate();
			}).fail(function(msg){
				console.error(msg);
			});


		},



		validate: function(){
			this.radio.command('filters', {
				filters: this.filterInfosList,
			});

			this.radio.command('filters2map', {
				filters: this.filterInfosList,
			});

			$('.btn-next').removeAttr('disabled');
		},


		getFiltredResult: function(element, query, view) {
			var viewUrl = config.coreUrl + "/views/filter/" + view + "/count?" + query;
			$.ajax({
				url: viewUrl,
				dataType: "json",
				context: this,
			}).done(function(count){
				$("#filter-query-result").html(' <br/><p>filtred count:<span> ' + count + ' records</span></p>');
				if(count!=0){
					$('.btn-next').removeAttr('disabled');
					var filterValue = $("#filterForView").val();
				}
			}).fail(function(msg){
				$("#filter-query-result").html(' <h4>error</h4>');
			});
		},




	});
});
