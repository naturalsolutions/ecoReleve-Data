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


], function($, _, Backbone, Marionette, Translater, config , ModalView , CamTrapImageModel ,ezPlus, BckMrtKeyShortCut ) {

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
			'click img':'doFocus',
			'focusin' : 'handleFocus',
			//'dblclick':'handleFocus',
			//'mouseenter .image': 'hoveringStart',
		//	'mouseleave': 'hoveringEnd',
		//	'keydown' : 'keyPressed',
		//	'focusin' : 'handleFocus',
		//	'focusout' : 'leaveFocus',
			'click .js-tag': 'addTag'
		},
		className : 'col-md-2 text-center imageCamTrap',
		template : 'app/modules/validate/templates/tpl-image.html',
		doFocus : function(){
			this.$el.find('img').focus();
		},
		handleFocus: function(){
			this.parent.currentViewImg = this;
			this.parent.currentPosition = this.parent.myImageCollection.indexOf(this.model);
			console.log("on a eu le focus on va retour positon :"+this.parent.currentPosition);
		},
		leaveFocus: function(){
		},
		testModal: function(e){
			e.preventDefault();
		},

		initialize : function(options) {
			this.parent = options.parent;
		},

		onRender: function(){
			this.$("#zoom_"+this.model.get("id")).ezPlus({
				zoomWindowPosition: 'preview',
				preloading: false,
				responsive: true,
				scrollZoom: true,
				zoomWindowPosition: 11,
				zoomWindowOffsetX: -15,
				zoomWindowHeight: 400,
				zoomWindowWidth: 600,
				loadingIcon: false,// link to spinner
			});
		},

		hoveringStart: function(e){
			var flagStatus = this.model.get("validated")
			 if( flagStatus == null ){
				 this.model.set("validated",true)
			 }
			/* else{
				 flagStatus = !flagStatus //inverse booleen
				 this.model.set("validated",flagStatus)
			 }*/

			//afficher le menu
		},
		hoveringEnd: function(e){
			if( this.model.hasChanged("validated") )
			{
				this.model.save();
			}
			else{
			}
		},

		changeValid: function(){
		},
		onClickImage: function(e){
			this.$el.find('img').focus();
			var _this = this;
			this.parent.rgModal.show(new ModalView({model: this.model}));
			this.parent.currentViewImg = this;
			console.log(this.parent.myImageCollection.indexOf(this.model));
			/*
			var flagStatus = this.model.get("validated")
			if( flagStatus == null ){
				this.model.set("validated",true)
			}
			else{
				flagStatus = !flagStatus //inverse booleen
				this.model.set("validated",flagStatus)
				if(!flagStatus) $(e.currentTarget).css("opacity",0.2);
				else $(e.currentTarget).css("opacity",1);
			}

		*/


		/*  if (this.model.get("checked") ){
				if ( !this.model.get("validated") )
				{
					this.model.set("validated", true)
				}
				else{
					this.model.set("validated", false)
				}
			}
			if( !this.model.get("checked") ) {
				this.model.set("checked", true)
			}*/
		}
	});

});
