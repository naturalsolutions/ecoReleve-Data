//radio
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'config',
  'ns_map/ns_map',
  'ns_form/NSFormsModuleGit',
  'moment',
  'ns_navbar/navbar.view',
  'backbone.paginator',
  './lyt-camTrapItemView',
  './lyt-camTrapImageModel',
  './lyt-camTrapToolsBarView',
  './lyt-camTrapModal',
  'backbone.marionette.keyShortcuts',
  'backbone.virtualcollection',
  './lyt-camTrapToolsBarTopView',
  'jqueryui',
  './lyt-imageDetails',
  'exif-js',
  './lyt-camTrapActionsContainer',
  'backgrid.paginator'
], function ($, _, Backbone, Marionette, Swal, Translater,
  config, NsMap, NsForm, moment, Navbar, PageColl,
  CamTrapItemView, CamTrapImageModel, ToolsBar, ModalView, BckMrtKeyShortCut,
  virtualcollection, ToolsBarTop, jqueryUi, imageDetailsView, Exif,ActionsContainer) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/validate/templates/tpl-camTrapValidateDetail.html',

    className: 'full-height animated white',
    childEvents: {

    },
    keyShortcuts: {
      'up': 'mouvement',
      'down': 'mouvement',
      'left': 'mouvement',
      'right': 'mouvement',
      'tab': 'findTags',
      '+': 'addStars',
      '-': 'decreaseStars',
      'space': 'displayModal',
      // 'backspace': 'undeterminatePhoto',
      'enter': function(){ $('i#acceptedBtn').click(); },//'simulateAcceptPhoto',
      'del': function(){$('i#refusedBtn').click();},//'simulateRejectPhoto',
      'ins': function(){$('i#createStationBtn').click();},
      'backspace': function(){$('i#deleteStationBtn').click();},
      'esc': 'leaveModal',
      'pagedown': 'nextPage',
      'pageup': 'prevPage',
      'home': 'firstPage',
      'end': 'lastPage',
      '1': 'setStars',
      '2': 'setStars',
      '3': 'setStars',
      '4': 'setStars',
      '5': 'setStars'
      
    },

    events: {
      'click i#refusedBtn': 'rejectPhoto',
      'click i#acceptedBtn': 'acceptPhoto',
      // 'click i#checkedBtn': 'undeterminatePhoto',
      'click i#leftMouvementBtn': 'leftMouvement',
      'click i#rightMouvementBtn': 'rightMouvement',
      'click button#validate': 'validateAll',
      'click .reneco-ECOL-ecollectionsmall': 'clickOnIconeView',
      'click .reneco-image_file': 'clickOnIconeView',
      'click .reneco-list': 'clickOnIconeView',
      'click #js_accepted_top,#js_refused_top,#js_checked_top,#js_notchecked_top,#infossession,#js_stationed_top': 'filterCollectionCtrl',
      'click button#filternavbtn': 'filterNavOpen',
      'click i#closeNav': 'filterNavClose',
      'click input[name="filterstatus"]': 'filterCollectionCtrl',
      'click i#createStationBtn': 'createStation',
      'click i#deleteStationBtn': 'removeStation',
      'click i#editStationBtn': 'editStation',
      'click img' : 'handleFocus'
    },

    ui: {
      'grid': '#grid',
      'totalEntries': '#totalEntries',
      'gallery': '#gallery',
      'gallerytest': '#gallerytest',
      'siteForm': '#siteForm',
      'sensorForm': '#sensorForm',
      

      'dataSetIndex': '#dataSetIndex',
      'dataSetTotal': '#dataSetTotal',

      'totalS': '#totalS',
      'total': '#total',
      'paginator': '#paginator',
      'imageFullScreen': '#imageFullScreen',
      'refusedBtn':'#refusedBtn',
      'acceptedBtn' : '#acceptedBtn',
      'stationBtn' : '#StationBtn',
      'createStationBtn':'#createStationBtn',
      'editStationBtn':'#editStationBtn',
      'deleteStationBtn':'#deleteStationBtn',
      
    },
    
    regions: {
      'rgNavbar': '.js-rg-navbar',
      'rgGallery': '#gallery',
      'rgFullScreen': '#imageFullScreen',
      'rgToolsBar': '#rgToolsBar',
      'rgToolsBarTop': '#rgToolsBarTop',
      'rgImageDetails': '#imageDetails',
      'rgActionsContainer' : '#rgActionsContainer',
    },
    initialize: function (options) {
      var _this = this;
      this.equipmentId = parseInt(this.checkUrl(location.hash));

      this.translater = Translater.getTranslater();
      this.type = options.type;
      this.model = options.model || new Backbone.Model();
      this.lastImageActive = null;
      this.currentViewImg = null;
      this.currentPosition = 0;
      this.pageChange = '';
      this.currentCollection = null;
      this.currentPaginator = null;
      this.nbPhotos = 0;
      this.nbPhotosAccepted = 0;
      this.nbPhotosRefused = 0;
      // this.nbPhotosChecked = 0;
      this.nbPhotosNotChecked = 0;
      this.nbPhotosStationed = 0;
      this.stopSpace = false;
      this.tabSelected = [];
      this.selectedCollection = new Backbone.Collection({model:CamTrapImageModel}); //will contains camtrapmodel and position in tabview 

      this.globalGrid = options.globalGrid;
     

      this.fetchSessionInfos();
      this.initCollection();

      this.viewActions = new ActionsContainer({
        collection : _this.myImageCollection
      })     
    },

    fetchSessionInfos: function () {
      var _this = this;
      $.ajax({
          url: config.coreUrl + 'sensorDatas/' + _this.type + '/' + _this.equipmentId,
        })
        .done(function (resp) {
          _this.sensorId = resp.FK_Sensor;
          _this.siteId = resp.FK_MonitoredSite;
          _this.displaySensorForm();
          _this.displaySiteForm();
        })
        .fail(function () {
          // console.log("pas bon");
        });

    },

    displaySensorForm: function () {
      this.sensorForm = new NsForm({
        name: 'sensorForm',
        buttonRegion: [this.ui.btn],
        modelurl: config.coreUrl + 'sensors',
        formRegion: this.ui.sensorForm,
        displayMode: 'display',
        id: this.sensorId,
        reloadAfterSave: false,
      });
    },

    displaySiteForm: function () {
      this.monitoredSiteForm = new NsForm({
        name: 'siteForm',
        buttonRegion: [this.ui.btn],
        modelurl: config.coreUrl + 'monitoredSites',
        formRegion: this.ui.siteForm,
        displayMode: 'display',
        id: this.siteId,
        reloadAfterSave: false,
      });
    },

    initCollection: function () {
      var _this = this;
      var ImageCollection = PageColl.extend({
        model: CamTrapImageModel,
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl + 'sensorDatas/' + this.type + '/' + this.equipmentId + '/datas/',
        patch: function () {},
        getNextPage : function(options){
          if (this.hasNextPage()) {
            _this.pageChange = 'N';
          }
          return PageColl.prototype.getNextPage.call(this,options);
        },
        getPreviousPage : function(options){
          if (this.hasPreviousPage()) {
            _this.pageChange = 'P';
          }
            return PageColl.prototype.getPreviousPage.call(this,options);
        },
        getPage : function (index,options) {
          var tabModels = this.fullCollection.where({activeFront : true});
          for( var i = 0 ; i < tabModels.length ; i ++ ) {
            tabModels[i].set({'activeFront' : false})
          }
          return PageColl.prototype.getPage.call(this,index,options);
        }
        
      });

      this.myImageCollection = new ImageCollection();
      this.myImageCollection.sync('patch', this.myImageCollection, {
        error: function () {
          // console.log(this.myImageCollection);
          // console.log("sync impossible");
        }
      });

      this.paginator = new Backgrid.Extension.Paginator({
        collection: this.myImageCollection
      });

      this.myImageCollection.on('sync', function () {
        //triggered when collection fetched
        //set first item active
        this.models[_this.currentPosition].set({activeFront : true });
        _this.refreshCounter();
      });

      this.myImageCollection.on('change' , function(){
       var activeModel = this.where({activeFront : true})
       console.log("all active : ",activeModel)
      })

      this.myImageCollection.fetch();

      this.paginator.collection.on('reset', function (e) {
        // console.log("reset du paginator");
      });

    },

    findIndexOfElemImg : function(elem) {
      var index 
      var curElem
      for( var i =0 ; i < this.tabView.length ; i ++ ) {//loop on elm to find index img clicked
        curElem = this.tabView[i].el.getElementsByTagName('img');
        //TODO be sure that's work in any case
        if(curElem && (curElem[0] === elem) ) {
          index = i;
          break;
        }
        curElem = undefined;
      }
      return index;
    },
    handleFocus : function(e) {
      if (  this.stopSpace ){
        return;
      }
      var _this = this;
      var indexFind = this.findIndexOfElemImg( e.currentTarget )
      var lastPosition = this.currentPosition
      this.currentPosition = indexFind;
      var newTab = [];
      var idClicked = Number(e.currentTarget.id.replace("zoom_",''))
      var modelClicked = this.currentCollection.where({id : idClicked });
      var tabModelActivatedBefore = this.currentCollection.where({activeFront : true });

      if( e.ctrlKey ) { //ctrl + click add/remove item selected
        this.currentPosition = lastPosition
        //will activate everything then remove img ever selected
        for( var i = 0 ; i < modelClicked.length ; i++){
          modelClicked[i].set({activeFront : true })
        }
        if (tabModelActivatedBefore.length > 1) {
          for(var i = 0 ; i < modelClicked.length ; i++ ) {
            for( var j = 0 ; j< tabModelActivatedBefore.length ; j++) {
              if( tabModelActivatedBefore[j].cid ===  modelClicked[i].cid ){
                modelClicked[i].set({activeFront : false })
              }
            }
          }
        }
      }
      else {
        for( var i = 0 ; i < tabModelActivatedBefore.length ; i++ ) {
          tabModelActivatedBefore[i].set({activeFront : false })
        }
        for( var i = 0 ; i < modelClicked.length ; i++ ){
          modelClicked[i].set({activeFront : true })
        }

      }
      var tabModelActivated = this.currentCollection.where({activeFront : true });
      if( tabModelActivated.length == 1 ) {
        var model = tabModelActivated[0]
        this.currentPosition = this.currentCollection.indexOf(model)
        if (this.rgImageDetails.currentView != undefined) {
          this.rgImageDetails.currentView.changeDetails(this.tabView[this.currentPosition].model)
        }

        if (this.rgFullScreen.currentView !== undefined && this.stopSpace) {
          this.rgFullScreen.currentView.changeModel(this.tabView[this.currentPosition].model);
        }
      }
      this.currentCollection.trigger('change')
    },


    updateUIWhenSelectionChange : function() {
      return;
      var _this = this;
      var tabSelected = this.model.get('newSelected');
      if( !tabSelected ) {
        // console.log("désactive tout");
        
      } 
      var collection = new Backbone.Collection();
      var index,tmpModel;

      for( var i = 0 ; i < tabSelected.length ; i++ ) {
        index = tabSelected[i];
        tmpModel = this.tabView[index].model;
        collection.push(tmpModel)
        index = undefined
        tmpModel = undefined
      }

      $.when(_this.dataTags)
      .then(function(resp) {
        _this.toolsBar.fillElemTags(collection);      
      })



    },

    refreshCounter: function () {
      this.nbPhotos = this.myImageCollection.fullCollection.length;
      this.nbPhotosAccepted = this.myImageCollection.fullCollection.where({
        validated: 2
      }).length;
      this.nbPhotosRefused = this.myImageCollection.fullCollection.where({
        validated: 4
      }).length;
      // this.nbPhotosNotChecked = this.myImageCollection.fullCollection.where({
      //   validated: null
      // }).length;
      this.nbPhotosNotChecked = this.myImageCollection.fullCollection.filter(function (model) {
        return (model.get('validated') !== 4 && model.get('validated') !== 2);
      }).length;
      this.nbPhotosStationed = this.myImageCollection.fullCollection.filter(function (model) {
        return (model.get('stationId') !== null && model.get('validated') === 2);
      }).length;

      if (this.toolsBarTop) {
        this.toolsBarTop.$el.find("#nbphotos").text(this.nbPhotos);
        this.toolsBarTop.$el.find("#nbphotosaccepted").text(this.nbPhotosAccepted);
        this.toolsBarTop.$el.find("#nbphotosrefused").text(this.nbPhotosRefused);
        this.toolsBarTop.$el.find("#nbphotosNotChecked").text(this.nbPhotosNotChecked);
        this.toolsBarTop.$el.find("#nbphotosStationed").text(this.nbPhotosStationed);
      }
    },

    onRender: function () {
      this.$el.i18n();
      this.rgActionsContainer.show(this.viewActions)
    },

    onShow: function () {
      var _this = this;
      this.ui.imageFullScreen.hide()
      this.display();
    },

    display: function () {
      var _this = this;
      this.listenTo(this.myImageCollection, 'reset', function (e) { // trigger on init or on change page
        
        _this.displayImages(_this.myImageCollection);
        _this.rgToolsBarTop.show(this.toolsBarTop);
        this.displayImageDetails(_this.myImageCollection.models[this.currentPosition]);
      });
      this.currentCollection = this.myImageCollection;
      this.displayPaginator(this.paginator)
      this.displayToolsBar();
      this.displayToolsBarTop();
    },

    displayImages: function (myCollectionToDisplay) {
      var _this = this;
      if ( myCollectionToDisplay !== this.currentCollection) {
        var tabModels = this.currentCollection.where({activeFront : true })
        for( var i = 0 ; i< tabModels.length ; i++ ) {
          tabModels[i].set({activeFront : false })
        }
        this.currentCollection = myCollectionToDisplay;
        this.rgActionsContainer.currentView.changeCollection(this.currentCollection)
        this.rgToolsBar.currentView.changeCollection(this.currentCollection)
      }
      var ImageModel = new CamTrapImageModel();
      

      //TODO detruit les view a la main sinon pb avec les models
      if (typeof (_this.tabView) !== "undefined") {
        this.destroyViews(_this.tabView);
      }

      this.tabView = [];
      myCollectionToDisplay.each(function (model) {
        var newImg = new CamTrapItemView({
          model: model,
          parent: _this,
        });
        _this.tabView.push(newImg);
        _this.ui.gallery.append(newImg.render().el);

      });
      if (this.tabView.length > 0) {
        var newPosition = 0;
        switch (this.pageChange) {
          case 'N':
            { //next page
              this.pageChange = '';
              break;
            } 
          case 'P':
            { //previous page
              this.pageChange = '';
              newPosition = this.tabView.length - 1; //position to focus
              break;
            }
          default:
            {
              // this.tabSelected = [];
              break;
            }
        }
        if (this.currentPosition != newPosition ) {
          this.currentPosition = newPosition;
        }
        this.tabView[this.currentPosition].model.set({activeFront : true});
        // this.model.trigger('change', this.model, [newPosition]);

        // this.tabSelected = [];

        
        if (this.rgFullScreen.currentView !== undefined && this.stopSpace) { //si le modal existe on change
          this.rgFullScreen.currentView.changeModel(this.tabView[this.currentPosition].model);
        }

        var tabOldUiSelected = [];
        var tabNewSelected = [];
        $('#gallery').selectable({
          filter: '.imageCamTrap',
          distance: 10,

          start: function (e) { // for all elem
            tabOldUiSelected = _this.currentCollection.where({activeFront : true })
            if (tabOldUiSelected.length == 1 ) {
              var model = tabOldUiSelected[0]
              _this.currentPosition = _this.currentCollection.indexOf(model)
            }
            for ( var i = 0 ; i < tabOldUiSelected.length ; i++) {
              tabOldUiSelected[i].set({activeFront : false});
            }
          },

          selected: function (e, ui) { // for one elem
            var elem = ui.selected;
            var imgTmp = elem.getElementsByTagName('img')[0]
            var idClicked = Number(imgTmp.id.replace("zoom_",''))
            var modelSelected = _this.currentCollection.where({id : idClicked });
            modelSelected[0].set({activeFront : true})
            tabNewSelected.push(modelSelected[0])
          },

          unselected: function (e, ui) { //for one elem
            var elem = ui.unselected;
          },

          stop: function (e) { //for all elem
              if( e.ctrlKey ) {
                for( var i =0 ; i < tabOldUiSelected.length ; i++ ) { //restore all selected
                  tabOldUiSelected[i].set({activeFront : true})
                }
                for ( var i = 0 ; i < tabNewSelected.length ; i++ ) {
                  for (var j = 0 ; j < tabOldUiSelected.length ; j++ ) {
                    if(tabNewSelected[i].cid === tabOldUiSelected[j].cid ) {
                      tabNewSelected[i].set({activeFront : false })                    
                      break;
                    }
                  } 
                }
              }
              var tabModelsActivate = _this.currentCollection.where({activeFront : true })
              if( tabModelsActivate.length == 0) {
                //Nope!
                for( var i =0 ; i < tabOldUiSelected.length ; i++ ) { //restore all selected
                  tabOldUiSelected[i].set({activeFront : true})
                }
              }
              if( tabModelsActivate.length == 1) {
                  var model = tabModelsActivate[0]
                  _this.currentPosition = _this.currentCollection.indexOf(model)
              }
              tabOldUiSelected = [];
              tabNewSelected = [];

            /*  keep it : algo for all edit all tags in all photos

            if (_this.tabSelected.length > 0) {
              var allTagsTabs = [];
              for( var i = 0 ; i < _this.tabSelected.length ; i++) {
                var tagTmp = _this.tabView[_this.tabSelected[i]].model.get('tags');
                var tagTmpTab = []
                if(tagTmp) {
                  tagTmpTab = tagTmp.split(',');
                }
                if(!allTagsTabs.length) {
                  allTagsTabs = tagTmpTab;
                }
                else {
                  allTagsTabs = _.union(allTagsTabs,tagTmpTab)
                }
              }
              _this.toolsBar.$elemTags.val(null).trigger('change');
              _this.toolsBar.$elemTags.val(allTagsTabs).trigger('change');
              // console.log("all tags in selection : ",allTagsTabs);
              // var $inputTags = _this.toolsBar.$el.find("#tagsInput");
              // var $inputTag = _this.toolsBar.$el.find(".bootstrap-tagsinput input");
              // var $bootstrapTag = _this.toolsBar.$el.find(".bootstrap-tagsinput");
              // if (!$inputTags.prop("disabled")) {
              //   $inputTag.prop("disabled", true);
              //   $inputTags.prop("disabled", true);
              //   $bootstrapTag.css("visibility", "hidden");
              // }
            }*/
          }
        });
      }
    },

    

    displayImageDetails: function (model) {
      var _this = this;
      //imageDetails
      this.imageDetails = new imageDetailsView({
        parent: _this,
        model: model
      });

      this.rgImageDetails.show(this.imageDetails)

    },

    displayPaginator: function (pagin) {
      this.currentPaginator = pagin;
      this.ui.paginator.html('');
      this.ui.paginator.append(pagin.render().el);
    },

    parseJsonRecur: function(obj) {
			var jsonString = ''
			var _this = this;
			if( Array.isArray(obj) ) {
				var tab = obj;
				for( var i = 0 ; i < tab.length ; i++ ) {
					jsonString += ' { "id" : "' + tab[i].value + '", "text" : "'+ tab[i].value +'" } ';
					if( i+1 < tab.length ) {
						jsonString += ' , ';
					}
				}
			}
			for( var item in obj) {
				if( item ==='children' && typeof obj[item] == 'object' ) {
					jsonString += ' , "children" : [ ';
					jsonString += _this.parseJsonRecur(obj[item]);
					jsonString += ' ] ';
				}
				if( item ==='value' ) {
					jsonString += '{"text" : "'+ obj[item]+'"';
				}
				
			}
			if( !Array.isArray(obj) ) {
				jsonString += ' } ';
			}
			return jsonString;		
		},

    displayToolsBar: function () {
      var _this = this;
      this.dataTags = $.ajax({
				type: 'POST',
				url: config.thesaurusUrl + '/fastInitForCompleteTree/',
				contentType:"application/json; charset=utf-8",
				dataType:"json",
				data : '{"StartNodeID": "2012495", "lng": "en", "IsDeprecated": "false"}'
        });

      $.when(_this.dataTags)
      .then(function(resp) {
        // resp.children.push({ title:"Standard quality",value : "Standard quality", children: []})
        // resp.children.push({ title:"Poor quality", value:"Poor quality", children: []})
        if(!_this.jsonParsed) {
          _this.jsonParsed = _this.parseJsonRecur(resp);
        }
        // _this.jsonParsed.push({})
        _this.toolsBar = new ToolsBar({
          parent: _this,
          collection : _this.currentCollection,
          jsonParsed : _this.jsonParsed
        });
        _this.rgToolsBar.show(_this.toolsBar);
      })
        

    },

    displayToolsBarTop: function (nbPhotos) {
      var _this = this;
      this.toolsBarTop = new ToolsBarTop({
        parent: _this
      });
      this.rgToolsBarTop.show(this.toolsBarTop);
      this.refreshCounter();
    },





    filterNavOpen: function () {
      var sidenav = this.$el.find("#mySidenav");
      sidenav.css('width', "250px");
    },
    filterNavClose: function () {
      var sidenav = this.$el.find("#mySidenav");
      sidenav.css('width', "0");
    },
    clickOnIconeView: function (e) {
      var _this = this;
      e.preventDefault();

      var $elemToInactive = $('#rgToolsBarTop .active');
      var $elemToActive = $(e.target);
      if ($elemToInactive[0] != $elemToActive[0]) { //handle click on same icon
        $elemToInactive.toggleClass('active'); //remove active actual elem
        $elemToActive.toggleClass('active'); // add active elem clicked
        if ($elemToActive.hasClass('reneco-ECOL-ecollectionsmall')) {
          this.leaveModal();
        } else if ($elemToActive.hasClass('reneco-image_file')) {
          this.displayModal(e);
        }
      }
      e.stopPropagation();
    },
    checkUrl: function (url) {
      var tmp = url.replace('#validate/camtrap/', '');
      if (/^(\-|\+)?([0-9]+|Infinity)$/.test(tmp))
        return Number(tmp);
      return NaN;
    },
    destroyViews: function (tabView) {
      for (var i = 0; i < tabView.length; i++) {
        tabView[i].destroy();
      }
    },
    reloadFromNavbar: function (model) {
      this.model = model;
      this.sensorId = this.model.get('fk_sensor');
      this.siteId = this.model.get('FK_MonitoredSite');
      this.equipmentId = this.model.get('equipID');

      this.initCollection();

      this.display();
    },


    setTotal: function () {
      this.ui.totalS.html(this.grid.grid.getSelectedModels().length);
      this.ui.total.html(this.grid.grid.collection.length);
    },

    addStars: function(e) {
      var tabModels = this.currentCollection.where({activeFront : true });
      if( tabModels.length > 1) { //batch
        this.addStarsAllPhoto(tabModels);        
      }
      if( tabModels.length == 1) { //single
        var tmpNote = Number(tabModels[0].get('note'));
        var nextNote = tmpNote >= 5 ? 5 : (tmpNote + 1) ;
        tabModels[0].set({note : nextNote },{refreshUI : true});
      }
    },

    addStarsAllPhoto : function(tabModels) {
      var _this = this;
      var oldNotesdValues = []
      for( var i =0 ; i< tabModels.length ; i++ ) {
        var tmpNote = Number(tabModels[i].get('note'));
        var nextNote = tmpNote >= 5 ? 5 : (tmpNote + 1) ;

        oldNotesdValues.push(tmpNote )
        tabModels[i].set({note : nextNote },{silent:true});
      }
      $.ajax({
        type: 'PUT',
        url: config.coreUrl + 'sensorDatas/camtrap/'+this.equipmentId+'/updateMany',
        contentType: 'application/json',
        data: JSON.stringify(tabModels)
      })
      .done(function (resp) {
        for( var i =0 ; i< tabModels.length ; i++ ) {
          tabModels[i].trigger("custom:refreshUI");
        }
        _this.refreshCounter();
        
      })
      .fail(function (err) {
        for( var i =0 ; i< tabModels.length ; i++ ) {
          tabModels[i].set({note : oldNotesdValues[i] },{silent:true,refreshUI : true});
        }
        _this.refreshCounter();
      })

    },

    decreaseStars: function(e) {
      var tabModels = this.currentCollection.where({activeFront : true });
      if( tabModels.length > 1) { //batch
        this.decreaseStarsAllPhoto(tabModels);        
      }
      if( tabModels.length == 1) { //single
        var tmpNote = Number(tabModels[0].get('note'));
        var nextNote = tmpNote <= 1 ? 1 : (tmpNote - 1) ;
        tabModels[0].set({note : nextNote },{refreshUI : true});
      }
    },

    decreaseStarsAllPhoto: function(tabModels) {
      var _this = this;
      var oldNotesdValues = []
      for( var i =0 ; i< tabModels.length ; i++ ) {
        var tmpNote = Number(tabModels[i].get('note'));
        var nextNote = tmpNote <= 1 ? 1 : (tmpNote - 1) ;

        oldNotesdValues.push(tmpNote )
        tabModels[i].set({note : nextNote },{silent:true});
      }
      $.ajax({
        type: 'PUT',
        url: config.coreUrl + 'sensorDatas/camtrap/'+this.equipmentId+'/updateMany',
        contentType: 'application/json',
        data: JSON.stringify(tabModels)
      })
      .done(function (resp) {
        for( var i =0 ; i< tabModels.length ; i++ ) {
          tabModels[i].trigger("custom:refreshUI");
        }
        _this.refreshCounter();
        
      })
      .fail(function (err) {
        for( var i =0 ; i< tabModels.length ; i++ ) {
          tabModels[i].set({note : oldNotesdValues[i] },{silent:true,refreshUI : true});
        }
        _this.refreshCounter();
      })
    },

    setStars : function(e) {
      var keyNote = Number(e.key);
      var tabModels = this.currentCollection.where({activeFront : true });
      if( tabModels.length > 1) { //batch
        this.setStarsAllPhoto(tabModels,keyNote);        
      }
      if( tabModels.length == 1) { //single
        tabModels[0].set({note : keyNote },{refreshUI : true});
      }
    },

    setStarsAllPhoto : function(tabModels , note ) {
      var _this = this;
      var oldNotesdValues = []
      for( var i =0 ; i< tabModels.length ; i++ ) {
        var tmpNote = Number(tabModels[i].get('note'));
        oldNotesdValues.push(tmpNote )
        tabModels[i].set({note : note },{silent:true});
      }
      $.ajax({
        type: 'PUT',
        url: config.coreUrl + 'sensorDatas/camtrap/'+this.equipmentId+'/updateMany',
        contentType: 'application/json',
        data: JSON.stringify(tabModels)
      })
      .done(function (resp) {
        for( var i =0 ; i< tabModels.length ; i++ ) {
          tabModels[i].trigger("custom:refreshUI");
        }
        _this.refreshCounter();
        
      })
      .fail(function (err) {
        for( var i =0 ; i< tabModels.length ; i++ ) {
          tabModels[i].set({note : oldNotesdValues[i] },{silent:true,refreshUI : true});
        }
        _this.refreshCounter();
      })


    },

    acceptPhoto: function (e) {
      var tabModels = this.currentCollection.where({activeFront : true });
      if( tabModels.length > 1) { //batch
        this.acceptAllPhoto(tabModels);        
      }
      if( tabModels.length == 1) { //single
        tabModels[0].set({validated : 2 });
      }
    },

    acceptAllPhoto : function(tabModels) {
      var _this = this;
      var oldValidatedValues = []
      for( var i =0 ; i< tabModels.length ; i++ ) {
        oldValidatedValues.push(tabModels[i].get('validated') )
        tabModels[i].set({validated : 2 },{silent:true});
      }
      $.ajax({
        type: 'PUT',
        url: config.coreUrl + 'sensorDatas/camtrap/'+this.equipmentId+'/updateMany',
        contentType: 'application/json',
        data: JSON.stringify(tabModels)
      })
      .done(function (resp) {
        for( var i =0 ; i< tabModels.length ; i++ ) {
          tabModels[i].trigger("custom:refreshUI");
        }
        _this.refreshCounter();
        
      })
      .fail(function (err) {
        for( var i =0 ; i< tabModels.length ; i++ ) {
          tabModels[i].set({validated : oldValidatedValues[i] },{silent:true,refreshUI : true});
        }
        _this.refreshCounter();
      })

    },
    rejectPhoto: function (e) {
      if( e.currentTarget.className.indexOf('disabled') > -1 ) {
        return;
      }
      var tabModels = this.currentCollection.where({activeFront : true });
      var tabModelsWithStation = this.currentCollection.filter(function (model) {
        return (model.get('stationId') !== null && model.get('activeFront'));
      });

      if( tabModelsWithStation.length ) {
        this.handlerDestroyStations(tabModelsWithStation);
      }
      else {
        if( tabModels.length > 1 ) {
          this.rejectAllPhotos(tabModels);
        }
        if( tabModels.length == 1){
          tabModels[0].set({validated : 4 })
        }
      }
      
    },
    handlerDestroyStations : function(tabModelsWithStation) {
        var _this = this
        var text = '';
        var tabIndexPhoto = tabModelsWithStation.map(function(elem){
          return elem.collection.indexOf(elem)
        });
        if( tabModelsWithStation.length == 1 )  {
          text = 'Station will be destroyed for picture N°:<BR>'+tabIndexPhoto.join(',');;
        }
        else {
          text =  'Stations will be destroyed for pictures N°:<BR>'+tabIndexPhoto.join(',');;
        }


        Swal({
          heightAuto: false,
          title: 'Warning',
          // text: +_this.nbPhotosChecked + ' photos still underteminate and ' + (_this.nbPhotos - (_this.nbPhotosChecked + _this.nbPhotosAccepted + _this.nbPhotosRefused)) + ' not seen yet\n',
          html: text,
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: 'rgb(218, 146, 15)',
          confirmButtonText: 'Ok',
          cancelButtonText: 'Cancel',
          closeOnConfirm: true,
          closeOnCancel: true,
          
        }).then((result) => {
          if( 'value' in result ) {
            _this.removeStationsBdd(tabModelsWithStation);
          }

        });        
      
    },

    
    removeStationsBdd : function(tabModelsWithStation) {
      var _this = this ;
      var tabStationIdRejected = [];
      tabStationIdRejected = tabModelsWithStation.map(function(elem) {
        return elem.get('stationId');
      })
      $.ajax({
        type: 'POST',
        url: config.coreUrl + 'stations/deleteManyWithCamTrap',
        contentType: 'application/json',
        data: JSON.stringify(tabStationIdRejected)
      })
      .done(function (resp) {
        //ok so all stations are deleted 
        //and we are sure that all camptrap with stationsId is null so we reject
        for(var i = 0 ; i < tabModelsWithStation.length ; i++ ) {
          tabModelsWithStation[i].set({stationId : null } , {silent: true,refreshUI : true})
        }
        var tabModels = _this.currentCollection.where({activeFront : true });
        _this.rejectAllPhotos(tabModels)
      })
      .fail(function (err) {
        // console.log(err);
      })
        
    },

    rejectAllPhotos : function(tabModels){
      var _this = this;
      var oldValidatedValues = []
      for( var i =0 ; i< tabModels.length ; i++ ) {
        oldValidatedValues.push(tabModels[i].get('validated') )
        tabModels[i].set({validated : 4 },{silent:true});
      }
      $.ajax({
        type: 'PUT',
        url: config.coreUrl + 'sensorDatas/camtrap/'+this.equipmentId+'/updateMany',
        contentType: 'application/json',
        data: JSON.stringify(tabModels)
      })
      .done(function (resp) {
        for( var i =0 ; i< tabModels.length ; i++ ) {
          tabModels[i].trigger("custom:refreshUI");
        }
        _this.refreshCounter();
        
      })
      .fail(function (err) {
        for( var i =0 ; i< tabModels.length ; i++ ) {
          tabModels[i].set({validated : oldValidatedValues[i] },{silent:true,refreshUI : true});
        }
        _this.refreshCounter();
      })
    },

    editStation: function (event) {
      if( event.currentTarget.className.indexOf('disabled') > -1 ) {
        return;
      }
      var stationId, title, text;
      var tabModels = this.currentCollection.where({activeFront : true });
      if (tabModels.length == 1) {
          stationId = tabModels[0].get('stationId')
          if (stationId) {
            window.open('./#stations/' + stationId + '');
          } else {
            title = 'No Station for this photo !';
            text = 'Please select a photo with station attached';
          }
      } else {
        title: 'You can\'t edit multi stations in the same time';
        text = 'Please select only ONE photo'
      }
      if (!stationId) {
        Swal({
          heightAuto: false,
          title: title,
          // text: +_this.nbPhotosChecked + ' photos still underteminate and ' + (_this.nbPhotos - (_this.nbPhotosChecked + _this.nbPhotosAccepted + _this.nbPhotosRefused)) + ' not seen yet\n',
          html: text,
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: 'rgb(218, 146, 15)',
          confirmButtonText: 'Ok',
          closeOnConfirm: false,
        });
      }
    },

    createStation: function (event) {
      if( event.currentTarget.className.indexOf('disabled') > -1 ) {
        return;
      }
      var _this = this;
      var tabModelsActiveWithoutStation = this.currentCollection.filter(function (model) {
        return (model.get('stationId') == null && model.get('activeFront'));
      });

      //TODO will fail if same position , same name
      if( tabModelsActiveWithoutStation.length == 1 ) {
        var data = this.populateDataForCreatingStation(tabModelsActiveWithoutStation[0]);
        this.callPostStationAPI(tabModelsActiveWithoutStation[0], data);
      }
      if (tabModelsActiveWithoutStation.length > 1 ) {
        var allData = []
        for (var i = 0; i < tabModelsActiveWithoutStation.length; i++) {
          var data = this.populateDataForCreatingStation(tabModelsActiveWithoutStation[i]);
          allData.push(data)
        }
        this.callPostAllStationsAPI(tabModelsActiveWithoutStation,allData)
      }

    },
    callPostStationAPI: function (elem, data) {
      var _this = this;
      $.ajax({
          type: 'POST',
          url: config.coreUrl + 'stations/insertWithCamTrap',
          data: JSON.stringify(data),
          contentType: 'application/json',
          dataType: 'json'
        })
        .done(function (resp) {
          elem.set({'stationId': resp.ID, 'validated' : 2 },{silent:true , refreshUI : true })
          _this.refreshCounter();
        })
        .fail(function (err) {
           console.log(err)
          // throw new Error("error create station");
        });

    },


    populateDataForCreatingStation: function (imageModel) {
      var monitoredSiteModel = this.monitoredSiteForm.model;
      var data = {};
      data.LAT = monitoredSiteModel.get('LAT');
      data.LON = monitoredSiteModel.get('LON');
      data.FK_MonitoredSite = this.siteId;
      data.Name = imageModel.get('name'); //"izhjfoiuzehoezfhn";
      data.FieldWorkers = [{
        ID: null,
        defaultValues: "",
        FieldWorker: "" + window.app.user.get('PK_id') + ""
      }];
      data.FK_StationType = 6;
      data.StationDate = moment(imageModel.get('date_creation')).format('DD/MM/YYYY HH:mm:ss');
      for (var item in data) { // check for required val
        var val = data[item]
        if (typeof (val) === 'undefined' || val === null) {
          if (item === 'stationDate')
            throw new Error("The photo have no value for " + item);
          else
            throw new Error("Monitored site have no value for " + item);
          break;
        }
      }
      data.ELE = monitoredSiteModel.get('ELE') || null;
      data.precision = monitoredSiteModel.get('precision') || null;
      data.Comments = "created from camera trap validation" || null;
      data.NbFieldWorker = 1;
      data.creator = window.app.user.get('PK_id');
      data.fieldActivityId = 39 // Id from BDD for fieldactivity : camera trapping
      data.camtrapId = imageModel.get('id');
      return data;
    },

    callPostAllStationsAPI: function(tabElem,tabData) {

      var _this = this;
      $.ajax({
        type: 'POST',
        url: config.coreUrl + 'stations/insertAllWithCamTrap',
        data: JSON.stringify(tabData),
        contentType: 'application/json',
        dataType: 'json'
      })
      .done(function (resp, textStatus, jqXHR ) {
        var keyVal;
        var value;
        var tabModelNotUpdated = [];
        for( var i = 0 ; i < resp.length ; i++ ) {
          keyVal = Object.keys(resp[i])[0]
          value = resp[i][keyVal]
         for(var j = 0 ; j < tabElem.length ; j++){
          if (tabElem[j].attributes.id == keyVal) {
            if( Number(value) ) {
              tabElem[j].set({stationId :  value , validated : 2},{silent:true,refreshUI : true})
            }
            else {
              tabModelNotUpdated.push({model : tabElem[j], message :value})
            }
            break;
          }
         }
        }
        if( jqXHR.status == 202) {
          var text = []
          for( var i = 0 ; i < tabModelNotUpdated.length ; i++ ) {
            var model = tabModelNotUpdated[i].model;
            var message = tabModelNotUpdated[i].message;
            var indexInGallery = model.collection.indexOf(model) + 1;
            text.push("photo N°"+String(indexInGallery)+" : "+message);
          }
          //swal
          Swal({
            heightAuto: false,
            title: 'Data Conflicts',
            html: text.join("<BR>"),
            type: 'error',
            confirmButtonColor: 'rgb(218, 146, 15)',
            confirmButtonText: 'Ok',
            closeOnConfirm: true,
            closeOnCancel: true
          });
        }
          _this.refreshCounter();      
      })
      .fail(function (err) {
        console.log(err)
        // throw new Error("error create station");
      });

    },

    removeStation: function (event) {
      
      if( event.currentTarget.className.indexOf('disabled') > -1 ) {
        return;
      }
      var tabModelsWithStation = this.currentCollection.filter(function (model) {
        return (model.get('stationId') !== null && model.get('activeFront'));
      });

      if (tabModelsWithStation.length === 0) {
        Swal({
          heightAuto: false,
          title: 'Error',
          html: 'No stations to remove',
          type: 'error',
          confirmButtonColor: 'rgb(218, 146, 15)',
          confirmButtonText: 'Ok',
          closeOnConfirm: true,
          closeOnCancel: true
        });
        return;
      }
      this.callDeleteStationAPI(tabModelsWithStation);
    },

    callDeleteStationAPI: function (tabModelsWithStation) {
      if (tabModelsWithStation.length >= 1) {
        var _this = this;
        $.ajax({
            type: 'POST',
            url: config.coreUrl + 'stations/deleteStationWithCamTrap',
            contentType: 'application/json',
            data : JSON.stringify(tabModelsWithStation)
          })
          .done(function (resp) {
            var keyVal;
            for( var i = 0 ; i < resp.length ; i++ ) {
              keyVal = Object.keys(resp[i])[0]
             for(var j = 0 ; j < tabModelsWithStation.length ; j++){
              if (tabModelsWithStation[j].attributes.id == keyVal ){
                tabModelsWithStation[j].set({stationId : null},{silent:true,refreshUI : true})
                break;
              }
             }
            }
          })
          .fail(function (err) {
            // console.log(err);
          });
      }
    },

    nextPage: function (e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (this.currentCollection.hasNextPage()) {
        this.currentCollection.getNextPage();
      }
    },

    prevPage: function (e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (this.currentCollection.hasPreviousPage()) {
        this.currentCollection.getPreviousPage();
      }
    },

    firstPage: function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.tabView[this.currentPosition].model.set({activeFront : false})
      this.currentCollection.getFirstPage();
    },

    lastPage: function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.tabView[this.currentPosition].model.set({activeFront : false})
      this.currentCollection.getLastPage();
    },

   
    // undeterminatePhoto: function (e) {
    //   if (this.tabSelected.length == 0) {
    //     if (this.currentPosition !== null) {
    //       this.tabView[this.currentPosition].setModelValidated(1);
    //     }
    //   } else {
    //     for (var i of this.tabSelected) {
    //       this.tabView[i].setModelValidated(1);
    //     }
    //   }
    // },

    toggleModelStatus: function (e) {
      e.preventDefault();
      if (this.tabSelected.length == 0) {
        if (this.currentPosition !== null) {
          this.tabView[this.currentPosition].toggleModelStatus();
        }
      } else {
        for (var i of this.tabSelected) {
          this.tabView[i].toggleModelStatus();
        }
      }
    },

    leaveModal: function (e) {
      if (this.stopSpace) {
        this.stopSpace = false;
        $('#rgToolsBarTop .reneco-ECOL-ecollectionsmall').addClass('active');
        $('#rgToolsBarTop .reneco-image_file').removeClass('active');
        if (this.rgFullScreen.currentView !== undefined) {
          this.rgFullScreen.$el.removeClass("crop2 crop-paginator");
          this.ui.gallery.show();
          this.rgFullScreen.currentView.hide();
          this.rgFullScreen.el.style.display = 'none';
        }
      }
    },

    displayModal: function (e) {
      e.preventDefault();
      var tabModel = this.currentCollection.where({activeFront : true})
      if( tabModel.length > 1 ) {
        Swal({
          heightAuto: false,
          title: 'Warning',
          html: 'You can only display one photo at a time ',
          type: 'info',
          confirmButtonColor: 'rgb(218, 146, 15)',
          confirmButtonText: 'Ok',
          closeOnConfirm: true,
          closeOnCancel: true
        });
        return;
      }

      if (this.currentPosition !== null && !this.stopSpace) { //il faut une position pour afficher le modal
        /*activate icon*/
        this.stopSpace = true;
        $('#rgToolsBarTop .reneco-ECOL-ecollectionsmall').removeClass('active');
        $('#rgToolsBarTop .reneco-image_file').addClass('active');
        this.ui.gallery.hide();

        if (this.rgFullScreen.currentView === undefined) {
          this.rgFullScreen.show(new ModalView({
            model: this.tabView[this.currentPosition].model,
            parent: this
          }));
          this.rgFullScreen.el.style.display = 'block';
          this.rgFullScreen.$el.addClass("crop2 crop-paginator");
          this.rgFullScreen.$el.show();
        } else {
          if (!this.rgFullScreen.$el.hasClass("crop2")) {
            this.rgFullScreen.$el.addClass("crop2 crop-paginator");
          }
          this.rgFullScreen.currentView.changeModel(this.tabView[this.currentPosition].model);
          this.rgFullScreen.el.style.display = 'block';
          this.rgFullScreen.$el.show();
        }
      }
    },

    mouvement: function (e) {
      /** this.stopSpace handle up and down for the fullscreen **/
      var lastPosition = this.currentPosition;
      var newPosition = this.currentPosition;
      
        switch (e.keyCode) {
          case 38:
            { // up
              if (this.currentPosition - 6 >= 0 && !this.stopSpace) {
                newPosition -= 6
              }
              break;
            }
          case 40:
            { //down
              if (this.currentPosition + 6 <= this.tabView.length - 1 && !this.stopSpace) {
                newPosition +=6;
              }
              break;
            }
          case 37:
            { //left
              if (this.currentPosition - 1 >= 0) {
                newPosition -= 1;
               
              } else {
                this.prevPage();
                return;
              }
              break;
            }
            //right
          case 39:
            { //right
              if (this.currentPosition + 1 <= this.tabView.length - 1) {
                newPosition += 1;
              } else {
                this.nextPage();
                return;
              }
              break;
            }
        }

        if (lastPosition !== newPosition) { // si on a bougé
          // this.tabView[lastPosition].model.set({activeFront : false});
          var tabModelsActivate = this.currentCollection.where({activeFront : true });
          for( var i =0 ; i < tabModelsActivate.length ; i ++ ) {
            tabModelsActivate[i].set({activeFront: false })
          }
          this.currentPosition = newPosition;
          this.tabView[this.currentPosition].model.set({activeFront : true});

          if (this.rgImageDetails.currentView != undefined) {
            this.rgImageDetails.currentView.changeDetails(this.tabView[this.currentPosition].model)
          }

          if (this.rgFullScreen.currentView !== undefined && this.stopSpace) {
            this.rgFullScreen.currentView.changeModel(this.tabView[this.currentPosition].model);
          }

        }
    },

    rightMouvement: function () {
      var simE = {
        keyCode: 39
      };
      this.mouvement(simE);
    },

    leftMouvement: function () {
      var simE = {
        keyCode: 37
      };
      this.mouvement(simE);
    },

    findTags: function (e) {
      e.preventDefault(); // disable browser tab
      e.stopPropagation()
      console.log("click on tab detected")

      if( this.toolsBar.$elemTags.data('select2').isOpen() ){
        this.toolsBar.$elemTags.select2('close');
      }
      else {
        this.toolsBar.$elemTags.select2('open');
      }
      
    },

    prevImage: function () {
      var index = this.myImageCollection.indexOf(this.currentViewImg.model); // index 0 a n-1
      if (index - 1 < 0) {
        this.currentViewImg = this.tabView[0];
      } else {
        this.currentViewImg = this.tabView[index - 1]; // on se deplace de - 1
      }
      this.rgFullScreen.currentView.changeModel(this.currentViewImg.model);
      this.rgImageDetails.changeDetails(this.currentViewImg.model)

    },

    nextImage: function () {
      var index = this.myImageCollection.indexOf(this.currentViewImg.model);
      if (index >= this.tabView.length - 1) {
        this.currentViewImg = this.tabView[this.tabView.length - 1];
      } else {
        this.currentViewImg = this.tabView[index + 1];
      }
      this.rgFullScreen.currentView.changeModel(this.currentViewImg.model);
      this.rgImageDetails.changeDetails(this.currentViewImg.model)

    },

    displayAll: function (e) {
      this.currentCollection = this.myImageCollection;
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollection);
      this.displayPaginator(this.paginator);

    },



    filterCollectionCtrl: function (e) {

      var $elem = $(e.currentTarget);
      $elem[0].getElementsByTagName('input')[0].checked = true
      var myFilter = {};
      if ($('#rgToolsBarTop .reneco-image_file').hasClass('active')) {
        this.leaveModal();
      }
      var parent$elem = e.currentTarget.parentElement
      // var allSpan = parent$elem.getElementsByTagName('span')
      var allSelected = parent$elem.getElementsByClassName('selected') //.getElementsByTagName('span')
      for (var i = 0; i < allSelected.length; i++) {
        if (allSelected[i].className.split(' ').indexOf('selected') > -1) {
          allSelected[i].className = allSelected[i].className.replace('selected', '')
        }
      }

      if ($elem.hasClass('accepted')) {
        myFilter.validated = 2;
      } else if ($elem.hasClass('refused')) {
        myFilter.validated = 4;
      } else if ($elem.hasClass('checked')) {
        myFilter.validated = 1;
      } else if ($elem.hasClass('stationed')) {
        myFilter = function (model) {
          return (model.get('stationId') != null && model.get('validated') === 2);
        }
      } else if ($elem.hasClass('notChecked')) {
        // myFilter.validated = null;
        myFilter = function (model) {
          return (model.get('validated') !== 4 && model.get('validated') !== 2);
        }
      } else if ($elem.hasClass('allphotos')) {
        //remet la collection mere
        this.displayImages(this.myImageCollection);
        this.ui.paginator.html('');
        this.displayPaginator(this.paginator);
        this.ui.paginator.find('.backgrid-paginator').css('visibility', 'visible');

      }
      $elem.addClass('selected');
      if (!$elem.hasClass('allphotos')) {
        this.initCollectionFiltered(myFilter);
      }

    },

    initCollectionFiltered: function (filter) {
      var _this = this;

      this.filterModelFiltered = new virtualcollection(
        this.myImageCollection.fullCollection, {
          filter
        }
      );
      this.displayFiltered();
    },

    displayFiltered: function (e) {
      var _this = this;

      var paginationFiltered = PageColl.extend({
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl + 'sensorDatas/' + this.type + '/' + this.equipmentId + '/datas/',
        queryParams: {
          totalPages: null,
          totalRecords: null,
        },
        parseState: function (resp, queryParams, state, options) {
          return {
            totalRecords: resp.total_entries
          };
        },
        getNextPage : function(options){
          if (this.hasNextPage()) {
            _this.pageChange = 'N';
          }
          return PageColl.prototype.getNextPage.call(this,options);
        },
        getPreviousPage : function(options){
          if (this.hasPreviousPage()) {
            _this.pageChange = 'P';
          }
            return PageColl.prototype.getPreviousPage.call(this,options);
        },
        getPage : function (index,options) {
          var tabModels = this.fullCollection.where({activeFront : true});
          for( var i = 0 ; i < tabModels.length ; i ++ ) {
            tabModels[i].set({'activeFront' : false})
          }
          return PageColl.prototype.getPage.call(this,index,options);
        }
      });

      this.myImageCollectionFiltered = new paginationFiltered(this.filterModelFiltered.models)
      this.myPaginationFiltered = new Backgrid.Extension.Paginator({
        collection: this.myImageCollectionFiltered
      });
      this.listenTo(this.myImageCollectionFiltered, "reset", function (e) {
        _this.displayImages(_this.myImageCollectionFiltered);
      });

      this.displayImages(this.myImageCollectionFiltered);
      this.ui.paginator.html('');
      this.displayPaginator(this.myPaginationFiltered);

    },

    roundDate: function (date, duration) {
      return moment(Math.floor((+date) / (+duration)) * (+duration));
    },
    displaySwalUnchecked: function (compteur) {
      var _this = this;
      Swal({
        heightAuto: false,
        title: 'You can\'t validate this sessions',
        // text: +_this.nbPhotosChecked + ' photos still underteminate and ' + (_this.nbPhotos - (_this.nbPhotosChecked + _this.nbPhotosAccepted + _this.nbPhotosRefused)) + ' not seen yet\n',
        html: +_this.nbPhotosNotChecked + ' photos still underteminate',
        type: 'error',
        showCancelButton: false,
        confirmButtonColor: 'rgb(218, 146, 15)',

        confirmButtonText: 'Ok',
        closeOnConfirm: false,
      });
    },

    displaySwalValidate: function () {
      var _this = this;
      var text = "";
      if (_this.nbPhotosAccepted == 0) {
        text += _this.nbPhotosRefused + ' picture(s) will be refused<BR>';
      } else if (_this.nbPhotosRefused == 0) {
        text += _this.nbPhotosAccepted + ' picture(s) will be accepted<BR>';
      } else {
        text += _this.nbPhotosAccepted + ' pictrure(s) will be accepted<BR>' + _this.nbPhotosRefused + ' picture(s) will be refused<BR>';
      }
      if( _this.nbPhotosStationed == 1) {
          text +=  _this.nbPhotosStationed+' station will be created <BR>'
      }

      if( _this.nbPhotosStationed > 1 ) {
         text +=  _this.nbPhotosStationed+' stations will be created<BR>'
        }

      Swal({
          heightAuto: false,
          title: 'Validation',
          html: 'You have finish this session on ' + _this.nbPhotos + ' photos :<BR>' + text,
          type: 'success',
          showCancelButton: true,
          confirmButtonColor: '#5cb85c',
          cancelButtonColor:'red',
          confirmButtonText: 'Ok !',
          cancelButtonText: 'Back !',
          closeOnConfirm: true,
          closeOnCancel: true
        }).then( (result) => {

          if( 'value' in result) {
            
            $.ajax({
              url: config.coreUrl + 'sensorDatas/' + _this.type + '/validate',
              method: 'POST',
              data: {
                fk_Sensor: _this.sensorId,
                fk_MonitoredSite: _this.siteId,
                fk_EquipmentId: _this.equipmentId
              },
              context: _this,
            })
            .done(function (response, status, jqXHR) {
                //todo handle stored procedre return
              var newText = '';
              newText += response.nbValidated + ' photos validated <BR>'
              newText += response.nbRefused  + ' photos refused <BR>'
              newText += response.nbStationsCreated + ' stations created <BR>'

              Swal({
                heightAuto: false,
                title: 'Session validated',
                html: 'On ' + _this.nbPhotos + ' photos <BR>' + newText,
                type: 'success',
                showCancelButton: true,
                confirmButtonColor: 'rgb(218, 146, 15)',

                confirmButtonText: 'Go to monitored sites',
                cancelButtonText: 'Return to validation',
                closeOnConfirm: true,
                closeOnCancel: true
              }).then( (result) => {
                if( 'value' in result) {
                  Backbone.history.navigate('monitoredSites/' + _this.siteId, {
                    trigger: true
                  });
                }
                if( 'dismiss' in result) {
                  Backbone.history.navigate('validate/camtrap');
                  window.location.reload();
                }
              });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
              Swal({
                heightAuto: false,
                title: 'Error',
                html: 'Error while validating picture(s).<BR>Please contact your administrator<BR>',
                type: 'error',
                // showCancelButton: true,
                confirmButtonColor: '#5cb85c',
                confirmButtonText: 'Ok!',
                // cancelButtonText: 'Return to validation',
                closeOnConfirm: true,
                closeOnCancel: true,
              });

            });
          //TODO mettre le status validated a 8 pour sauvegarder la validation de force



            
          }

        });
        
        
        /*
        ,
        function (isConfirm) {
          if (isConfirm) {
            $.ajax({
                url: config.coreUrl + 'sensorDatas/' + _this.type + '/validate',
                method: 'POST',
                data: {
                  fk_Sensor: _this.sensorId,
                  fk_MonitoredSite: _this.siteId,
                  fk_EquipmentId: _this.equipmentId
                },
                context: _this,
              })
              .done(function (response, status, jqXHR) {
                  //todo handle stored procedre return
                var newText = '';
                newText += _this.nbPhotosAccepted + ' photos validated <BR>'
                newText += _this.nbPhotosRefused + ' photos refused <BR>'
                newText += _this.nbPhotosStationed + ' stations created <BR>'

                Swal({
                  title: 'Session validated',
                  text: 'On ' + _this.nbPhotos + ' photos <BR>' + text,
                  type: 'success',
                  showCancelButton: true,
                  confirmButtonColor: 'rgb(218, 146, 15)',

                  confirmButtonText: 'Go to monitored sites',
                  cancelButtonText: 'Return to validation',
                  closeOnConfirm: true,
                  closeOnCancel: true,
                  html : true

                }, function () {
                  if (isConfirm) {
                    Backbone.history.navigate('monitoredSites/' + _this.siteId, {
                      trigger: true
                    });
                  } else {
                    Backbone.history.navigate('validate/camtrap');
                    window.location.reload();
                  }

                })
              })
              .fail(function (jqXHR, textStatus, errorThrown) {
                Swal({
                  title: 'Error',
                  text: 'Something goes wrong<BR>Please contact an admin<BR>',
                  type: 'error',
                  // showCancelButton: true,
                  confirmButtonColor: '#5cb85c',
                  confirmButtonText: 'Ok!',
                  // cancelButtonText: 'Return to validation',
                  closeOnConfirm: true,
                  closeOnCancel: true,
                  html : true
                });

              });
            //TODO mettre le status validated a 8 pour sauvegarder la validation de force
          }
          else {
            return;
          }

        }
      );

      */
    },


    validateAll: function () {
      $(".fullscreenimg [id^='zoom_']").trigger('wheelzoom.reset');

      if (this.nbPhotosNotChecked > 0) {
        // this.displaySwalUnchecked();
        return;
      }
      // else {
        this.displaySwalValidate();
     // }
    },

  });
});

