define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'./modal-region',
	'./lyt-new-element',
	'tooltipster-list',
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
			this.detailsView = options.detailsView;
			// create a view or a layout representing the content of the modal window
			this.content = options.content;
			this.modalTitle = options.modalTitle;
			this.items = options.items;
			$('.tooltip').tooltipster();
		},
		onRender: function(){
			this.$el.i18n();
		},
		hideModal : function(){
			this.rg.hideModal();
		},
		showModal : function(e){
			/*this.lytModal = new LytModal({rg : this.newElement, title : this.modalTitle});
			//  the modal window
			this.newElement.show(this.lytModal);
			this.lytModal.addRegions({
				'contentRg' : '#modalContent'
			});
			// the content of modal window
			var contentLyt = new this.content();
			this.lytModal.contentRg.show(contentLyt);*/
			var self = this;
			$(e.target).tooltipList({

                position: 'top',
                //  pass avalaible options
                availableOptions: self.items,
                //  li click event
                liClickEvent: $.proxy(function (liClickValue, origin, tooltip) {
                    self.lytModal = new LytModal({rg : self.newElement, title : self.modalTitle, detailsView : this.detailsView, val : liClickValue });
										//  the modal window
										self.newElement.show(self.lytModal);
										self.lytModal.addRegions({
											'contentRg' : '#modalContent'
										});
										// the content of modal window
										var contentLyt = new self.content();
										self.lytModal.contentRg.show(contentLyt);
										// details view in modal 
										contentLyt.details.show(new self.detailsView({type :liClickValue, parent : self}));
										
										
 
                console.log(liClickValue);
                //console.log(origin);
                }, this),
            });
            //// Use tooltipList plugin
		}
	});
});
