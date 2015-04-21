/**

	TODO:
	- header class hide : see router.js & app.js

**/


define(['marionette', 'config'],
function(Marionette, config) {
	'use strict';
	return Marionette.LayoutView.extend({
		template: 'app/base/header/tpl-header.html',
		className: 'header',
		events: {
			'click #logout' : 'logout',
		},

		logout: function(){
			$.ajax({
				context: this,
				url: config.coreUrl + 'security/logout'
			}).done( function() {
				Backbone.history.navigate('login', {trigger: true});
			});
		},

		onShow: function(){
			
		},
	});
});
