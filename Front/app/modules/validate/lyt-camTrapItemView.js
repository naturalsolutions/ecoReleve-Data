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
	// 'bootstrap-star-rating',


], function ($, _, Backbone, Marionette, Translater, config, ModalView, CamTrapImageModel, ezPlus, BckMrtKeyShortCut, noty/*, btstrp_star*/) {

	'use strict';
	return Marionette.ItemView.extend({
		model: CamTrapImageModel, //ImageModel,
		keyShortcuts: {
			//'space': 'onClickImage',
		},
		modelEvents: {
			"change": "changeValid"
		},
		events: {
			// 'click img': 'clickFocus',
			'dblclick img': 'goFullScreen',
			// 'click .js-tag': 'addTag'
		},
		ui : {
			'vignette' : '.vignette'
		},
		className: 'col-md-2 imageCamTrap',
		template: 'app/modules/validate/templates/tpl-image.html',


		// TODO REMOVE BACK CONTROL ON GALLERY 
		// we just have to handle click on img itemview on gallery
		// clickFocus: function (e) {
		// 	this.$el.find('img').focus();
		// 	if (e.ctrlKey) {
		// 		if( this.parent.tabSelected.length ) {
		// 			this.parent.tabSelected.push(this.parent.currenPosition)
		// 		}
		// 		console.log("LE FOCUS ET LE CTRL KEY");

		// 	} else {
		// 		var lastPosition = this.parent.currentPosition;
		// 		if (lastPosition === null)
		// 			lastPosition = 0;
		// 		//TODO fait bugguer la position pour le
		// 		this.parent.currentPosition = this.parent.currentCollection.indexOf(this.model);
		// 		if (this.parent.tabView[lastPosition].$el.find('.vignette').hasClass('active')) {
		// 			this.parent.tabView[lastPosition].$el.find('.vignette').removeClass('active');
		// 		}
		// 		if (this.parent.tabSelected.length > 0) { //supprime les elements select
		// 			$('#gallery .ui-selected').removeClass('ui-selected').removeClass('already-selected');
		// 			for (var i of this.parent.tabSelected) {
		// 				if (lastPosition != i)
		// 					this.parent.tabView[i].$el.find('.vignette').toggleClass('active');
		// 			}
		// 		}
		// 		this.parent.tabSelected = [];
		// 		this.handleFocus();
		// 		if (lastPosition != this.parent.currentPosition) {
		// 			this.parent.rgImageDetails.currentView.changeDetails(this.model)
		// 		}
		// 	}
		// },

		setActive : function(e) {
			if( this.el.className.indexOf(' active') == -1 ) {
				this.el.className += ' active'
			}
			if( this.el.className.indexOf(' ui-selected') == -1 ) {
				this.el.className += ' ui-selected'
			}

			if( this.ui.vignette[0].className.indexOf(' active') == -1 ) {
				this.ui.vignette[0].className += ' active'
			}
		},

		removeActive : function(e) {
			if( this.el.className.indexOf(' active') > -1) {
				this.el.className = this.el.className.replace(' active', '' );
			}
			if( this.el.className.indexOf(' ui-selected') > -1) {
				this.el.className = this.el.className.replace(' ui-selected', '' );
			}
			if( this.ui.vignette[0].className.indexOf(' active') > -1 ) {
				this.ui.vignette[0].className = this.ui.vignette[0].className.replace(' active', '' );
			}
		},

		handleFocus: function (e) {
			if (this.parent.tabSelected.length > 0) {
				$('#gallery .ui-selected').removeClass('ui-selected');
				$('#gallery').trigger('unselected')
				for (var i of this.parent.tabSelected) {
					this.parent.tabView[i].$el.find('.vignette').toggleClass('active');
				}
			}
			this.$el.find('.vignette').toggleClass('active');
			this.$el.find('img').focus();
			this.parent.tabSelected = [];
			this.parent.fillTagsInput();
			this.parent.rgToolsBar.currentView.changeModel(this.model);
		},

		initialize: function (options) {
			this.parent = options.parent;
			this.lastzoom = null;
		},

		onRender: function () {
			this.setVisualValidated(this.model.get("validated"));
		},

		changeValid: function (e) {
			var _this = this;
			var detectError = false;
			this.model.save(
				e.Changed, {
					error: function () {
						detectError = true;
						_this.model.set(_this.model.previousAttributes(), {
							silent: true
						});
						var n = noty({
							layout: 'bottomLeft',
							type: 'error',
							text: 'Connection problem for modification \n <br> Not modified please retry (if the problem persist check your connection or contact an admin)'
						});
						_this.setVisualValidated(_this.model.get("validated"));
					},
					success: function () {
						_this.parent.refreshCounter();
						//_this.render();
					},
					patch: true,
					wait: true,
				}
			);
		},

		setModelTags: function (xmlTags) {
			this.model.set("tags", xmlTags);
		},

		addModelTags : function(tagsStr) {
			var oldTags = this.getModelTags();
			var oldTabTags = [];
			var tabTags = [];
			if( oldTags ) {
				oldTabTags = oldTags.split(',');
			}
			if(tagsStr) {
				tabTags = tagsStr.split(',');
			}
			var uniqTabTags = _.union(oldTabTags,tabTags);
			if(uniqTabTags.length > 0 ) {
				this.setModelTags(uniqTabTags.join(','))
			}
		},

		getModelTags: function () {
			return this.model.get("tags");
		},

		destroyAStation : function(stationId) {
			return $.ajax({
			  type: 'DELETE',
			  url: config.coreUrl + 'stations/' + stationId,
			  contentType: 'application/json'
			})  
		},

		setModelValidatedSilent: function(val) {
			this.model.set({
				validated: val
			}, {
				silent: true
			})
			this.setVisualValidated(val);


		},

		setModelValidated: function (val) {
			var _this = this;
			if(val === 4) {
				var stationId = this.model.get('stationId'); 
				if (stationId) {
					this.destroyAStation(stationId)
					.done(function(resp) {
						_this.model.set({
							validated: val,
							tags : null,
							stationId : null 
						});
						_this.parent.toolsBar.$elemTags.val(null).trigger('change');
						_this.setVisualValidated(val);
						_this.setVisualStationAttached(false);
					})
					.fail(function(err) {
						console.error('destroy station failed')
					});
				}
				else {
					_this.model.set({
						validated: val,
						tags : null
					});
					_this.parent.toolsBar.$elemTags.val(null).trigger('change');
					_this.setVisualValidated(val);
					_this.setVisualStationAttached(false);
				}
			
			}
			else {
				this.model.set({
					validated: val
				});
				this.setVisualValidated(val);
			}
			
		},

		setVisualStationAttached: function (valBoolean) {
			var header = this.el.getElementsByClassName('camtrapItemViewHeader')[0];
			if (valBoolean) {
				if (header.style.display)
					header.style.display = ''
			} else {
				if (header.style.display === '')
					header.style.display = "none";
			}
		},

		setVisualValidated: function (valBool) {
			var $content = this.$el.children('.vignette').children('.camtrapItemViewContent');
			var $image = $content.children('img');

			switch (this.model.get("validated")) {
				case 1:
					{ // not checked
						if ($content.hasClass('accepted')) {
							$content.removeClass('accepted');
						}
						if ($content.hasClass('rejected')) {
							$content.removeClass('rejected');
						}
						$image.removeClass('checked');
						break;
					}
				case 2:
					{
						$image.addClass('checked');
						if ($content.hasClass('rejected')) {
							$content.removeClass('rejected');
						}
						$content.addClass('accepted'); //css("background-color" , "green");
						break;
					}
				case 4:
					{
						$image.addClass('checked');
						if ($content.hasClass('accepted')) {
							$content.removeClass('accepted');
						}
						$content.addClass('rejected'); //css("background-color" , "red");
						break;
					}
				default:
					{
						if ($content.hasClass('accepted')) {
							$content.removeClass('accepted');
						}
						if ($content.hasClass('rejected')) {
							$content.removeClass('rejected');
						}

						$image.removeClass('checked');
						break;
					}
			}
		},

		goFullScreen: function (e) {
			if (!e.ctrlKey) {
				this.parent.displayModal(e);
			}
		},

		onDestroy: function () {
			console.log("bim destroy");
		},

		attachStation: function (id) {
			this.model.set('stationId', id);
			this.setVisualStationAttached(true);
		},
		removeStation: function () {
			this.model.set('stationId', null);
			this.setVisualStationAttached(false);
		},

		removeStationAndReject: function() {
			this.model.set({
				'stationId': null
			},{
				silent : true
			});
			this.setModelValidated(4);
		}

	});

});

