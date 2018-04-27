define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',
	'./lyt-camTrapImageModel',
	'exif-js',
	// 'bootstrap-star-rating',

], function($, _, Backbone, Marionette, Translater, config , CamTrapImageModel , Exif/*, btstrp_star*/ ) {

  'use strict';
  return Marionette.ItemView.extend({
		model: CamTrapImageModel,//ImageModel,
		keyShortcuts :{
			//'space': 'onClickImage',
		},
		events:{
			'click div#detailstitle': 'changeExif'

		},
		className : "detailsimage",
		template : 'app/modules/validate/templates/tpl-imagedetails.html',


		initialize : function(options) {
      var _this = this;
			this.parent = options.parent;
      this.model = options.model;
      // this.listenTo(this.model, "change", function() {
      //   console.log("j'ai changé");
      //   _this.onRender();
      // });
      this.flagExif = false;

		//	console.log("init des details");

		},
    changeStatus: function() {
      var _this = this;
      var $radio = this.$el.find('input[type=radio]')
      $radio.prop("disabled",true);
      var $radioChecked = this.$el.find('input[type=radio]:checked')
      $radioChecked.removeAttr("checked");
      switch( this.model.get('validated')) {
        case 1: {
          var $radio = this.$el.find('input[type=radio][value="1"]')
          $radio.prop("checked",true);
          $radio.prop("disabled",false);
          break;
        }
        case 2: {
          var $radio = this.$el.find('input[type=radio][value="2"]')
          $radio.prop("checked",true);
          $radio.prop("disabled",false);

          break;
        }
        case 4: {
          var $radio = this.$el.find('input[type=radio][value="4"]')
          $radio.prop("checked",true);
          $radio.prop("disabled",false);
          break;
        }
        default:{
          var $radio = this.$el.find('input[type=radio][value="0"]')
          $radio.prop("checked",true);
          $radio.prop("disabled",false);
          break;
        }
      }

    },
    // changeStars: function() {
    //   var _this = this;

		//	console.log($radio);
			// var $input = this.$el.find('input.rating');
			//$input.html('');
			// this.$el.find('input.rating').rating({
			// 	min:0,
			// 	max:5,
			// 	step:1,
			// 	size:'xs',
			// 	rtl:false,
			// 	displayOnly: true,
			// 	showCaption:false,
			// 	showClear:false,
			// 	value : 0
			// });
			// if( _this.model.get('validated') == 2 ) {
			// $input.rating('update', _this.model.get('note')).val();
			// $input.trigger('rating.change', [_this.model.get('note') , null]);
			// }
			// else {
			// 	$input.rating('update', 0).val();
			// 	$input.trigger('rating.change', [0 , null]);
			// }

    // },
    changeTags: function() {
      var _this = this ;
      var tags = this.model.get('tags');
    //	console.log(tags);
      var $tags = this.$el.find('#detailsTags .bootstrap-tagsinput');
      $tags.html('');
    //	console.log($tags);
      if ( tags != null ) {
        tags = tags.split(',');
        for(var tmp of tags) {
          $tags.append('<span class="tag label label-info">'+tmp+'</span>');
        }
        //$tags.append("</tags>");
      }
      else {
        $tags.append("NO TAGS FOR THIS PHOTO");
      }

    },
    changeExif: function() {
			if( !this.flagExif ) {
	      var _this = this ;
	      var exifJson = {
					name :"",
					type:"",
					size:"",
					dimensions:"",
					resolution:"",
					iso :"",
					created :"",
				};
				exifJson.name = _this.model.get('name').replace('%20',' ');
				exifJson.created = _this.model.get('date_creation');


				var http = new XMLHttpRequest();
				http.addEventListener('readystatechange', function() {
			    if (http.readyState === XMLHttpRequest.DONE && http.status === 200) {

			    }
			});
		    http.open('GET', './'+_this.model.get('path')+''+_this.model.get('name'), true);
		    http.responseType = "blob";
		    http.onload = function(e) {
				//	console.log(e);
		        if (this.status === 200) {
							//	console.log(this);
								exifJson.type = this.response.type;
								exifJson.size = ( (this.response.size / 1024 ) / 1000 ).toFixed(2) + " MB"

		            Exif.getData(http.response, function() {
									//console.log(((this.size/1024)/1000)+"MB");
									//	var chaine = Exif.getAllTags(this);
										exifJson.dimensions = Exif.getTag(this, "PixelXDimension")+" X "+Exif.getTag(this, "PixelYDimension");//chaine.PixelYDimension;
										exifJson.resolution = Exif.getTag(this, "XResolution") +" DPI";
										exifJson.iso = Exif.getTag(this, "ISOSpeedRatings");//chaine.ISOSpeedRatings;
										var $keyExif = _this.$el.find('#keyExif');
										$keyExif.html('');
										var $valueExif = _this.$el.find('#valueExif');
										$valueExif.html('');
										for ( var tmp in exifJson ) {
									//		console.log(tmp);
											$keyExif.append(tmp+"<br>")
											$valueExif.append(exifJson[tmp]+"<br>")
	                    _this.flagExif = true;
										//	console.log(exifJson[tmp]);
										}
								//		console.log(chaine);
		                //alert(Exif.getAllTags(this));
									//	console.log(exifJson);
		            });
								//Exif.g
		        }
		    };
		    http.send()

		}

    },

		onRender: function(){

      this.changeStatus();
      // this.changeStars();
      this.changeTags();
      /*if(!this.flagExif) {
        console.log("on va afficher lexif");
        this.changeExif();
      }
      else {
        console.log("on affiche pas lexif");
      }*/

		},

		changeDetails(model){
      var _this = this;
      this.stopListening(this.model);
      this.flagExif = false;
			this.model = model;
			var $keyExif = _this.$el.find('#keyExif');
			$keyExif.html('');
			var $valueExif = _this.$el.find('#valueExif');
			$valueExif.html('');
      this.listenTo(this.model, "change", function() {
        _this.onRender();
      });

			this.onRender();
		},

		onDestroy: function() {
			console.log("bim destroy");
		}

	});

});
