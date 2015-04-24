define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'config',

	'backbone_forms',
], function($, _, Backbone , Marionette, Radio, config,
	BbForms
){

	'use strict';
	return Marionette.ItemView.extend({
		template: 'app/modules/export/templates/export-step4.html',

		events: {
				'click button#validateColumns' : 'validateColumns',
				'click button#selectAll': 'selectAll',
		},


		initialize: function(options) {
			this.radio = Radio.channel('exp');


			
			this.filterInfosList = options.filtersCriteria;
			this.viewName= options.viewName;

			
			this.columnForm;
			this.boxCriteria= options.boxCriteria;
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
				customTpl = _.template('<div class="checkbox colx-xs-12"><label><span data-editor></span>'+ fieldList[i].name +'</label></div>');
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

		selectAll: function(){
			this.$el.find('#Columns input[type=checkbox]').each(function(){
				$(this).attr('checked', true);
			});
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
