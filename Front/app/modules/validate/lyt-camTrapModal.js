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
								+'<div class="popover-footer">'+_this.model.get('date_creation')+'</div>'
								;
				},
				header: function(){
					return 'toto';
				}
		});
		},
		render: function(){
			console.log("je render le modal ");
			console.log(this.model.get("validated"));
			console.log(this.parent.stopSpace);
			if( !this.model.get("validated")  && this.parent.stopSpace) {
				console.log("position : "+this.parent.currentPosition);
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
    },

		changeImage:function (model) {
			this.model = model;
			this.evalStatusPhoto(model);
			//console.log(this.statusPhotos);
			this.parent.$el.find('.popover-header').text(this.statusPhotos.textStatus).css(this.statusPhotos.class);
			this.parent.$el.find('.popover-content img').attr("src", this.model.get('path')+''+this.model.get('name') );
			this.parent.$el.find('.popover-footer').text(this.model.get('date_creation'));
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
			this.parent.$el.find('.backgrid-paginator').css('visibility','visible');
			this.$elementPopover.popover('hide');
		},

  });
});
