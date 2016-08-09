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


], function($, _, Backbone, Marionette, Translater, config , ModalView , CamTrapImageModel ,ezPlus ) {

  'use strict';
  return Marionette.ItemView.extend({
		model: CamTrapImageModel,//ImageModel,
		modelEvents: {
			"change": "changeValid"
		},
		events:{
			'click img':'onClickImage',
			//'mouseenter .image': 'hoveringStart',
		//	'mouseleave': 'hoveringEnd',
		//	'keydown' : 'keyPressed',
			'click .js-tag': 'addTag'
		},
		className : 'col-md-2 text-center imageCamTrap',
		//template : 'app/modules/validate/templates/tpl-image.html',
		template : 'app/modules/validate/templates/tpl-image.html',
		//template : $('#itemview-image-template').html(),

		initialize : function(options) {
			this.parent = options.parent;
		},

		keypressed: function(e){
			console.log("keydown");
			console.log("youhhouuu detection ");
			if( e.keyCode == 13)
				{
					console.log("bim touche entrée"); // returning false will prevent the event from bubbling up.
					console.log("ouverture de l'image "+this.model.get("name"));
				}
		},
		onRender: function(){
			this.$("#zoom_"+this.model.get("id")).ezPlus({
				zoomWindowPosition: 'preview',
				preloading: false,
				responsive: true,
				scrollZoom: true,
				zoomWindowPosition: 11,
				zoomWindowOffsetX: -15,
				zoomWindowHeight: 400,
				zoomWindowWidth: 600,
				loadingIcon: false,// link to spinner
			});
		},

		hoveringStart: function(e){
			//console.log(this.model);
			console.log("enter " +this.model.get("name"));
			var flagStatus = this.model.get("validated")
			 if( flagStatus == null ){
				 this.model.set("validated",true)
				 console.log("on valide" +this.model.get("validated"));
			 }
			/* else{
				 flagStatus = !flagStatus //inverse booleen
				 this.model.set("validated",flagStatus)
			 }*/

			//console.log(this);
			//afficher le menu
			//console.log(this.$('#myModalCamTrap'));
		},
		hoveringEnd: function(e){
			//console.log("et bim on save attention the requete");
			if( this.model.hasChanged("validated") )
			{
				console.log("le status a changé");
				this.model.save();
			}
			else{
				console.log("le status n'a pas changé on save pas alors");
			}
			//console.log("leave " +this.model.get("name"));
		},

		changeValid: function(){
			console.log("changer dans itemView");
		},
		onClickImage: function(e){
			var _this = this;
			console.log(this);
			this.parent.rgModal.show(new ModalView({model: this.model}));
			//this.parent.elevator(this.model);

/*            var flagStatus = this.model.get("validated")
			if( flagStatus == null ){
				this.model.set("validated",true)
			}
			else{
				flagStatus = !flagStatus //inverse booleen
				this.model.set("validated",flagStatus)
				if(!flagStatus) $(e.currentTarget).css("opacity",0.2);
				else $(e.currentTarget).css("opacity",1);
			}




			console.log(this.model.get("name")+"validated :"+this.model.get("validated"));

*/

			/*var ModalContent = Marionette.LayoutView.extend({
				model: ImageModel,
				template : 'app/modules/validate/templates/tpl_modal.html',//$("#modal_template").html(),
				initialize : function(options) {
				}
			});*/
			//var modalView = new ModalContent({model : this.model });
			//modalView.render();
/*         _this.modal = new Backbone.BootstrapModal({
					animate: true,
					content: modalView
				}).open();*/




			/*var Modal = Backbone.Modal.extend({
				template: '#modal-template',
				cancelEl: '.bbm-button'
			});
			var modalView = new Modal();
			console.log(modalView);
			$('.full-height').html(modalView.render().el);*/


		/*  if (this.model.get("checked") ){
				if ( !this.model.get("validated") )
				{
					console.log(this.model.get("name")+" is validated now");
					this.model.set("validated", true)
				}
				else{
					console.log(this.model.get("name")+" is deleted now");
					this.model.set("validated", false)
				}
			}
			if( !this.model.get("checked") ) {
				console.log(this.model.get("name")+" is checked now");
				this.model.set("checked", true)
			}*/
		}
	});

});
