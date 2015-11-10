define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'i18n'
], function($, _, Backbone, Marionette, config
){
	'use strict';
	return Marionette.LayoutView.extend({
		className: 'full-height', 
		template: 'app/modules/export/templates/tpl-export-step1.html',

		name : ' Choose the view to export',

		ui: {
			'themes' : '#themes',
			'views' : '#views',
			'requirement': '#requirement'
		},

		events: {
			'click #themes>li': 'getViews',
			'click #views>li': 'enableNext',
		},


		initialize: function(options){
			this.model = new Backbone.Model();
			this.themeColl = new Backbone.Collection();
			this.themeColl.url = config.coreUrl+'export/themes';
			this.defered = this.themeColl.fetch();
		},

		onShow : function(){
			var _this = this;
			$.when( this.defered ).done(function() {
				_this.themeColl.each(function(model, index){
					var line = $('<li class="list-group-item" value="' + model.get('ID') + '">' + model.get('Caption') + '</li>');
					_this.ui.themes.append(line);
				});
			});
		},

		getViews: function(e){
			var _this = this;

			this.ui.themes.find('.active').removeClass('active');
			$(e.target).addClass('active');
			

			this.viewColl = new Backbone.Collection();
			var id = $(e.target).val();
			this.viewColl.url = config.coreUrl+'export/themes/' + id + '/views';
			var defered = this.viewColl.fetch();

			_this.ui.views.empty();
			$.when( defered ).done(function(){
				_this.viewColl.each(function(model, index){
					var line = $('<li class="list-group-item" value="' + model.get('ID') + '">' + model.get('Caption') + '</li>');
					_this.ui.views.append(line);
				});
			});
		},


		enableNext: function(e){
			this.ui.views.find('.active').removeClass('active');
			$(e.target).addClass('active');
			var id = $(e.target).val();
			this.ui.requirement.attr('value', id).change();

			this.model.set('viewId', id);

		},

		validate: function(){
			return this.model;
		},

		check: function(){
			return true;
		},

	});
});
