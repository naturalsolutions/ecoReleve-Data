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
			this.$elementPopover = $(options.parent.$el.find('.reneco-image_file'));
			var _this = this;
			this.statusPhotos ={};
			this.statusPhotos.textStatus = "";
			this.statusPhotos.class = "" ;
			this.position = this.parent.currentCollection.fullCollection.indexOf(this.model) + 1 ;
			this.total = this.parent.currentCollection.fullCollection.length;
			this.evalStatusPhoto(this.model);

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
					return '<div class="popover-header"> <span class="'+_this.statusPhotos.class+'">'+_this.statusPhotos.textStatus+'</span></div>'
								+' <img src='+_this.model.get('path')+''+_this.model.get('name')+'  />'
								+'<input id="rating_'+_this.model.get('id')+'" name="input-name" type="number" class="rating hide" value="5" >'
								+'</div>'
								;
				},
		});
		},
		render: function(){

			if( !this.model.get("validated")  && this.parent.stopSpace) {
			 this.model.set("validated" , 1 ); //Si focus alors la photo est vu
			 //this.setVisualValidated(1);
			 this.parent.tabView[this.parent.currentPosition].setVisualValidated(1);
			 //this.setVisualValidated(1);
			 this.changeImage(this.model);
		 }
		},

    onShow: function() {
			this.$elementPopover.popover('show');
			var popoverContent = this.parent.$el.find('.popover-content')
			if(this.model.get('validated') ==2 ) {
				console.log(popoverContent.find('input'));
				popoverContent.find('input').removeClass('hide');

				popoverContent.find('input').rating({
					min:0,
					max:5,
					step:1,
					size:'md',
					rtl:false,
					showCaption:false,
					showClear:false
				});
					popoverContent.find('.rating-container').addClass('text-center');
			}
			else {
				popoverContent.find('input').addClass('hide');
			}
			console.log(popoverContent ) ;
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
			this.evalStatusPhoto(model);


			this.parent.$el.find('.popover-content').html('<div class="popover-header"> <span class="'+this.statusPhotos.class+'">'+this.statusPhotos.textStatus+'</span></div>'
						+' <img src='+this.model.get('path')+''+this.model.get('name')+'  />'
						+'<input id="rating_'+this.model.get('id')+'" name="input-name" type="number" class="rating hide" value="5" >'
						+'</div>');
			var popoverContent = this.parent.$el.find('.popover-content')
			//console.log(popoverContent ) ;
			if(this.model.get('validated') ==2 ) {
				console.log(popoverContent.find('input'));
				popoverContent.find('input').removeClass('hide');
				popoverContent.find('input').rating({
					min:0,
					max:5,
					step:1,
					size:'md',
					rtl:false,
					showCaption:false,
					showClear:false
				});
				popoverContent.find('.rating-container').addClass('text-center');
			}
			else {
				popoverContent.find('input').addClass('hide');
			}


			this.parent.$el.find('.infosfullscreen').html('<div class="infosfullscreen">'
											+this.model.get('date_creation')+''
											+'<div class="indexposition">'+this.position+'/'+this.total+'</div>'
											+'  </div>');
			this.render();
		},
		evalStatusPhoto: function(model){
			switch(  this.model.get('validated') )
			{
				case 1:{
					this.statusPhotos.textStatus  = "UNDETERMINATE";
					this.statusPhotos.class = "chckd"
					break;
				}
				case 2:{
					this.statusPhotos.textStatus = "ACCEPTED";
					this.statusPhotos.class = "accptd"
					break;
				}
				case 4:{
					this.statusPhotos.textStatus = "REFUSED";
					this.statusPhotos.class = "rfsd"
					break;
				}
				defaults:{
					this.statusPhotos.textStatus = "";
					this.statusPhotos.class = ""
					break;
				}
			}

		},
		hide: function(){
			this.parent.$el.find('.infosfullscreen').remove();
			this.parent.$el.find('.backgrid-paginator').css('visibility','visible');
			this.$elementPopover.popover('hide');

		},

  });
});
