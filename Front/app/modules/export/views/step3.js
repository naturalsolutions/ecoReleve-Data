define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'config',

	'models/point',
	'backbone_forms',
], function(
	$, _, Backbone , Marionette, Radio, config,
	BbForms
){

	'use strict';


	return Marionette.ItemView.extend({
		template: template,

		events: {
				'click button#validateColumns' : 'validateColumns',
		},

		initialize: function(options) {
			this.radio = Radio.channel('exp');

			this.filterInfosList = options.filters;
			this.viewName= options.viewName;
			this.query= options.query;


			/**
			*
			* shared criterias
			*
			**/
			
			this.columnForm;
			this.boxCriteria;
			this.columnCriteria;

			this.initColumns();
		},
		
		initColumns: function(){
			var viewUrl = config.coreUrl + "/views/details/" + this.viewName;
			var jqxhr = $.ajax({
				url: viewUrl,
				context: this,
				dataType: "json"
			}).done(function(data){
					this.displayColumns(data);
			}).fail(function(msg){
					alert('error');
			});

		},

		displayColumns: function(fieldList){
			var schemaa={};
			var customTpl;
			for (var i = 0; i < fieldList.length; i++) {
				customTpl = _.template('<div class="checkbox col-xs-6"><label><span data-editor></span>'+ fieldList[i].name +'</label></div>');
				schemaa[fieldList[i].name]={ type: 'Checkbox', template: customTpl };
			}

			this.columnForm = new BbForms({
				schema : schemaa
			}).render();

			$('#Columns').append(this.columnForm.el);
		},


		validateColumns: function(){
			this.columnCriteria= this.columnForm.getValue();


			var list=[];
			for(var key in this.columnCriteria){
				if (this.columnCriteria[key])
					list.push(key);
			}

			this.radio.command('columns', { columns: list });
			this.radio.command('columns-update', { columns: list });
			this.validateStep();
		},

		validateStep: function(){
			$('.btn-next').removeAttr('disabled');
		},

		onShow: function(){
		},

		onRender: function(){

		},
	});
});
