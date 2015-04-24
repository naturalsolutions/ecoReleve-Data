define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'config',

	'backbone_forms',

], function(
	$, _, Backbone, Marionette, Radio, config,
	BbForms
){

	'use strict';

	return Marionette.ItemView.extend({
		template: 'app/modules/export/templates/export-step1.html',
		events: {
			'click #export-themes li': 'getViewsList',
			'click #exportViewsList': 'enableNext',
		},
		className: 'full-height',

		initialize: function(options) {
			this.radio = Radio.channel('exp');
		},

		/*
		onBeforeDestroy: function() {
			this.radio.reset();
		},
		*/

		onShow: function() {
			this.getItemList();
			var ctx=this;
		},


		alerte: function(options){
			//alert(options);
		},

		//obsolete : remplace by datalist.fill()
		getItemList: function(isDatalist){
			var element= this.$el.find('#export-themes');
			element.empty();

			var url = config.coreUrl + '/theme/list?export=yes';
			$.ajax({
				url: url,
				dataType: "json",
				context: this,
			}).done(function(data){
				var len = data.length;
				for (var i = 0; i < len; i++) {
					var label = data[i].caption;
					var value = data[i].id;
					if (isDatalist) {
						$('<li>'+label+ '</li>').appendTo(element);
					} else {
						$('<li class="list-group-item" value=\"' + value + '\">' + label + "</li>").appendTo(element);
					}
				}
			}).fail(function(msg){
				alert("error loading items, please check connexion to webservice");
			});
		},


		getViewsList:  function(e) {
			var id=e.currentTarget.getAttribute("value");
			$('#export-views').empty();
			$('#export-themes li').each(function( index ) {
				$(this).removeClass('validated');
			});
			$(e.target).addClass('validated');

			var url = config.coreUrl + "/views/list?id_theme=" + id;

			$.ajax({
				url: url,
				dataType: "json",
				context: this,
			}).done(function(data){
				$('#export-views').empty();
				var view;
				for (var i = 0; i < data.length; i++) {
					view = data[i];
					$('<li id="exportViewsList" class="list-group-item" value=\"' + view.relation + '\">' + view.caption + '</li>').appendTo('#export-views');
				};
			}).fail(function(msg){
				alert("error loading views, please check connexion to webservice");
			});
		},



		enableNext: function(e){
			this.viewName = $(e.target).get(0).attributes["value"].value;
			this.literalName = $($(e.target).get(0)).html();
			$('#export-views li').each(function( index ) {
				$(this).removeClass('validated');
			});
			$(e.target).addClass('validated');


			$('.btn-next').removeAttr('disabled');
			this.radio.command('viewName', {
				viewName: this.viewName,
				literalName: this.literalName,
			});
		},

	});
});
