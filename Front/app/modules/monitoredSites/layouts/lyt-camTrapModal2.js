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

], function($, _, Backbone, Marionette, Translater, config , ezPlus , btstrp_star ) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/validate/templates/tpl-camTrapModal.html',
    className: 'modal fade modal-cam-trap',
    id: 'camTrapModal',

    initialize: function(options) {
			this.parent = options.parent;
			this.$elementPopover = $(options.parent.$el.find('.camtrapgallery'));
			var _this = this;
			this.statusPhotos ={};
			this.statusPhotos.textStatus = "";
			this.statusPhotos.class = "" ;
			this.position = this.parent.currentCollection.fullCollection.indexOf(this.model) + 1 ;
			this.total = this.parent.currentCollection.fullCollection.length;


			this.$elementPopover.popover({
				container: '#gallery',
				placement : 'bottom',
				template : '<div class="popover" role="tooltip">'
										+'<div class="popover-content"></div>'
										+'</div>'
										,
				html: true,
				trigger : 'manual',
				content: function(){
					return '<div class="popover-header"> </div>'
								+' <img src='+_this.model.get('path')+''+_this.model.get('FileName')+'  />'
								+'<input id="rating_'+_this.model.get('id')+'" name="input-name" type="number" class="rating hide" value="5" >'
								+'</div>'
								;
				},
		});
		},
		render: function(){

		/*	if(this.parent.stopSpace) {
			 //this.model.set("validated" , 1 ); //Si focus alors la photo est vu
			 //this.setVisualValidated(1);
			 //this.setVisualValidated(1);
			 this.changeImage(this.model);
		 }*/
		},

    onShow: function() {
			this.$elementPopover.popover('show');
			var popoverContent = this.parent.$el.find('.popover-content')


				popoverContent.find('input').rating({
					min:0,
					max:5,
					step:1,
					size:'md',
					displayOnly: true,
					rtl:false,
					showCaption:false,
					showClear:false
				});
					popoverContent.find('.rating-container').addClass('text-center');

			this.parent.$el.find('.backgrid-paginator').css('visibility','hidden');
			this.parent.$el.find('.paginatorCamTrap').prepend('<div class="infosfullscreen">'
											+this.model.get('date_creation')+''
											+'<div class="indexposition">'+this.position+'/'+this.total+'</div>'
											+'  </div>');
			//this.parent.$el.find('.backgrid-paginator').html("hohoho hahaha");
    },

		changeImage:function (model) {
			this.model = model;
			this.position = this.parent.currentCollection.fullCollection.indexOf(model) +1 ;
			this.total = this.parent.currentCollection.fullCollection.length;

			this.parent.$el.find('.popover-content').html('<div class="popover-header"> </div>'
						+' <img src='+this.model.get('path')+''+this.model.get('FileName')+'  />'
						+'<input id="rating_'+this.model.get('id')+'" name="input-name" type="number" class="rating hide" value="5" >'
						+'</div>');
			var popoverContent = this.parent.$el.find('.popover-content')

				popoverContent.find('input').rating({
					min:0,
					max:5,
					step:1,
					size:'md',
					displayOnly: true,
					rtl:false,
					showCaption:false,
					showClear:false
				});
				popoverContent.find('.rating-container').addClass('text-center');



			this.parent.$el.find('.infosfullscreen').html('<div class="infosfullscreen">'
											+this.model.get('date_creation')+''
											+'<div class="indexposition">'+this.position+'/'+this.total+'</div>'
											+'  </div>');
			this.render();
		},

		hide: function(){
			this.parent.$el.find('.infosfullscreen').remove();
			this.parent.$el.find('.backgrid-paginator').css('visibility','visible');
			this.$elementPopover.popover('hide');

		},

  });
});
