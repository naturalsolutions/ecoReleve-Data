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
		handleFocus: function() {
			this.parent.currentViewImg = this;
			//TODO fait bugguer la position pour le
			this.parent.currentPosition = this.parent.currentCollection.indexOf(this.model);
			this.parent.fillTagsInput();
		},
		leaveFocus: function() {
		},
		testModal: function(e) {
			e.preventDefault();
		},

		initialize : function(options) {
			this.parent = options.parent;
		},

		onRender: function(){
			if( this.model.get("validated") === true )
				this.$el.addClass("accepted");
			else if( this.model.get("validated") === false )
				this.$el.addClass("refused");

		/*	this.$("#zoom_"+this.model.get("id")).ezPlus({
				zoomWindowPosition: 'preview',
				preloading: false,
				responsive: true,
				scrollZoom: true,
				zoomWindowPosition: 11,
				zoomWindowOffsetX: -15,
				zoomWindowHeight: 400,
				zoomWindowWidth: 600,
				loadingIcon: false,// link to spinner
			});*/
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

		changeValid: function(e){
			console.log("modele change");
			console.log(e);
			//TODO pb model dans full collection et collection
			this.model.save(e.Changed,{patch:true});
			//this.render();
		},

		setModelTags : function(xmlTags){
			this.model.set("tags",xmlTags);
		},

		getModelTags: function(){
			return this.model.get("tags");
		},

		setModelValidated: function(valBool) {
			if( typeof valBool == "boolean" ) {
				this.model.set("validated",valBool);
				this.setVisualValidated(valBool);
			}
		},

		toggleModelStatus : function (){
			var flagStatus = this.model.get("validated")
			if( flagStatus == null ){
				flagStatus = true;
				this.model.set("validated",true)
			}
			else{
				flagStatus = !flagStatus //inverse booleen
				this.model.set("validated",flagStatus)
			}
			this.setVisualValidated(flagStatus);

		},

		setVisualValidated : function(valBool){
			if( valBool ) {
				if( this.$el.hasClass('refused') ) this.$el.removeClass('refused');
				if( !this.$el.hasClass('accepted') ) this.$el.addClass("accepted");
			}
			else {
				if( this.$el.hasClass('accepted') ) this.$el.removeClass('accepted');
				if( !this.$el.hasClass('refused') ) this.$el.addClass("refused");
			}
		},

		onDestroy: function(){
			console.log("bim destroy");
		}

	});

});
