define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',
	'./lyt-camTrapImageModel',
	'exif-js',

], function($, _, Backbone, Marionette, Translater, config , CamTrapImageModel , Exif ) {

  'use strict';
  return Marionette.ItemView.extend({
		model: CamTrapImageModel,//ImageModel,
		keyShortcuts :{
			//'space': 'onClickImage',
		},
		events:{

		},
		className : "detailsimage",
		template : 'app/modules/validate/templates/tpl-imagedetails.html',


		initialize : function(options) {
			this.parent = options.parent;
			console.log("init des details");

		},

		onRender: function(){
			var _this = this;
			var $radio = this.$el.find('input[type=radio]')
			switch( this.model.get('validated')) {
				case 1: {
					var $radio = this.$el.find('input[type=radio][value="1"]')
					console.log("UNDERTERMINATE");
					break;
				}
				case 2: {
					var $radio = this.$el.find('input[type=radio][value="2"]')
					console.log("ACCEPTED");
					break;
				}
				case 4: {
					var $radio = this.$el.find('input[type=radio][value="4"]')
					console.log("REFUSED");
					break;
				}
				default:{
					console.log("NOT SEEN");
					break;
				}
			}
			console.log($radio);
			var $input = this.$el.find('input');
			$input.html('');
			this.$el.find('input.rating').rating({
				min:0,
				max:5,
				step:1,
				size:'xs',
				rtl:false,
				displayOnly: true,
				showCaption:false,
				showClear:false,
				value : _this.model.get('note')
			});

			var tags = this.model.get('tags');
			console.log(tags);
			var $tags = this.$el.find('#detailsTags .bootstrap-tagsinput');
			$tags.html('');
			console.log($tags);
			if ( tags != null ) {
				tags = tags.split(',');
				for(var tmp of tags) {
					$tags.append('<span class="tag label label-info">'+tmp+'</span>');
				}
				//$tags.append("</tags>");
			}
			else {
				console.log("no tags");
				$tags.append("NO TAGS FOR THIS PHOTO");
			}
			console.log("test exif");
		/*	Exif.getData(this, function() {
				console.log("dans exif");
        alert(Exif.pretty(this));
    	});*/
			var exifJson = {
				name :"",
				type:"",
				size:"",
				dimensions:"",
				resolution:"",
				iso :"",
				created :"",
			};
			exifJson.name = _this.model.get('name');
			exifJson.created = _this.model.get('date_creation');


			var http = new XMLHttpRequest();
			http.addEventListener('readystatechange', function() {
		    if (http.readyState === XMLHttpRequest.DONE && http.status === 200) {

		    }
		});
	    http.open('GET', ''+_this.model.get('path')+''+_this.model.get('name'), true);
	    http.responseType = "blob";
	    http.onload = function(e) {
				console.log(e);
	        if (this.status === 200) {
						//	console.log(this);
							exifJson.type = this.response.type;
							exifJson.size = ( (this.response.size / 1024 ) / 1000 ) + "MB"

	            Exif.getData(http.response, function() {
								//console.log(((this.size/1024)/1000)+"MB");
									var chaine = Exif.getAllTags(this);
									exifJson.dimensions = chaine.PixelXDimension+" X "+chaine.PixelYDimension;
									exifJson.resolution = chaine.XResolution +" DPI";
									exifJson.iso = chaine.ISOSpeedRatings;
									var $keyExif = _this.$el.find('#keyExif');
									$keyExif.html('');
									var $valueExif = _this.$el.find('#valueExif');
									$valueExif.html('');
									for ( var tmp in exifJson ) {
										console.log(tmp);
										$keyExif.append(tmp+"<br>")
										$valueExif.append(exifJson[tmp]+"<br>")
										console.log(exifJson[tmp]);
									}
							//		console.log(chaine);
	                //alert(Exif.getAllTags(this));
									console.log(exifJson);
	            });
							//Exif.g
	        }
	    };
	    http.send()


		},

		changeDetails(model){
			this.model = model;
			this.onRender();
		},

		onDestroy: function() {
			console.log("bim destroy");
		}

	});

});
