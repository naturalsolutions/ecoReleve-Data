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
			console.log("on init la toolBar youhouuuuuuuu")
			this.parent = options.parent;
			this.dataTags = null;
			this.model = options.model;// || new CamTrapImageModel();
			this.unSelectedTagsTab = [];
			this.selectedTagsTab = [];
			this.jsonParsed = options.jsonParsed; 
			this.$elemTags = undefined;
			// this.dataTags = $.ajax({
			// 	type: 'POST',
			// 	url: config.thesaurusUrl + '/fastInitForCompleteTree/',
			// 	contentType:"application/json; charset=utf-8",
			// 	dataType:"json",
			// 	data : '{"StartNodeID": "167222", "lng": "en", "IsDeprecated": "false"}'
			//   })
			//   .done(function (resp) {
				  
			// 	console.log(resp);
			//   })
			//   .fail(function (err) {
			// 	console.log(err);
			//   });
		

		},

		// parseJsonRecur: function(obj) {
		// 	var jsonString = ''
		// 	var _this = this;
		// 	if( Array.isArray(obj) ) {
		// 		var tab = obj;
		// 		for( var i = 0 ; i < tab.length ; i++ ) {
		// 			jsonString += ' { "id" : "' + tab[i].value + '", "text" : "'+ tab[i].value +'" } ';
		// 			if( i+1 < tab.length ) {
		// 				jsonString += ' , ';
		// 			}
		// 		}
		// 	}
		// 	for( var item in obj) {
		// 		if( item ==='children' && typeof obj[item] == 'object' ) {
		// 			jsonString += ' , "children" : [ ';
		// 			jsonString += _this.parseJsonRecur(obj[item]);
		// 			jsonString += ' ] ';
		// 		}
		// 		if( item ==='value' ) {
		// 			jsonString += '{"text" : "'+ obj[item]+'"';
		// 		}
				
		// 	}
		// 	if( !Array.isArray(obj) ) {
		// 		jsonString += ' } ';
		// 	}
		// 	return jsonString;		
		// },

		instantiateElemTags : function() {
			var _this = this;
			_this.$elemTags = _this.$el.find('.js-data-tags').select2({
				data :  new Array( JSON.parse(_this.jsonParsed) ),
				maximumSelectionLength: 8,
				closeOnSelect : false,
				placeholder: 'Add a tag',
				tokenSeparators: [",", " "],
				separator : ',',
				tags: false, // prohib value not in thesau
				width : '100%',
				dropdownAutoWidth: true,
				// allowClear: true
			  });

			  //TODO maybe a better event to listen
			  _this.$elemTags.on('select2:closing', function(e) {
				console.log("event select2:closing fired ")
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
			if (aCollection.length == 1 ) {
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
				console.log("on va fill avec une collection multiple youhouuu")
			}

		},
		




		onRender: function(){
			var _this = this;
			console.log("on render la toolbar bottom")
				// $.when(this.dataTags)
				// .then(function(resp) {
				// 	if(!_this.jsonParsed) {
				// 		_this.jsonParsed = _this.parseJsonRecur(resp);
				// 	}

				// 	_this.instantiateElemTags()
				// 	_this.fillElemTags();

				// 	//   $('.js-data-tags').select2().val(['1','2']).trigger('change');
				// }) 
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
			this.displayTagsInput(statusPhoto);
			this.displayValidateSession();
			this.displayTagsSelect(statusPhoto);
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

		displayTagsSelect : function(status) {
			var _this = this;
			if( status === 4 ) {
				setTimeout(() => {
					_this.$elemTags.prop('disabled' , true);
					
				}, 100);
			}

		},

		displayTagsInput: function(status) {
			// var tagsInput = this.ui.tagsInput[0];

			// switch(status) {
			// 	case 2: { // accepted
			// 		tagsInput.style.display = "";
			// 		break;
			// 	}
			// 	default: { //unknown
			// 		tagsInput.style.display = "None";
			// 		break;
			// 	}
			// }
			// this.ui.tagsInput.tagsinput({
			// 	/*	typeaheadjs: {
			// 			name: 'citynames',
			// 			displayKey: 'name',
			// 			valueKey: 'name',
			// 			source: citynames.ttAdapter()
			// 			},*/
			// 					 maxTags: 5,
			// 					trimValue: true,
			// 			});
		},
		
		changeModel : function (model) {
			if( this.model !== model) {
				var _this = this 
				this.stopListening(this.model);
				this.model = model;
				this.listenTo(this.model, "change" , function(event) {
					if( 'tags' in event.changed ) {
						return;
					}
					_this.render()
				});
				this.render();
			}
		},

		addTag: function(tag){
			this.ui.tagsInput.tagsinput('add',tag);
			//console.log(e);
		},

		// verifTag: function(e){//avant d'ajouter un tag
		// 	var capitalise = e.item.substr(0, 1);
		// 	if(e.item.length > 1 ) {
		// 		 capitalise = capitalise.toUpperCase() + e.item.substr(1).toLowerCase();
		// 	}
		// 	else {
		// 		capitalise = capitalise.toUpperCase();
		// 	}
		// 	if ( e.item !== capitalise) {
		// 		e.cancel = true;
		// 		this.ui.tagsInput.tagsinput('add',capitalise);
		// 	}
		// },

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

			if( this.parent.tabSelected.length > 0) {
				for (var i = 0 ; i < this.parent.tabSelected.length ; i++ ) {
					var status = this.parent.tabView[this.parent.tabSelected[i]].model.get('validated');
					if( status === 2) { // tag only for validated img
						var newTagsTab = [];
						var tagsStr = this.parent.tabView[this.parent.tabSelected[i]].model.get('tags');
						if( tagsStr ) {
							newTagsTab = tagsStr.split(',');
							console.log("origial",newTagsTab);
							console.log("unselected",this.unSelectedTagsTab);
							console.log("selected",this.selectedTagsTab);

							newTagsTab = _.difference(newTagsTab,this.unSelectedTagsTab);
							console.log("diff",newTagsTab);

							if( newTagsTab.length) {
								newTagsTab = _.union(newTagsTab,this.selectedTagsTab);
							}
						}
						else {
							newTagsTab = this.selectedTagsTab;
						}
						console.log("finaly",newTagsTab)
						if(newTagsTab.length) {
							this.parent.tabView[this.parent.tabSelected[i]].setModelTags(newTagsTab.join(','));
						}
						else {
							this.parent.tabView[this.parent.tabSelected[i]].setModelTags(null);
						}
					}
				}
				this.unSelectedTagsTab = [];
				this.selectTagsTab = [];
				return;
			}
			else if(this.parent.currentPosition !== null ){
					// this.parent.tabView[this.parent.currentPosition].addModelTags(strTags);
					this.parent.tabView[this.parent.currentPosition].setModelTags(strTags);
			}
			this.unSelectedTagsTab = [];
			this.selectTagsTab = [];


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
		removeAll : function() {
			this.ui.tagsInput.tagsinput('removeAll');
		}


	});

});
