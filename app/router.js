define(['marionette', 'backbone', 'config', './base/login/lyt-login', './base/header/lyt-header'],
function(Marionette, Backbone, config, LytLogin, LytHeader){
	'use strict';
	return Marionette.AppRouter.extend({
		appRoutes: {
			'*route(/:page)': 'home'
		},
		execute: function(callback, args)
		{
			$.ajax({
				context: this,
				url: config.coreUrl + 'security/has_access'
			}).done( function() {
				this.insertHeader();
				callback.apply(this, args);
			}).fail( function(msg) {
				this.options.controller.rgHeader.empty();
				this.options.controller.rgMain.show(new LytLogin());
				Backbone.history.navigate('login', {trigger: true});
			});
		},
		insertHeader: function(){
			this.options.controller.rgHeader.show( new LytHeader());
		},
	});
});
