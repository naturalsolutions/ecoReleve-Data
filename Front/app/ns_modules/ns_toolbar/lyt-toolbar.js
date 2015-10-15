define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'./modal-region',
	'./lyt-new-element',
], function($, _, Backbone, Marionette,Translater,ModalRg,LytModal ){
	'use strict';
	return Marionette.LayoutView.extend({
		template: 'app/ns_modules/ns_toolbar/templates/tpl-toolbar.html',
		regions: {
			'newElement' : ModalRg
		},
		events : {
			'click .cancel' : 'hideModal',
			'click #createNew' : 'showModal'
		},
		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.rg = options.rg;
			// create a view or a layout representing the content of the modal window
			this.content = options.content;
			this.modalTitle = options.modalTitle;
		},
		onRender: function(){
			this.$el.i18n();
		},
		hideModal : function(){
			this.rg.hideModal();
		},
		showModal : function(){
			this.lytModal = new LytModal({rg : this.newElement, title : this.modalTitle});
			//  the modal window
			this.newElement.show(this.lytModal);
			this.lytModal.addRegions({
				'contentRg' : '#modalContent'
			});
			// the content of modal window
			var contentLyt = new this.content();
			this.lytModal.contentRg.show(contentLyt);
		}
	});
});
