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
			if( !this.model.get("validated") )
			this.model.set("validated" , 1 ); //Si focus alors la photo est vu
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
			switch(this.model.get("validated") ) {
				case 2 : {
					this.$el.addClass("accepted");
					break;
				}
				case 4 : {
					this.$el.addClass("refused");
					break;
				}

				}
		/*	if( this.model.get("validated") === true )
				this.$el.addClass("accepted");
			else if( this.model.get("validated") === false )
				this.$el.addClass("refused");*/

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

		changeValid: function(e){
			var _this = this;
			console.log("modele change");
			console.log(e);
			this.model.save(
				e.Changed,{
					error : function() {
							//TODO faire une alerte pour informer l'utilisateur que sa modif n'a pas été pris en compte
							console.log("une erreur je repercute pas");
							_this.model.set(_this.model.previousAttributes(),{silent: true});
							var n = noty({
								layout : 'bottomLeft',
								type : 'error',
								text : 'Connection problem modification \n <img src='+_this.model.get('path')+'/thumbnails/'+_this.model.get('name')+'><br> Not modified please retry (if the problem persist check your connection or contact and admin)'
							});
							_this.setVisualValidated(_this.model.get("validated"));
					},
					patch : true,
				 	wait : true,
				}
			);
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
					this.model.set("validated" , 2 );
					this.setVisualValidated(2);
					break;
				}
			}
		},

		setVisualValidated : function(valBool){
			switch(this.model.get("validated") ) {
				case 2 : {
					if( this.$el.hasClass('refused') ) this.$el.removeClass('refused');
					if( !this.$el.hasClass('accepted') ) this.$el.addClass("accepted");
					break;
				}
				case 4 : {
					if( this.$el.hasClass('accepted') ) this.$el.removeClass('accepted');
					if( !this.$el.hasClass('refused') ) this.$el.addClass("refused");
					break;
				}
			}
		},

		onDestroy: function(){
			console.log("bim destroy");
		}

	});

});
