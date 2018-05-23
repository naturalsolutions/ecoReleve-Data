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
		model: Backbone.Collection.extend({
			model : CamTrapImageModel
		}),
		modelEvents: {
			"change": "changeValid",

		},
		ui : {
		'tagsInput' :'#tagsInput',
		'selectTags' : '.js-data-tags',
		'refusedBtn':'#refusedBtn',
		'acceptedBtn' : '#acceptedBtn',
		'stationBtn' : '#StationBtn',
		'createStationBtn':'#createStationBtn',
		'editStationBtn':'#editStationBtn',
		'deleteStationBtn':'#deleteStationBtn',
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
			this.parent = options.parent;
			this.dataTags = null;
			this.model = options.model;
			this.unSelectedTagsTab = [];
			this.selectedTagsTab = [];
			this.jsonParsed = options.jsonParsed; 
			this.$elemTags = undefined;
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
				width : '100%',
				dropdownAutoWidth: true,
				// allowClear: true
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

		fillElemTags : function(aCollection) {
			var _this = this;
			if( !_this.$elemTags) {
				_this.instantiateElemTags()
			}
			if ( !aCollection )
				return;
			if (aCollection.length == 1 /**&& aCollection.at(0).get('validated') == 4 */) {
				var tagsTab = [];
				var tagsStr = aCollection.at(0).get('tags');
				
				if(tagsStr) {
				   tagsTab = tagsStr.split(',') ;
				}

				 if( tagsTab.length > 0 ) {
				   _this.$elemTags.val(tagsTab).trigger('change');
				 }
				 else {
					_this.$elemTags.val(null).trigger('change');
				 }
			}

			if (aCollection.length > 1 ) {
				var model;
				var allTags=[];
				var tagsAndOccurences
				var allTagsStr =''
				var tmpTagsStr = '';
				var finalTagsTab = []

				//filter collection only accepted photos
				var filteredCol = aCollection.where({validated:2})


				for( var i = 0 ; i < filteredCol.length ; i ++ ) {
					model = filteredCol[i];
					if ( model.get('validated') == 2 ) {
						tmpTagsStr = model.get('tags');
						 if(tmpTagsStr) {
							if(allTagsStr) {
								allTagsStr+=',';
							}
							allTagsStr+=tmpTagsStr;
						 }
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
				var tabSelected = this.parent.model.get('newSelected')
			if( tabSelected && tabSelected.length > 1 ) {
				this.displayMultiselect();
			}
			if( tabSelected && tabSelected.length == 1 ) {
				this.displaySingleSelect();
			}
			
		},

		displaySingleSelect: function() {
			var tabSelected =  this.parent.model.get('newSelected');
			var modelTmp = this.parent.tabView[tabSelected[0]].model;
			var statusPhoto = modelTmp.get('validated');
			var stationId = modelTmp.get('stationId');
			this.displayBtnsActions(statusPhoto);
			this.displayBtnsStation(statusPhoto,stationId);
			// this.displayTagsInput(statusPhoto);
			this.displayValidateSession();
			this.displayTagsSelect();
		},

		displayMultiselect : function() {
			
			var btnAccepted = this.ui.acceptedBtn[0];
			var btnRefused = this.ui.refusedBtn[0];
			btnAccepted.className = btnAccepted.className.replace(' disabled ','');
			btnRefused.className = btnRefused.className.replace(' disabled ','');

			var btnStation = this.ui.stationBtn[0];
			var btnCreateStation = this.ui.createStationBtn[0];
			var btnEditStation = this.ui.editStationBtn[0];
			var btnDeleteStation = this.ui.deleteStationBtn[0];
			btnStation.className = btnStation.className.replace(' disabled ','');
			btnCreateStation.className = btnCreateStation.className.replace(' disabled ','');
			btnDeleteStation.className = btnDeleteStation.className.replace(' disabled ','');
			if( btnEditStation.className.indexOf(' disabled ') === -1 ) {
				btnEditStation.className+= ' disabled ';
			}
			this.displayTagsSelect();
			this.displayValidateSession();
		},

		displayValidateSession : function() {
			var btnValidate = this.ui.validate[0];
			if( this.parent.nbPhotosNotChecked > 0 ) {
				if(btnValidate.className.indexOf(' disabled ') === -1 ) {
					btnValidate.className += ' disabled ';
				}
			}
			else {
			if(btnValidate.className.indexOf(' disabled ') > -1 ) {
				btnValidate.className = btnValidate.className.replace(' disabled ','');
				}
			}

		},

		displayBtnsActions : function(status) {
			var btnAccepted = this.ui.acceptedBtn[0];
			var btnRefused = this.ui.refusedBtn[0];
			switch(status) {
				case 1: {//undeterminate
					if( btnAccepted.className.indexOf(' disabled ') > -1 ) {
						btnAccepted.className = btnAccepted.className.replace(' disabled ','');
					}
					if( btnRefused.className.indexOf(' disabled ') > -1 ) {
						btnRefused.className = btnRefused.className.replace(' disabled ','');
					}
					break;
				}
				case 2: { // accepted
					if( btnAccepted.className.indexOf(' disabled ') === -1 ) {
						btnAccepted.className +=' disabled ';
					}
					if( btnRefused.className.indexOf(' disabled ') > -1 ) {
						btnRefused.className = btnRefused.className.replace(' disabled ','');
					}
					break;
				}
				case 4: { //refused
					if( btnRefused.className.indexOf(' disabled ') === -1 ) {
						btnRefused.className+=' disabled ';
					}
					if( btnAccepted.className.indexOf(' disabled ') > -1 ) {
						btnAccepted.className = btnAccepted.className.replace(' disabled ','');
					}
					break;
				}
				default: { //unknown
					if( btnAccepted.className.indexOf(' disabled ') > -1 ) {
						btnAccepted.className = btnAccepted.className.replace(' disabled ','');
					}
					if( btnRefused.className.indexOf(' disabled ') > -1 ) {
						btnRefused.className = btnRefused.className.replace(' disabled ','');
					}
					break;
				}
			}

		},
		displayBtnsStation: function(status,stationId) {
			var btnStation = this.ui.stationBtn[0];
			var btnCreateStation = this.ui.createStationBtn[0];
			var btnEditStation = this.ui.editStationBtn[0];
			var btnDeleteStation = this.ui.deleteStationBtn[0];

			switch(status) {
				case 2: { // accepted
					switch(stationId) {
						case undefined :
						case null: {
							if( btnStation.className.indexOf(' disabled ') > -1 ) {
								btnStation.className = btnStation.className.replace(' disabled ','');
							}
							if( btnCreateStation.className.indexOf(' disabled ') > -1 ) {
								btnCreateStation.className = btnCreateStation.className.replace(' disabled ','');
							}
							if( btnEditStation.className.indexOf(' disabled ') === -1 ) {
								btnEditStation.className+= ' disabled ';
							}
							if( btnDeleteStation.className.indexOf(' disabled ') === -1 ) {
								btnDeleteStation.className+= ' disabled ';
							}
							break;
						}
						default: {
							if( btnStation.className.indexOf(' disabled ') > -1 ) {
								btnStation.className = btnStation.className.replace(' disabled ','');
							}
							if( btnCreateStation.className.indexOf(' disabled ') === -1 ) {
								btnCreateStation.className += ' disabled ';
							}
							if( btnEditStation.className.indexOf(' disabled ') > -1 ) {
								btnEditStation.className = btnEditStation.className.replace(' disabled ','');
							}
							if( btnDeleteStation.className.indexOf(' disabled ') > -1 ) {
								btnDeleteStation.className = btnDeleteStation.className.replace(' disabled ','');
							}
							break;
						}
					}
					break;
				}
				default: { //unknown
					if( btnStation.className.indexOf(' disabled ') === -1 ) {
						btnStation.className += ' disabled ';
					}
					if( btnCreateStation.className.indexOf(' disabled ') === -1 ) {
						btnCreateStation.className += ' disabled '
					}
					if( btnEditStation.className.indexOf(' disabled ') === -1 ) {
						btnEditStation.className += ' disabled '
					}
					if( btnDeleteStation.className.indexOf(' disabled ') === -1 ) {
						btnDeleteStation.className += ' disabled '
					}
					break;
				}
			}

		},

		displayTagsSelect : function() {
			var _this = this;
			var tabSelected =  this.parent.model.get('newSelected');
			var disabled = true;
			var index
			for( var i = 0; i < tabSelected.length ; i ++ ) {
				index = tabSelected[i];
				if ( this.parent.tabView[index].model.get("validated") == 2 ) {
					disabled = false;
					break;
				}
			}
			this.$elemTags.prop('disabled' , disabled);
		},

		updateManyTags: function(tab) {
			var _this = this;
			var tabSelected = this.parent.model.get('newSelected');
			
			$.ajax({
				type: 'PUT',
				url: config.coreUrl + 'sensorDatas/camtrap/'+_this.parent.equipmentId+'/updateMany',
				contentType: 'application/json',
				data: JSON.stringify(tab)
			  })
			  .done(function (resp) {
				//   console.log(resp)
				  var index,item,id,strTags;
				  for ( var i = 0 ; i < tabSelected.length ; i ++ ) {
					index = tabSelected[i]
					item = _this.parent.tabView[index];
					if ( item.model.get('validated') == 2 ) {
						id = item.model.get('pk_id');
						  for(var j = 0 ; j < tab.length ; j++ ) {
							  if( tab[j].pk_id == id ) {
								strTags = tab[j].tags;
								break;
							  }
						  }
						  item.setSilentTags(strTags);
					}
					  index = item = id = strTags = undefined
					//   strTags = item.model.get('tags');
				  }
				// var item
				// for( var i = 0 ; i < tabItemAccepted.length ; i++ ) {
				//   index = tabItemAccepted[i]
				//   item = _this.tabView[index];
		
				//   item.setModelValidatedSilent(2);
				//   item = undefined;
				// }
				// _this.refreshCounter();
				// _this.updateUIWhenSelectionChange();
				// debugger;
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
			var tabSelected = this.parent.model.get('newSelected');

			
			if(tabSelected.length == 1 ){
				// this.parent.tabView[this.parent.currentPosition].addModelTags(strTags);
				this.parent.tabView[tabSelected[0]].setModelTags(strTags);
			}
			if( tabSelected.length > 1) {
				var modelsToUpdate = [];
				var status,model,tagsStr;
				var newTagsTab = [];
				for (var i = 0 ; i < tabSelected.length ; i++ ) {
					model = this.parent.tabView[tabSelected[i]].model
					status = model.get('validated');
					if( status === 2) { // tag only for validated img
						// model = this.parent.tabView[tabSelected[i]].model
						tagsStr = model.get('tags');
						modelsToUpdate.push(model.toJSON())
						if( tagsStr ) {
							newTagsTab = tagsStr.split(',');
							// console.log("origial",newTagsTab);
							// console.log("unselected",this.unSelectedTagsTab);
							// console.log("selected",this.selectedTagsTab);

							newTagsTab = _.difference(newTagsTab,this.unSelectedTagsTab);
							// console.log("diff",newTagsTab);

							if( newTagsTab.length) {
								newTagsTab = _.union(newTagsTab,this.selectedTagsTab);
							}
						}
						else {
							newTagsTab = this.selectedTagsTab;
						}
						// console.log("finaly",newTagsTab)
						
						if(newTagsTab.length) {
							modelsToUpdate[modelsToUpdate.length - 1].tags = newTagsTab.join(',');
							// this.parent.tabView[tabSelected[i]].setModelTags(newTagsTab.join(','));
						}
						else {
							modelsToUpdate[modelsToUpdate.length - 1].tags = null;
							// this.parent.tabView[tabSelected[i]].setModelTags(null);
						}
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


			// if( this.parent.tabSelected.length > 0) {
			// 	for (var i = 0 ; i < this.parent.tabSelected.length ; i++ ) {
			// 		var status = this.parent.tabView[this.parent.tabSelected[i]].model.get('validated');
			// 		if( status === 2) { // tag only for validated img
			// 			var newTagsTab = [];
			// 			var tagsStr = this.parent.tabView[this.parent.tabSelected[i]].model.get('tags');
			// 			if( tagsStr ) {
			// 				newTagsTab = tagsStr.split(',');
			// 				console.log("origial",newTagsTab);
			// 				console.log("unselected",this.unSelectedTagsTab);
			// 				console.log("selected",this.selectedTagsTab);

			// 				newTagsTab = _.difference(newTagsTab,this.unSelectedTagsTab);
			// 				console.log("diff",newTagsTab);

			// 				if( newTagsTab.length) {
			// 					newTagsTab = _.union(newTagsTab,this.selectedTagsTab);
			// 				}
			// 			}
			// 			else {
			// 				newTagsTab = this.selectedTagsTab;
			// 			}
			// 			console.log("finaly",newTagsTab)
			// 			if(newTagsTab.length) {
			// 				this.parent.tabView[this.parent.tabSelected[i]].setModelTags(newTagsTab.join(','));
			// 			}
			// 			else {
			// 				this.parent.tabView[this.parent.tabSelected[i]].setModelTags(null);
			// 			}
			// 		}
			// 	}
			// 	this.unSelectedTagsTab = [];
			// 	this.selectTagsTab = [];
			// 	return;
			// }
			// else if(this.parent.currentPosition !== null ){
			// 		// this.parent.tabView[this.parent.currentPosition].addModelTags(strTags);
			// 		this.parent.tabView[this.parent.currentPosition].setModelTags(strTags);
			// }
			// this.unSelectedTagsTab = [];
			// this.selectTagsTab = [];


			// var tabTags = this.ui.tagsInput.val();
			// // var tabTags = $('.select2-selection__rendered')[0].childNodes
			// 	if(this.parent.currentPosition !== null ){
			// 		if (tabTags.length > 0) {
			// 		this.parent.tabView[this.parent.currentPosition].setModelTags(tabTags);
			// 		}
			// 		else {
			// 			//TODO effacer les tags
			// 			this.parent.tabView[this.parent.currentPosition].setModelTags("");
			// 		}
			// }
		},
		// removeAll : function() {
		// 	this.ui.tagsInput.tagsinput('removeAll');
		// }


	});

});
