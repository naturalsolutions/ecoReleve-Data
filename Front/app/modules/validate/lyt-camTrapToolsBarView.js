define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',
  'bootstrap-tagsinput',
  'select2',
	'./lyt-camTrapImageModel'
], function($, _, Backbone, Marionette, Translater, config, TagsInput,Select2, CamTrapImageModel ) {

  'use strict';

  return Marionette.ItemView.extend({
		collection: Backbone.Collection.extend({
			model : CamTrapImageModel
		}),
		ui : {
		'tagsInput' :'#tagsInput',
		'selectTags' : '.js-data-tags',
		'validate': '#validate'
		},
		// events:{
		// 	'beforeItemAdd' : 'verifTag',
		// 	"focusout input": "saveTags",
		// },
		//template : 'app/modules/validate/templates/tpl-image.html',
		template : 'app/modules/validate/templates/tpl-camTrapToolsBar.html',
		className : 'toolsBarCamTrap',
		//template : $('#itemview-image-template').html(),

		initialize : function(options) {
			// console.log("on init la toolBar youhouuuuuuuu")
			var _this = this;
			this.parent = options.parent;
			this.dataTags = null;
			this.collection = options.collection;
			this.listenTo(this.collection, 'custom:activechange custom:refreshUI change', function(){
				_this.fillElemTags();
				_this.displayValidateSession();	
			  });
			this.unSelectedTagsTab = [];
			this.selectedTagsTab = [];
			this.jsonParsed = options.jsonParsed; 
			this.$elemTags = undefined;
		},
		changeCollection: function(collection) {
			var _this = this;
			this.collection = collection;
			this.listenTo(this.collection, 'custom:activechange custom:refreshUI change', function() {
			  _this.fillElemTags();
			  _this.displayValidateSession();	
			})
		  },

		instantiateElemTags : function() {
			var _this = this;
			_this.$elemTags = _this.$el.find('.js-data-tags').select2({
				data :  new Array( JSON.parse(_this.jsonParsed) ),
				maximumSelectionLength: 8,
				closeOnSelect : false,
				placeholder: 'Add tags ...',
				tokenSeparators: [",", " "],
				separator : ',',
				tags: false, // prohib value not in thesau
				width : '95%',
				dropdownAutoWidth: true,
				// allowClear: true
			  });

			  _this.$elemTags.on('select2:close', function(e) {		
				setTimeout(function() {
					$('.select2-container-active').removeClass('select2-container-active');
					$(':focus').blur();
					$('#gallery').focus().select();
				}, 1);
			  });
			  //TODO maybe a better event to listen
			  _this.$elemTags.on('select2:closing', function(e) {
				//on close we save
				_this.saveTags();
			  });
			  _this.$elemTags.on('select2:select', function(e) {
					for( var i =0 ; i < _this.unSelectedTagsTab.length ; i ++ ) {
						if( _this.unSelectedTagsTab[i] === e.params.data.id) {
							_this.unSelectedTagsTab.splice(i,1);
						}
					}
					_this.selectedTagsTab = _.union(_this.selectedTagsTab , [e.params.data.id])
			  });

			  _this.$elemTags.on('select2:unselect', function(e) {
				for( var i =0 ; i < _this.selectedTagsTab.length ; i ++ ) {
					if( _this.selectedTagsTab[i] === e.params.data.id) {
						_this.selectedTagsTab.splice(i,1);
					}
				}
				_this.unSelectedTagsTab = _.union(_this.unSelectedTagsTab , [e.params.data.id])
			  });

		},

		fillElemTags : function() {
			var _this = this;
			var tabModel = this.collection.where({activeFront : true })
			if( !_this.$elemTags) {
				_this.instantiateElemTags()
			}
			if ( !tabModel )
				return;
			if (tabModel.length == 1 /**&& aCollection.at(0).get('validated') == 4 */) {
				var tagsTab = [];
				var tagsStr = tabModel[0].get('tags');
				
				if(tagsStr) {
				   tagsTab = tagsStr.split(',') ;
				}

				 if( tagsTab.length > 0 ) {
				   _this.$elemTags.val(tagsTab).trigger('change');
				 }
				 else {
					_this.$elemTags.val(null).trigger('change');
				 }
				 //disable tag input if not validated
				//  if (tabModel[0].get('validated') != 2 ) {
				// 	_this.$elemTags.prop("disabled", true)
				//  }
				//  else {
				// 	_this.$elemTags.prop("disabled", false)
				//  }
			}

			if (tabModel.length > 1 ) {
				var model;
				var allTags=[];
				var tagsAndOccurences
				var allTagsStr =''
				var tmpTagsStr = '';
				var finalTagsTab = []

				//filter collection only accepted photos
				// var filteredCol = tabModel.filter( function(item){
				// 	if( item.get('validated') == 2 ) {
				// 		return item
				// 	}
				// })
			
				var filteredCol = tabModel

				for( var i = 0 ; i < filteredCol.length ; i ++ ) {
					model = filteredCol[i];
					tmpTagsStr = model.get('tags');
					if(tmpTagsStr) {
						if(allTagsStr) {
							allTagsStr+=',';
						}
						allTagsStr+=tmpTagsStr;
					}
				}
				allTags = allTagsStr.split(',')
				tagsAndOccurences = _.countBy(allTags)
				for( var  tag in tagsAndOccurences ) {
					var occurence = tagsAndOccurences[tag];
					if ( occurence == filteredCol.length) {
						finalTagsTab.push(tag);
					}
				}
				if( finalTagsTab.length > 0 ) {
					_this.$elemTags.val(finalTagsTab).trigger('change');
				  }
				  else {
					 _this.$elemTags.val(null).trigger('change');
				  }
			}

		},

		onRender: function(){
			var _this = this;
			if( !_this.$elemTags) {
					_this.instantiateElemTags()
				}
				_this.fillElemTags();
				this.displayValidateSession();	
		},

		displayValidateSession : function() {
			var btnValidate = this.ui.validate[0];
			if( this.parent.nbPhotosNotChecked > 0 ) {
				if(btnValidate.className.split(' ').indexOf('disabled') === -1 ) {
					btnValidate.className += ' disabled ';
				}
			}
			else {
			if(btnValidate.className.split(' ').indexOf('disabled') > -1 ) {
				btnValidate.className = btnValidate.className.replace('disabled','');
				}
			}

		},

		updateManyTags: function(tab) {
			var _this = this;
			// var tabSelected = this.parent.model.get('newSelected');
			var tabModels = this.collection.where({activeFront : true})
			
			$.ajax({
				type: 'PUT',
				url: config.coreUrl + 'sensorDatas/camtrap/'+_this.parent.equipmentId+'/updateMany',
				contentType: 'application/json',
				data: JSON.stringify(tab)
			  })
			  .done(function (resp) {
				//   console.log(resp)
				  var id,strTags;
				  for ( var i = 0 ; i < tabModels.length ; i ++ ) {
					var model = tabModels[i]
					id = model.get('pk_id');
					for(var j = 0 ; j < tab.length ; j++ ) {
						if( tab[j].pk_id == id ) {
						strTags = tab[j].tags;
						break;
						}
					}
					model.set({tags:strTags});
					id = strTags = undefined
				  }
			  })
			  .fail(function (err) {
				// console.log(err);
				alert("someting goes wrong")
			  })

		},
		saveTags : function(e){
			var _this = this;
			var strTags = ''
			var lisTags = $('.js-data-tags').select2('data');
			for( var i = 0 ; i < lisTags.length ; i++ ) {
				strTags+= lisTags[i].text;
				if(i+1 < lisTags.length) {
					strTags+=',';
				}
			}
			// var tabSelected = this.parent.model.get('newSelected');
			var tabModels = this.collection.where({activeFront : true })

			
			if(tabModels.length == 1 ){
				tabModels[0].set({"tags" :strTags});
			}
			if( tabModels.length > 1) {
				var modelsToUpdate = [];
				var status,model,tagsStr;
				var newTagsTab = [];
				for (var i = 0 ; i < tabModels.length ; i++ ) {
					model = tabModels[i]
					tagsStr = model.get('tags');
					modelsToUpdate.push(model.toJSON())
					if( tagsStr ) {
						newTagsTab = tagsStr.split(',');

						newTagsTab = _.difference(newTagsTab,this.unSelectedTagsTab);

						if( newTagsTab.length) {
							newTagsTab = _.union(newTagsTab,this.selectedTagsTab);
						}
					}
					else {
						newTagsTab = this.selectedTagsTab;
					}
					
					if(newTagsTab.length) {
						modelsToUpdate[modelsToUpdate.length - 1].tags = newTagsTab.join(',');
					}
					else {
						modelsToUpdate[modelsToUpdate.length - 1].tags = null;
					}
				status = tagsStr = model = undefined
				newTagsTab = []
			}
			this.updateManyTags(modelsToUpdate);
			this.unSelectedTagsTab = [];
			this.selectTagsTab = [];
			return;
		}
		this.unSelectedTagsTab = [];
		this.selectTagsTab = [];
	},

	});

});
