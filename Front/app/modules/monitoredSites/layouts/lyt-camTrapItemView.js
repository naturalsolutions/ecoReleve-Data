define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',
	'./lyt-camTrapModal',
	'./lyt-camTrapImageModel',
	'ez-plus',
  'backbone.marionette.keyShortcuts',
	'noty',
	'bootstrap-star-rating',


], function($, _, Backbone, Marionette, Translater, config , ModalView , CamTrapImageModel ,ezPlus, BckMrtKeyShortCut, noty, btstrp_star ) {

  'use strict';
  return Marionette.ItemView.extend({
		model: CamTrapImageModel,//ImageModel,
		keyShortcuts :{
			//'space': 'onClickImage',
		},
		events:{
			'click img':'clickFocus',
			'dblclick img': 'goFullScreen'
		},
		className : 'col-md-2 imageCamTrap',
		template : 'app/modules/monitoredSites/templates/tpl-image.html',

		clickFocus : function(e){
		this.$el.find('img').focus();
		if( e.ctrlKey) {
			// console.log("LE FOCUS ET LE CTRL KEY");
		} else {
				var lastPosition = this.parent.currentPosition;
			if(lastPosition === null)
			lastPosition = 0;
			//this.parent.currentViewImg = this;
			//TODO fait bugguer la position pour le
			this.parent.currentPosition = this.parent.currentCollection.indexOf(this.model);
			if ( this.parent.tabView[lastPosition].$el.find('.vignette').hasClass('active') ) {
			this.parent.tabView[lastPosition].$el.find('.vignette').removeClass('active');
			}
			if( this.parent.tabSelected.length > 0) {//supprime les elements select
				$('#gallery .ui-selected').removeClass('ui-selected').removeClass('already-selected');
				for ( var i of this.parent.tabSelected ) {
					if( lastPosition != i  )
					this.parent.tabView[i].$el.find('.vignette').toggleClass('active');
				}
			}
			this.parent.tabSelected = [] ;
			this.handleFocus();
		/*	if( lastPosition != this.parent.currentPosition) {
				this.parent.rgImageDetails.currentView.changeDetails(this.model)
			}*/
				}
		},

		handleFocus: function(e) {
			if( this.parent.tabSelected.length > 0) {
				$('#gallery .ui-selected').removeClass('ui-selected');
				$('#gallery').trigger('unselected')
				for ( var i of this.parent.tabSelected ) {
					this.parent.tabView[i].$el.find('.vignette').toggleClass('active');
				}
			}
			this.$el.find('.vignette').toggleClass('active');
			this.$el.find('img').focus();
			this.parent.tabSelected = [] ;

		},
		hoveringStart:function(){
		},

		initialize : function(options) {
			this.parent = options.parent;
			this.lastzoom = null;
		},

		onRender: function(){
			var _this = this;
			var $input = this.$el.find('input');
			var $icon = this.$el.children('.vignette').children('.camtrapItemViewHeader').children('i');
			var lastClass = $icon.attr('class').split(' ').pop();
	/*		var $icon = this.$el.children('.vignette').children('.camtrapItemViewHeader').children('i');
			var lastClass = $icon.attr('class').split(' ').pop();*/
			this.$el.find('input').rating({
				min:0,
				max:5,
				step:1,
				size:'xs',
				displayOnly: true,
				rtl:false,
				showCaption:false,
				showClear:false,
				value : _this.model.get('note')
			});

		},

		goFullScreen: function(e) {
			if (!e.ctrlKey) {
				this.parent.displayModal(e);
			}
		},

		onDestroy: function() {
		},


	});

});
