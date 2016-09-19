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
		className : 'col-md-2 imageCamTrap',
		template : 'app/modules/validate/templates/tpl-image.html',

		clickFocus : function(e){
		this.$el.find('img').focus();
		if( e.ctrlKey) {
			console.log("LE FOCUS ET LE CTRL KEY");
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
			//console.log(this.parent.tabSelected.length);
			if( this.parent.tabSelected.length > 0) {//supprime les elements select
				console.log("ON SUPPRRRIMMMEE");
				$('#gallery .ui-selected').removeClass('ui-selected').removeClass('already-selected');
				for ( var i of this.parent.tabSelected ) {
					if( lastPosition != i  )
					this.parent.tabView[i].$el.find('.vignette').toggleClass('active');
				}
			}
			this.parent.tabSelected = [] ;
			this.handleFocus();
			if( lastPosition != this.parent.currentPosition) {
				this.parent.rgImageDetails.currentView.changeDetails(this.model)
						}
			}
		},

		handleFocus: function(e) {
			//console.log(" la liste :")
			//console.log(this.parent.tabSelected);
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
			var _this = this;
			var $input = this.$el.find('input');
			var $icon = this.$el.children('.vignette').children('.camtrapItemViewHeader').children('i');
			var lastClass = $icon.attr('class').split(' ').pop();
			this.$el.find('input').rating({
				min:0,
				max:5,
				step:1,
				size:'xs',
				rtl:false,
				showCaption:false,
				showClear:false,
				value : _this.model.get('note')
			});
			this.$el.find('.rating-container').addClass('hide');
			$input.on('rating.change', function(event, value, caption) {
			    _this.model.set('note',value);
			});


			//this.$el.find('rating-container').addClass('hide');
			//this.$el.find('.rateit').bind('rated', function() { alert('rating: ' + $(this).rateit('value')); });
			this.setVisualValidated( this.model.get("validated") );
		/*	switch(this.model.get("validated") ) {
				case 1 : {
					//console.log(this.$icon);
					//this.$el.addClass("checked");
					$icon.removeClass( lastClass );
					$icon.addClass('reneco-support');
					break;
				}
				case 2 : {
				//	this.$el.addClass("accepted");
					$icon.removeClass( lastClass );
					$icon.addClass('reneco-checked');
					this.$el.find('.rating-container').removeClass('hide');
					break;
				}
				case 4 : {
					//this.$el.addClass("refused");
					$icon.removeClass( lastClass );
					$icon.addClass('reneco-close');
					break;
				}
				default:{
					//this.$el.addClass("notchecked");
					break;
				}

			}*/
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
					  //_this.render();
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
			var oldVal = this.model.get("validated");
			var $icon = this.$el.children('.vignette').children('.camtrapItemViewHeader').children('i');

			switch(oldVal ) {
				case 1 :{// not checked
					$icon.removeClass('reneco-support');
					break;
				}
				case 2 : {
					$icon.removeClass('reneco-checked');
					break;
				}
				case 4 : {
					$icon.removeClass('reneco-close');
					break;
				}
				default: {
					console.log("valeur defaut");
					$icon.removeClass('reneco-hidden');
					break;
				}
			}
		/*	if ( oldVal === val) {
				this.model.set("validated",1);
				this.setVisualValidated(1);
			}
			else {*/
				this.model.set("validated",val);
				this.setVisualValidated(val);
			//}
		},

		toggleModelStatus : function (){
			switch( this.model.get("validated") ){
				case 0 : {
					this.setModelValidated(1);
					/*this.model.set("validated", 1 );
					this.setVisualValidated(1);*/
					break;
				}
				case 1 : {
					this.setModelValidated(2);
				/*	this.model.set("validated", 2 );
					this.setVisualValidated(2);*/
					break;
				}

				case 2 :{
					this.setModelValidated(4);
				/*	this.model.set("validated", 4 );
					this.setVisualValidated(4);*/
					break;
				}
				case 4 : {
					this.setModelValidated(1);
				/*	this.model.set("validated" , 1 );
					this.setVisualValidated(1);*/
					break;
				}
			}
		},

		setVisualValidated : function(valBool){
			var $icon = this.$el.children('.vignette').children('.camtrapItemViewHeader').children('i');
			var $content = this.$el.children('.vignette').children('.camtrapItemViewContent')
			var $image = $content.children('img')
			//var $icon2 = this.$el.find('.camtrapItemViewContent > i');
			//var lastClass = $icon.attr('class').split(' ').pop();

			switch(this.model.get("validated") ) {
				case 1 :{// not checked
				//	$icon.removeClass( lastClass );
					$icon.addClass('reneco-support');
					this.$el.find('.rating-container').addClass('hide');

					break;
				}
				case 2 : {
				//	$icon.removeClass( lastClass );
					$icon.addClass('reneco-checked');
					$image.addClass('checked');
					$content.css("background-color" , "green");
					this.$el.find('.rating-container').removeClass('hide');

					break;
				}
				case 4 : {
				//	$icon.removeClass( lastClass );
					$icon.addClass('reneco-close');
					$image.addClass('checked');
					$content.css("background-color" , "red");
					this.$el.find('.rating-container').addClass('hide');

					break;
				}
			}
		},

		goFullScreen: function(e) {
			if (!e.ctrlKey) {
				this.parent.displayModal(e);
			}
		},

		onDestroy: function() {
			console.log("bim destroy");
		},

		setStars: function( val ) {
			var $input = this.$el.find('input');
			val = parseInt(val)
			if(val > 0 && val <= 5) {
				$input.rating('update', val).val();
				$input.trigger('rating.change', [val , null]);
			}

		},

		increaseStar: function() {
			var $input = this.$el.find('input');
			var val = parseInt($input.rating().val());
			if( val+1 <=5) {
				$input.rating('update', val+1).val();
				$input.trigger('rating.change', [val+1 , null]);

			}
		//	this.$el.find('.rateit').rateit('value',this.$el.find('.rateit').rateit('value') +1 );
		},
		decreaseStar: function() {
			var $input = this.$el.find('input');
			var val = parseInt($input.rating().val());
			if( val-1 > 0){
				$input.rating('update', val-1).val();
				$input.trigger('rating.change', [val-1 , null]);
			}
	//		this.$el.find('.rateit').rateit('value',this.$el.find('.rateit').rateit('value') - 1 );
		}

	});

});
