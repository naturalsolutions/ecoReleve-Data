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


], function($, _, Backbone, Marionette, Translater, config , ModalView , CamTrapImageModel ,ezPlus, BckMrtKeyShortCut, noty ) {

  'use strict';
  return Marionette.ItemView.extend({
		model: CamTrapImageModel,//ImageModel,
		keyShortcuts :{
			//'space': 'onClickImage',
		},
		modelEvents: {
			"change": "changeValid"
		},
		events:{
			'click img':'clickFocus',
			//'focusin img' : 'handleFocus',
			'dblclick img': 'goFullScreen',
		//	'mouseenter img': 'hoveringStart',
		//	'keydown' : 'keyPressed',
		//	'focusin' : 'handleFocus',
		//	'focusout' : 'leaveFocus',
			'click .js-tag': 'addTag'
		},
		className : 'col-md-2 text-center imageCamTrap',
		template : 'app/modules/validate/templates/tpl-image.html',

		clickFocus : function(e){
		//	this.$el.find('img').focus();
			var lastPosition = this.parent.currentPosition;
			if(lastPosition === null)
			lastPosition = 0;
			//this.parent.currentViewImg = this;
			//TODO fait bugguer la position pour le
			this.parent.currentPosition = this.parent.currentCollection.indexOf(this.model);
			this.parent.tabView[lastPosition].$el.find('.vignette').toggleClass('active');
			this.handleFocus();
		},

		handleFocus: function(e) {
			this.$el.find('.vignette').toggleClass('active');
			// if( lastPosition != this.parent.currentPosition){
			// 	console.log("on a changé de position on détrui et on instantie");
			// 	console.log(this.lastzoom);
			// 	if( this.lastzoom != null ){
			// 		console.log("on détruit");
			// 		var action='hide'
			// 		this.lastzoom.showHideZoomContainer(action);
			// 		this.lastzoom.showHideWindow(action);
			// 		this.lastzoom.showHideTint(action);
			// 		this.lastzoom.showHideLens(action);
			// 		this.lastzoom.destroy();
			//
			// 	}
			// 	this.$("#zoom_"+this.model.get("id")).ezPlus({
			// 			zoomWindowPosition: '#js_zoom_plus',
			// 			preloading: false,
			// 			responsive: true,
			// 			scrollZoom: true,
			// 			zoomWindowHeight: 400,
			// 			zoomWindowWidth: 600,
			// 			bordersize:0,
			// 			easing: true,
			// 			loadingIcon: false,// link to spinner
			// 		});
			// }
			this.parent.fillTagsInput();
			// if( !this.model.get("validated") )
			// this.model.set("validated" , 1 ); //Si focus alors la photo est vu
			// this.setVisualValidated(1);
		},
		hoveringStart:function(){
			console.log("je survole la photo");
			console.log("je charge la photo");
		},

		initialize : function(options) {
			this.parent = options.parent;
			this.lastzoom = null;
		},

		onRender: function(){
			switch(this.model.get("validated") ) {
				case 1 : {
					this.$el.addClass("checked");
					break;
				}
				case 2 : {
					this.$el.addClass("accepted");
					break;
				}
				case 4 : {
					this.$el.addClass("refused");
					break;
				}
				default:{
					this.$el.addClass("notchecked");
					break;
				}

				}
		/*	if( this.model.get("validated") === true )
				this.$el.addClass("accepted");
			else if( this.model.get("validated") === false )
				this.$el.addClass("refused");*/

		/*	this.$("#zoom_"+this.model.get("id")).ezPlus({
				zoomWindowPosition: 'js_zoom_plus',
				preloading: false,
				responsive: true,
				scrollZoom: true,
				zoomWindowHeight: 400,
				zoomWindowWidth: 600,
				bordersize:0,
				easing: true,
				loadingIcon: false,// link to spinner
			});*/
		},

		changeValid: function(e){
			var _this = this;
			var detectError = false;
			this.model.save(
				e.Changed,{
					error : function() {
							detectError = true;
							_this.model.set(_this.model.previousAttributes(),{silent: true});
							var n = noty({
								layout : 'bottomLeft',
								type : 'error',
								text : 'Connection problem for modification \n <br> Not modified please retry (if the problem persist check your connection or contact an admin)'
							});
							_this.setVisualValidated(_this.model.get("validated"));
					},
					success :function(){
						_this.parent.refreshCounter();
					},
					patch : true,
				 	wait : true,
				}
			);
			if( this.parent.stopSpace && !detectError && this.parent.rgModal.currentView) { // if fullscreen mode refresh view
				this.parent.rgModal.currentView.changeImage(this.model);
			}
			//this.render();
		},

		setModelTags : function(xmlTags){
			this.model.set("tags",xmlTags);
		},

		getModelTags: function(){
			return this.model.get("tags");
		},

		setModelValidated: function(val) {
				this.model.set("validated",val);
				this.setVisualValidated(val);
		},

		toggleModelStatus : function (){
			switch( this.model.get("validated") ){
				case 1 : {
					this.model.set("validated", 2 );
					this.setVisualValidated(2);
					break;
				}

				case 2 :{
					this.model.set("validated", 4 );
					this.setVisualValidated(4);
					break;
				}
				case 4 : {
					this.model.set("validated" , 1 );
					this.setVisualValidated(1);
					break;
				}
				case 0 : {
					this.model.set("validated", 1 );
					this.setVisualValidated(1);
					break;
				}
			}
		},

		setVisualValidated : function(valBool){
			switch(this.model.get("validated") ) {
				case 1 :{// not checked
					if( this.$el.hasClass('notchecked') ) this.$el.removeClass('notchecked');
					if( this.$el.hasClass('refused') ) this.$el.removeClass('refused');
					if( this.$el.hasClass('accepted') ) this.$el.removeClass("accepted");
					if( !this.$el.hasClass('checked') ) this.$el.addClass('checked');
					break;
				}
				case 2 : {
					if( this.$el.hasClass('notchecked') ) this.$el.removeClass('notchecked');
					if( this.$el.hasClass('checked') ) this.$el.removeClass('checked');
					if( this.$el.hasClass('refused') ) this.$el.removeClass('refused');
					if( !this.$el.hasClass('accepted') ) this.$el.addClass("accepted");
					break;
				}
				case 4 : {
					if( this.$el.hasClass('notchecked') ) this.$el.removeClass('notchecked');
					if( this.$el.hasClass('checked') ) this.$el.removeClass('checked');
					if( this.$el.hasClass('accepted') ) this.$el.removeClass('accepted');
					if( !this.$el.hasClass('refused') ) this.$el.addClass("refused");
					break;
				}
			}
		},

		goFullScreen: function(e) {
			this.parent.displayModal(e);
		},

		onDestroy: function(){
			console.log("bim destroy");
		}

	});

});
