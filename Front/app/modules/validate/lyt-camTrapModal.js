//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',

], function($, _, Backbone, Marionette, Translater, config) {

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
			this.statusPhotos.class = {'color' : 'white'} ;
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
					return '<div class="popover-header" style="color:'+_this.statusPhotos.class.color+';">'+_this.statusPhotos.textStatus+'</div>'
								+' <img src='+_this.model.get('path')+''+_this.model.get('name')+'  />'
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
			this.parent.$el.find('.backgrid-paginator').css('visibility','hidden');
			this.parent.$el.find('.paginatorCamTrap').prepend('<div class="infosfullscreen">'
											+this.model.get('date_creation')+''
											+'<span class="indexposition">'+this.position+'/'+this.total+'</span>'
											+'  </div>');
			//this.parent.$el.find('.backgrid-paginator').html("hohoho hahaha");
    },

		changeImage:function (model) {
			this.model = model;
			this.position = this.parent.currentCollection.fullCollection.indexOf(model)  + 1 ;
			this.total = this.parent.currentCollection.fullCollection.length;
			this.evalStatusPhoto(model);
			this.parent.$el.find('.popover-content').html('<div class="popover-header" style="color:'+this.statusPhotos.class.color+';">'+this.statusPhotos.textStatus+'</div>'
						+' <img src='+this.model.get('path')+''+this.model.get('name')+'  />'
						+'</div>');
			this.parent.$el.find('.infosfullscreen').html('<div class="infosfullscreen">'
											+this.model.get('date_creation')+''
											+'<span class="indexposition">'+this.position+'/'+this.total+'</span>'
											+'  </div>');
			this.render();
		},
		evalStatusPhoto: function(model){
			switch(  this.model.get('validated') )
			{
				case 1:{
					this.statusPhotos.textStatus  = "UNDERTEMINATE";
					this.statusPhotos.class = {'color' :'white'}
					break;
				}
				case 2:{
					this.statusPhotos.textStatus = "ACCEPTED";
					this.statusPhotos.class = {'color' :'green'}
					break;
				}
				case 4:{
					this.statusPhotos.textStatus = "REFUSED";
					this.statusPhotos.class = {'color' :'red'}
					break;
				}
				defaults:{
					this.statusPhotos.textStatus = "";
					this.statusPhotos.class = {'color' :'white'}
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
