define(['app'], function(app){
	'use strict';
	return Backbone.Marionette.Controller.extend({
		login: function(){
			console.log('login!');
		},
	});
});