/**

	TODO:
	- header class hide : see router.js & app.js

**/

define(['marionette', 'config', './lyt-breadCrumb'],
function(Marionette, config, Breadcrumb) {
	'use strict';
	return Marionette.LayoutView.extend({
		template: 'app/base/header/tpl-header.html',
		className: 'header',
		events: {
			'click #logout' : 'logout',
		},
		regions: {
			'breadcrumb': '#breadcrumb'
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
			//this.breadcrumb.show(new Breadcrumb());
		},
	});
});
