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


], function ($, _, Backbone, Marionette, Translater, config, ModalView, CamTrapImageModel, ezPlus, BckMrtKeyShortCut, noty, btstrp_star) {

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
			'click img': 'clickFocus',
			'dblclick img': 'goFullScreen',
			'click .js-tag': 'addTag'
		},
		className: 'col-md-2 imageCamTrap',
		template: 'app/modules/validate/templates/tpl-image.html',

		clickFocus: function (e) {
			this.$el.find('img').focus();
			if (e.ctrlKey) {
				console.log("LE FOCUS ET LE CTRL KEY");
			} else {
				var lastPosition = this.parent.currentPosition;
				if (lastPosition === null)
					lastPosition = 0;
				//TODO fait bugguer la position pour le
				this.parent.currentPosition = this.parent.currentCollection.indexOf(this.model);
				if (this.parent.tabView[lastPosition].$el.find('.vignette').hasClass('active')) {
					this.parent.tabView[lastPosition].$el.find('.vignette').removeClass('active');
				}
				if (this.parent.tabSelected.length > 0) { //supprime les elements select
					$('#gallery .ui-selected').removeClass('ui-selected').removeClass('already-selected');
					for (var i of this.parent.tabSelected) {
						if (lastPosition != i)
							this.parent.tabView[i].$el.find('.vignette').toggleClass('active');
					}
					var $inputTags = this.parent.toolsBar.$el.find("#tagsInput");
					var $inputTag = this.parent.toolsBar.$el.find(".bootstrap-tagsinput input");
					var $bootstrapTag = this.parent.toolsBar.$el.find(".bootstrap-tagsinput");
					if ($inputTags.prop("disabled")) {
						$inputTag.prop("disabled", false);
						$inputTags.prop("disabled", false);
						$bootstrapTag.css("visibility", "visible");
					}
				}
				this.parent.tabSelected = [];
				this.handleFocus();
				if (lastPosition != this.parent.currentPosition) {
					this.parent.rgImageDetails.currentView.changeDetails(this.model)
				}
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
		},
		hoveringStart: function () {
			console.log("je survole la photo");
			console.log("je charge la photo");
		},

		initialize: function (options) {
			this.parent = options.parent;
			this.lastzoom = null;
		},

		onRender: function () {
			var _this = this;
			var $input = this.$el.find('input');
			var $icon = this.$el.children('.vignette').children('.camtrapItemViewHeader').children('i');
			var lastClass = $icon.attr('class').split(' ').pop();
			this.$el.find('input').rating({
				min: 0,
				max: 5,
				step: 1,
				size: 'xs',
				rtl: false,
				showCaption: false,
				showClear: false,
				value: _this.model.get('note')
			});
			this.$el.find('.rating-container').addClass('hide');
			$input.on('rating.change', function (event, value, caption) {
				_this.model.set('note', value);
			});
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

		getModelTags: function () {
			return this.model.get("tags");
		},

		setModelValidated: function (val) {
			var oldVal = this.model.get("validated");
			var $icon = this.$el.children('.vignette').children('.camtrapItemViewHeader').children('i');
			this.model.set("validated", val);
			this.setVisualValidated(val);
		},

		toggleModelStatus: function () {
			switch (this.model.get("validated")) {
				case 0:
					{
						this.setModelValidated(1);
						break;
					}
				case 1:
					{
						this.setModelValidated(2);
						break;
					}

				case 2:
					{
						this.setModelValidated(4);
						break;
					}
				case 4:
					{
						this.setModelValidated(1);
						break;
					}
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
			var $icon = this.$el.children('.vignette').children('.camtrapItemViewHeader').children('i');
			var $content = this.$el.children('.vignette').children('.camtrapItemViewContent');
			var $image = $content.children('img');
			var $ratingStar = this.$el.find('.rating-container');

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
						if (!$ratingStar.hasClass('hide')) {
							$ratingStar.addClass('hide');
						}

						break;
					}
				case 2:
					{
						$image.addClass('checked');
						if ($content.hasClass('rejected')) {
							$content.removeClass('rejected');
						}
						$content.addClass('accepted'); //css("background-color" , "green");
						if ($ratingStar.hasClass('hide')) {
							$ratingStar.removeClass('hide');
						}

						break;
					}
				case 4:
					{
						$image.addClass('checked');
						if ($content.hasClass('accepted')) {
							$content.removeClass('accepted');
						}
						$content.addClass('rejected'); //css("background-color" , "red");
						if (!$ratingStar.hasClass('hide')) {
							$ratingStar.addClass('hide');
						}

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
						if (!$ratingStar.hasClass('hide')) {
							$ratingStar.addClass('hide');
						}
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

		setStars: function (val) {
			var $input = this.$el.find('input');
			val = parseInt(val)
			if (val > 0 && val <= 5) {
				$input.rating('update', val).val();
				$input.trigger('rating.change', [val, null]);
			}

		},

		increaseStar: function () {
			var $input = this.$el.find('input');
			var val = parseInt($input.rating().val());
			if (val + 1 <= 5) {
				$input.rating('update', val + 1).val();
				$input.trigger('rating.change', [val + 1, null]);

			}
		},
		decreaseStar: function () {
			var $input = this.$el.find('input');
			var val = parseInt($input.rating().val());
			if (val - 1 > 0) {
				$input.rating('update', val - 1).val();
				$input.trigger('rating.change', [val - 1, null]);
			}
		},
		attachStation: function (id) {
			this.model.set('stationId', id);
			this.setVisualStationAttached(true);
		},
		removeStation: function () {
			this.model.set('stationId', null);
			this.setVisualStationAttached(false);
		}

	});

});

