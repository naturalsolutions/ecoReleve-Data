define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
], function($, _, Backbone, Marionette,Translater,Modal ){
	'use strict';
	return Marionette.LayoutView.extend({
		template: 'app/ns_modules/ns_toolbar/templates/tpl-modal.html',
		className: 'full-height animated white rel',
		region : {
			'contentRg' : '#modalContent'
		},
		events : {
			'click .cancel' : 'hideModal',
		},
		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.rg = options.rg;
			this.title = options.title;  
		},
		onRender: function(){
			this.$el.i18n();
		},
		onShow : function(){
			$('.modal-title').text(this.title);
		
		},
		hideModal : function(){
			this.contentRg.empty();
			this.rg.hideModal();
		}
	});
});