//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',
	'ez-plus',
	'./lyt-camTrapImageModel',
	'wheelzoom',
	'imageLoaded',
	'bootstrap-star-rating'

], function($, _, Backbone, Marionette, Translater, config , ezPlus , CamTrapImageModel, wheelzoom , imageLoaded/*, btstrp_star*/ ) {

  'use strict';
	return Marionette.ItemView.extend({
		model: CamTrapImageModel,//ImageModel,
		keyShortcuts :{
			//'space': 'onClickImage',
		},
		ui : {
			'canLeft' : 'i.reneco-chevron_left',
			'canRight' : 'i.reneco-chevron_right'
		},
		events:{
			'click div.leftnavicon' : 'mouveleft',
			'click div.rightnavicon' : 'mouveright'
		},
		className : 'full-height',
		template : 'app/modules/validate/templates/tpl-camTrapModal.html',


		initialize : function(options) {
      		var _this = this;
			this.parent = options.parent;
      		this.model = options.model || new CamTrapImageModel();
			this.position = this.parent.currentCollection.fullCollection.indexOf(this.model) + 1 ;
			this.total = this.parent.currentCollection.fullCollection.length;
			this.theWheel = null;
			this.elems = new Object();
			this.createTemplateElems();
			this.setStatus(this.model.get('validated'))

			this.listenTo(this.model, "change custom:activechange custom:refreshUI", function() {
				_this.setStatus(_this.model.get('validated'))
	
				if( ! this.parent.stopSpace ) {
					_this.render();
				}
				else {
					_this.parent.$el.find('.infosfullscreenStatus').text(' '+_this.statusPhoto+' ');
					_this.$el.find('input').rating('update',_this.model.get('note'));
					// if ( this.model.get('validated') == 2 ) {
					// 	this.$el.find('.rating-container').css('visibility' , 'visible')
					// }
					// else {
					// 		this.$el.find('.rating-container').css('visibility' , 'hidden')
					// }
				}
      });
		},
		createTemplateElems : function() {
			this.elems.container = document.createElement('div');
			this.elems.container.className = 'infosfullscreen';

			this.elems.content = document.createElement('div');
			this.elems.content.className = 'infosfullscreencontent';

			this.elems.status = document.createElement('span');
			this.elems.status.className = 'status';

			// this.elems.station = document.createElement('span');
			// this.elems.station.className = 'station';

			this.elems.date = document.createElement('div');
			this.elems.date.className = 'date';

			this.elems.position = document.createElement('div');
			this.elems.position.className = 'indexposition';
		},

		changeModel : function(model) {



		},

		buildTemplate: function() {
			// this.elems.content.append(this.elems.status);
			// this.elems.content.append(this.elems.station)
			this.elems.container.append(this.elems.date);
			this.elems.container.append(this.elems.status);
			// this.elems.container.append(this.elems.station);
			// this.elems.container.append(this.elems.content);
			this.elems.container.append(this.elems.position);
		},

		setStatus : function(val) {
			//TODO bug
			var $content = this.$el.find('.infosonimg')
			$content.removeClass();
			$content.addClass('infosonimg')
			switch ( val ) {
				case 1: {
					this.statusPhoto = "UNDETERMINATE"	
					this.elems.status.innerText = this.statusPhoto;
					this.elems.status.style.color = 'white'		
					break;
				}
				case 2 : {
					if( !$content.hasClass('accepted') ) {
						$content.addClass('accepted');
					}
					this.statusPhoto = "ACCEPTED"
					this.elems.status.innerText = this.statusPhoto;
					this.elems.status.style.color = 'green'	
					break;
				}
				case 4 : {
					if( !$content.hasClass('refused') ) {
						$content.addClass('refused');
					}
					this.statusPhoto = "REFUSED"
					this.elems.status.innerText = this.statusPhoto;
					this.elems.status.style.color = 'red'	
					break;
				}
				default: {
					this.statusPhoto = "UNKNOWN"
					this.elems.status.innerText = this.statusPhoto;
					this.elems.status.style.color = 'white'	
					break;
				}
			}

			if ( this.model.get('stationId') ) {
				if( !$content.hasClass('stationed') ) {
					this.statusPhoto = "ACCEPTED AND STATION ATTACHED"
					this.elems.status.innerText = this.statusPhoto;
					this.elems.status.style.color =  "rgb(191, 179, 0)";	
					$content.addClass('stationed');
				}
			}
			else {
				if( $content.hasClass('stationed') ) {
					$content.removeClass('stationed');
				}

			}


			
		},

		onRender: function(e) {
			var _this = this;
			var stationAttached = '';
			this.buildTemplate();

			if( this.model.get('validated') == null ||  this.model.get('validated') == 0 ) {
				this.model.set('validated' , 1);
			}
			if (this.position > 1) {
				this.ui.canLeft.css('visibility','visible');
			}
			if (this.position < this.total ) {
				this.ui.canRight.css('visibility','visible');
			}
			this.parent.$el.find('.backgrid-paginator').css('visibility','hidden');
			if (this.model.get('stationId') ) {
				stationAttached = 'stationAttached';				
			}

			// this.elems.status.innerText = this.statusPhoto;
			this.elems.date.innerText = this.model.get('date_creation');
			this.elems.position.innerText = this.position+'/'+this.total;
			// if(this.model.get('stationId') ) {
			// 	this.elems.station.className = 'station reneco icon-one reneco-stations'
			// }
			// else {
			// 	this.elems.station.className = 'station'
			// }

			this.parent.$el.find('.paginatorCamTrap').prepend(this.elems.container);


			var notEditable = this.model.get('validated') === 2 ? false : true;

			this.$el.find('input').rating({
				min:0,
				max:5,
				step:1,
				size:'xl',
				displayOnly: notEditable,
				rtl:false,
				showCaption:false,
				showClear:false,
				value : _this.model.get('note')
			});
			this.$el.find('input').on('rating:change', function(event, value, caption) {
				_this.model.set('note',value)
			});
			// var $input = this.$el.find('input');
			// 	this.$el.find('input').rating({
			// 		min:0,
			// 		max:5,
			// 		step:1,
			// 		size:'xl',
			// 		rtl:false,
			// 		showCaption:false,
			// 		showClear:false,
			// 		value : _this.model.get('note')
			// 	});
				// this.$el.find('.rating-container').css('visibility' , 'hidden')
				// $input.on('rating.change', function(event, value, caption) {
				// 	_this.model.set('note',value);
				// });
			// if ( this.model.get('validated') == 2 ) {
			// 	this.$el.find('.rating-container').css('visibility' , 'visible')
			// }
			// else {
			// 	this.$el.find('.rating-container').css('visibility' , 'hidden')
			// }

			this.theWheel = wheelzoom(_this.$el.find('img'), {zoom:0.20});


		},

	changeModel (model) {
      var _this = this;
      this.stopListening(this.model);
			this.parent.$el.find('.infosfullscreen').html('');
			this.parent.$el.find('.infosfullscreen').remove();
			this.parent.$el.find('.paginatorCamTrap').prepend(this.elems.container);
			this.model = model;
			this.position = this.parent.currentCollection.fullCollection.indexOf(this.model) + 1 ;
			this.total = this.parent.currentCollection.fullCollection.length;
			this.setStatus(this.model.get('validated'));

      this.listenTo(this.model, "change custom:activechange custom:refreshUI", function() {
				_this.setStatus(_this.model.get('validated'));
				_this.$el.find('input').rating('update',_this.model.get('note'));
				if( ! this.parent.stopSpace ) {
					_this.render();
				}
				else {
						_this.parent.$el.find('.infosfullscreenStatus').text(' '+_this.statusPhoto+' ');
						_this.$el.find('input').rating('update',_this.model.get('note'));
					// if ( this.model.get('validated') == 2 ) {
					// 	this.$el.find('.rating-container').css('visibility' , 'visible')
					// }
					// else {
					// 	this.$el.find('.rating-container').css('visibility' , 'hidden')
					// }
				}

      });
			this.render();
		},
		hide: function(){
			this.stopListening(this.model);
			this.$el.find('img')[0].dispatchEvent(new CustomEvent('wheelzoom.destroy'));
			this.theWheel = null ;
			this.parent.$el.find('.infosfullscreen').remove();
			this.parent.$el.find('.backgrid-paginator').css('visibility','visible');
			this.$el.empty();
		},

		mouveleft : function() {
				this.parent.leftMouvement();
		},

		mouveright : function() {
			this.parent.rightMouvement();
		},

		onDestroy: function() {
			// console.log("bim destroy");
		}

	});
});
