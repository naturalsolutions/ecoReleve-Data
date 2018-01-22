//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',
	'ez-plus',
	'bootstrap-star-rating',
	'./lyt-camTrapImageModel',
	'wheelzoom',
	'imageLoaded'

], function($, _, Backbone, Marionette, Translater, config , ezPlus , btstrp_star , CamTrapImageModel, wheelzoom , imageLoaded  ) {

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
		template : 'app/modules/monitoredSites/templates/tpl-camTrapModal.html',


		initialize : function(options) {
      var _this = this;
			this.parent = options.parent;
      this.model = options.model;
			this.position = this.parent.currentCollection.fullCollection.indexOf(this.model) + 1 ;
			this.total = this.parent.currentCollection.fullCollection.length;
			this.theWheel = null;
      this.listenTo(this.model, "change", function() {
				if( ! this.parent.stopSpace ) {
					_this.render();
				}
				else {
						this.$el.find('.rating-container').css('visibility' , 'visible')
				}
      });
		},

		onRender: function() {
			var _this = this;
			if (this.position > 1) {
				this.ui.canLeft.css('visibility','visible');
			}
			if (this.position < this.total ) {
				this.ui.canRight.css('visibility','visible');
			}
			this.parent.$el.find('.backgrid-paginator').css('visibility','hidden');
			this.parent.$el.find('.paginatorCamTrap').prepend('<div class="infosfullscreen">'
											+this.model.get('date_creation')+''
											+'<div class="indexposition">'+this.position+'/'+this.total+'</div>'
											+'  </div>');
			var $input = this.$el.find('input');
				this.$el.find('input').rating({
					min:0,
					max:5,
					step:1,
					size:'xl',
					displayOnly: true,
					rtl:false,
					showCaption:false,
					showClear:false,
					value : _this.model.get('note')
				});
				this.$el.find('.rating-container').css('visibility' , 'hidden')
				$input.on('rating.change', function(event, value, caption) {
					_this.model.set('note',value);
				});
				this.$el.find('.rating-container').css('visibility' , 'visible')

				this.theWheel = wheelzoom(_this.$el.find('img'), {zoom:1});
		},

		changeModel(model){
      var _this = this;
      this.stopListening(this.model);
			this.parent.$el.find('.infosfullscreen').html('');
			this.model = model;
			this.position = this.parent.currentCollection.fullCollection.indexOf(this.model) + 1 ;
			this.total = this.parent.currentCollection.fullCollection.length;
      this.listenTo(this.model, "change", function() {
				if( ! this.parent.stopSpace ) {
					_this.render();
				}
				else {
						this.$el.find('.rating-container').css('visibility' , 'visible')
				}
      });
			this.render();
		},
		hide: function(){
			this.stopListening(this.model);
			this.$el.find('img')[0].dispatchEvent(new CustomEvent('wheelzoom.destroy'));
			//this.$el.find('img').trigger('wheelzoom.destroy');
			this.theWheel = null ;
			this.parent.$el.find('.infosfullscreen').remove();
			this.parent.$el.find('.backgrid-paginator').css('visibility','visible');
			this.$el.empty();
			//this.destroy();
		},

		mouveleft : function() {
				this.parent.leftMouvement();
		},

		mouveright : function() {
			this.parent.rightMouvement();
		},

		onDestroy: function() {
		}

	});

});
