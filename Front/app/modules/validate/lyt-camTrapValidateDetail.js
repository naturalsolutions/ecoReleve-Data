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
  'backgrid.paginator'
], function ($, _, Backbone, Marionette, Swal, Translater,
  config, NsMap, NsForm, moment, Navbar, PageColl,
  CamTrapItemView, CamTrapImageModel, ToolsBar, ModalView, BckMrtKeyShortCut,
  virtualcollection, ToolsBarTop, jqueryUi, imageDetailsView, Exif) {

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
      // '+': 'addStars',
      // '-': 'decreaseStars',
      'space': 'displayModal',
      // 'backspace': 'undeterminatePhoto',
      'enter': function(){ $('i#acceptedBtn').click(); },//'simulateAcceptPhoto',
      'del': function(){$('i#refusedBtn').click();},//'simulateRejectPhoto',
      'esc': 'leaveModal',
      'pagedown': 'nextPage',
      'pageup': 'prevPage',
      'home': 'firstPage',
      'end': 'lastPage',
      // '1': 'setStars',
      // '2': 'setStars',
      // '3': 'setStars',
      // '4': 'setStars',
      // '5': 'setStars'

    },

    events: {
      'click i#refusedBtn': 'rejectPhoto',
      'click i#acceptedBtn': 'acceptPhoto',
      'click i#checkedBtn': 'undeterminatePhoto',
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
      'imageFullScreen': '#imageFullScreen'
      
    },
    
    regions: {
      'rgNavbar': '.js-rg-navbar',
      'rgGallery': '#gallery',
      'rgFullScreen': '#imageFullScreen',
      'rgToolsBar': '#rgToolsBar',
      'rgToolsBarTop': '#rgToolsBarTop',
      'rgImageDetails': '#imageDetails',
    },
    /*
    TODO refact: change selection by a backbone.collection 
    */

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
      var _this = this;
      var indexFind = this.findIndexOfElemImg( e.currentTarget )
      var newTab = [];
      if( e.ctrlKey ) { //ctrl + click add/remove item selected
        var oldTab = this.model.get('newSelected');
        var detected = -1;
        newTab = _.clone(oldTab); //hack to handle change not fired 

        for( var i = 0 ; i < oldTab.length ; i++) {
          if( indexFind == oldTab[i] ) {
            detected = i;
          }
        }
       
        if( detected  > -1 ) { //remove item selected
          if( oldTab.length === 1 ) {
            return;
          }
          else {
           newTab.splice(detected,1);
          }
        }
        else { // add item selected
          newTab.push(indexFind);
        }
      }
      else { // click => focus if new img
        if ( typeof(indexFind) !== 'undefined') {
          newTab = [indexFind]
          // this.model.set('newSelected',[indexFind]);
        }
      }
      _this.model.set('newSelected', newTab);
 

    },

    setoldSelectedInactive: function(tab) {
      console.log("on va mettre a inactif", tab)
      if( !tab )
        return;
      var index;
      for( var i = 0 ; i < tab.length ; i++) {
        index = tab[i];
        if( index < this.tabView.length ) {
          this.tabView[index].removeActive();
        }
      }

    },

    setAllSelectedActive: function(tab) {
      console.log("on va mettre a active " , tab)
      if( !tab )
       return;
      var index;  
      for( var i = 0 ; i < tab.length ; i++) {
        index = tab[i];
        if( index < this.tabView.length ) {
          this.tabView[index].setActive();
        }
      }
    },

    
    initialize: function (options) {
      var _this = this;
      this.equipmentId = parseInt(this.checkUrl(location.hash));

      if (this.equipLine < 0) {
        console.log("lol pas de session");
        return
      }

      this.translater = Translater.getTranslater();
      this.type = options.type;
      this.model = options.model || new Backbone.Model();
      this.lastImageActive = null;
      this.currentViewImg = null;
      this.currentPosition = null;
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

      this.globalGrid = options.globalGrid;


      this.newSelected = [];
      this.listenTo(this.model, 'change', function (e) { 
        // trigger on init or on change page
        // trigger when selection change so we update ui here

        if( !e ) {
          return;
        }

        var newTab = e.attributes.newSelected;
        var oldTab = e._previousAttributes.newSelected;

        if ( newTab.length === 1 ) {
          _this.currentPosition = newTab[0];
        }

        var diff = _.difference(oldTab,newTab);

        _this.setoldSelectedInactive(oldTab);
        _this.setAllSelectedActive(newTab);
        
        

        _this.updateUIWhenSelectionChange();

        /*update control ui here */

        // if( tabSelected.length == 1) {
        //   //updateui
        // }
        // if(tabSelected.length > 1 ) {
        //   console.log("change from multi select ")
        //   console.log(this.model.get('newSelected'))
        // }
      });

      this.fetchSessionInfos();
      this.initCollection();
      // this.model.set('newSelected',[1,2,12]);
    },
    updateUIWhenSelectionChange : function() {
      var _this = this;
      var tabSelected = this.model.get('newSelected');
      if( !tabSelected ) {
        console.log("désactive tout");
        
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
        if (collection.length == 1 ) {
          _this.toolsBar.displaySingleSelect()
        }
        if( collection.length > 1 ) {
          _this.toolsBar.displayMultiselect()
        }
        
      })


      // if( tabSelected.length == 1 ) {
      //   console.log("control pour une photo")
      // }
      // if ( tabSelected.length > 1) {
      //   console.log("multicontrol (le plus simple)")
      // }

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
          console.log("pas bon");
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
        patch: function () {}
      });

      this.myImageCollection = new ImageCollection();
      this.myImageCollection.sync('patch', this.myImageCollection, {
        error: function () {
          console.log(this.myImageCollection);
          console.log("sync impossible");
        }
      });

      this.paginator = new Backgrid.Extension.Paginator({
        collection: this.myImageCollection
      });

      this.myImageCollection.on('sync', function () {
        _this.refreshCounter();
      });

      this.myImageCollection.fetch();

      this.paginator.collection.on('reset', function (e) {
        console.log("reset du paginator");
      });

    },

    refreshCounter: function () {
      this.nbPhotos = this.myImageCollection.fullCollection.length;
      this.nbPhotosAccepted = this.myImageCollection.fullCollection.where({
        validated: 2
      }).length;
      this.nbPhotosRefused = this.myImageCollection.fullCollection.where({
        validated: 4
      }).length;
      this.nbPhotosNotChecked = this.myImageCollection.fullCollection.where({
        validated: null
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
      this.currentCollection = myCollectionToDisplay;
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
        if (this.currentPosition == newPosition ) {
          this.model.trigger('change', this.model, [newPosition]);
          // this.model.set('newSelected' , [newPosition]);
          // this.model.trigger("change:{newSelected}");
        }
        else {
          this.model.set('newSelected' , [newPosition]);
        }

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
            console.log("start selection")
            var tabSelected = $('#gallery .ui-selected');
            tabOldUiSelected = []
            for ( var i = 0 ; i < tabSelected.length ; i++) {
              tabOldUiSelected.push(tabSelected[i]);
              // if (tabSelected[i].className.indexOf('ui-selected') > -1 ) {
              //   tabSelected[i].className += ' ui-oldSelected';
              // }
            }

           // console.log("tab on start",this.tabOldUiSelected);
            
            
            // if (_this.tabView[_this.currentPosition].$el.find('.vignette').hasClass('active')) {
            //   _this.tabView[_this.current]
            //   _this.tabView[_this.currentPosition].$el.find('.vignette').removeClass('active');
            // }

            // if (typeof _this.tabSelected != "undefined" && _this.tabSelected.length > 0) {
            //   for (var i of _this.tabSelected) {
            //     if (_this.currentPosition != i) {
            //       if (_this.tabView[i].$el.find('.vignette').hasClass('active')) {
            //         _this.tabView[i].$el.find('.vignette').removeClass('active');
            //       }
            //     }
            //   }
            // }
          },

          selected: function (e, ui) { // for one elem
            var elem = ui.selected;
            tabNewSelected.push(elem)
          },

          unselected: function (e, ui) { //for one elem
            var elem = ui.unselected;
          },

          stop: function (e) { //for all elem
              if( e.ctrlKey ) {
                for ( var i = 0 ; i < tabNewSelected.length ; i++ ) {
                  for (var j = 0 ; j < tabOldUiSelected.length ; j++ ) {
                    if(tabNewSelected[i] === tabOldUiSelected[j] ) {
                      tabNewSelected[i].className = tabNewSelected[i].className.replace(' ui-selected','')
                      break;
                    }
                    else {
                      //find index
                      console.log("on test")
                    }
                  }
    
                }
              }
              tabOldUiSelected = [];
              tabNewSelected = [];

              // from here we have all selected 
              var indexItemSelected = []
              $(".ui-selected", this).each(function () {
                var index = $(".imageCamTrap").index(this);
                indexItemSelected.push(index);
              });
              _this.model.set('newSelected',indexItemSelected);// change selected item

            console.log("stop selection ")
            // this.tabOldUiSelected = [];
            // this.tabNewSelected = [];
            // this.tabNewUnSelected = [];

            // $('#gallery .tmp-selected').addClass('already-selected').removeClass('tmp-selected').addClass('ui-selected');
            // $('#gallery .tmp-selectedctrl').addClass('already-selected').removeClass('tmp-selectedctrl').addClass('ui-selected');

            // var result = "";
            // _this.tabSelected = [];

            // var tmpSelected = [];

            // $(".ui-selected", this).each(function () {
            //   var index = $(".imageCamTrap").index(this);
            //   _this.tabSelected.push(index);
            //   tmpSelected.push(index);
            //   // if (!(_this.tabView[index].$el.find('.vignette').hasClass('active'))) {
            //   //   _this.tabView[index].$el.find('.vignette').toggleClass('active');
            //   // }
            // });
            // _this.model.set('newSelected',tmpSelected);

            // console.log("test tags");
            // var nbPhotos = _this.tabSelected.length
            // var nbphotosValidated = 0;
            // if (nbPhotos > 0) {
            //   var tagsInAllPhotos = []
            //   var stringTagTmp ='';
            //   var uniqTagsAndOccurence = []
            //   for( var i = 0 ; i < nbPhotos ; i++) {
            //     if(_this.tabView[_this.tabSelected[i]].model.get('validated') === 2 ) {
            //       nbphotosValidated += 1;
            //     }
            //     stringTagTmp += _this.tabView[_this.tabSelected[i]].model.get('tags');
            //     if( i+1 < nbPhotos) {
            //       stringTagTmp += ',';
            //     }
            //   }
            //   var allTagsTab = stringTagTmp.split(',');
            //   uniqTagsAndOccurence = _.countBy(allTagsTab);
            //   for( var item in uniqTagsAndOccurence) {
            //     if(uniqTagsAndOccurence[item] === nbphotosValidated) {
            //       tagsInAllPhotos.push(item);
            //     }
            //   }
            //   console.log("bim");
            //   _this.toolsBar.render();
            //   _this.toolsBar.$elemTags.val(null).trigger('change');
            //   _this.toolsBar.$elemTags.val(tagsInAllPhotos).trigger('change');
            // }
            
           
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
              console.log("all tags in selection : ",allTagsTabs);
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
				data : '{"StartNodeID": "167222", "lng": "en", "IsDeprecated": "false"}'
        });

      $.when(_this.dataTags)
      .then(function(resp) {
        resp.children.push({ title:"Standard quality",value : "Standard quality", children: []})
        resp.children.push({ title:"Poor quality", value:"Poor quality", children: []})
        if(!_this.jsonParsed) {
          _this.jsonParsed = _this.parseJsonRecur(resp);
        }
        // _this.jsonParsed.push({})
        _this.toolsBar = new ToolsBar({
          parent: _this,
          model : null,
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



    populateDataForCreatingStation: function (imageModel) {
      var monitoredSiteModel = this.monitoredSiteForm.model;
      var data = {};
      data.LAT = monitoredSiteModel.get('LAT');
      data.LON = monitoredSiteModel.get('LON');
      data.FK_MonitoredSite = this.siteId;
      data.Name = imageModel.model.get('name'); //"izhjfoiuzehoezfhn";
      data.FieldWorkers = [{
        ID: null,
        defaultValues: "",
        FieldWorker: "" + window.app.user.get('PK_id') + ""
      }];
      data.FK_StationType = 6;
      data.StationDate = moment(imageModel.model.get('date_creation')).format('DD/MM/YYYY HH:mm:ss');
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
      return data;
    },

    callDeleteStationAPI: function (tabOfIds, tabOfItem) {
      if (tabOfIds.length === 1) {
        var stationId = tabOfIds[0];
        var item = tabOfItem[0];
        var _this = this;
        if (stationId === null)
          return;

        $.ajax({
            type: 'DELETE',
            url: config.coreUrl + 'stations/' + stationId,
            contentType: 'application/json'
          })
          .done(function (resp) {
            item.removeStation();
            console.log("Station" + stationId + " removed ok");
          })
          .fail(function (err) {
            console.log(err);
          });
      } else {

        $.ajax({
            type: 'POST',
            url: config.coreUrl + 'stations/deleteMany',
            contentType: 'application/json',
            data: JSON.stringify(tabOfIds)
          })
          .done(function (resp) {
            console.log(resp);
            for (var item in resp) {
              var indexElem = tabOfIds.findIndex(function (elem) {
                return Number(item) === elem;
              });
              tabOfItem[indexElem].removeStation();
            }
          })
          .fail(function (err) {
            console.log(err);
          })

      }


    },

    editStation: function (event) {
      if( event.currentTarget.className.indexOf('disabled') > -1 ) {
        return;
      }
      var stationId, title, text;
      if (this.tabSelected.length == 0) {
        if (this.currentPosition !== null) {
          stationId = this.tabView[this.currentPosition].model.get('stationId')
          if (stationId) {
            window.open('./#stations/' + stationId + '');
          } else {
            title = 'No Station for this photo !';
            text = 'Please select a photo with station attached';
          }
        }
      } else {
        title: 'You can\'t edit multi stations in the same time';
        text = 'Please select only ONE photo'
      }
      if (!stationId) {
        Swal({
          title: title,
          // text: +_this.nbPhotosChecked + ' photos still underteminate and ' + (_this.nbPhotos - (_this.nbPhotosChecked + _this.nbPhotosAccepted + _this.nbPhotosRefused)) + ' not seen yet\n',
          text: text,
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: 'rgb(218, 146, 15)',
          confirmButtonText: 'Ok',
          closeOnConfirm: false,
        });
      }
    },

    removeStation: function (event) {
      
      var tabSelected = this.model.get('newSelected') || [];

      var tabOfIds = [];
      var tabOfItem = [];

      for ( var i = 0 ; i < tabSelected.length ; i++ ){
        var index = tabSelected[i];
        if (this.tabView[index].model.get('stationId') !== null) {
          tabOfIds.push(this.tabView[index].model.get('stationId'));
          tabOfItem.push(this.tabView[index]);
        }
      }
      if (tabOfIds.length === 0 || tabOfItem.length === 0) {
        Swal({
          title: 'Error',
          text: 'No stations to remove',
          type: 'error',
          confirmButtonColor: 'rgb(218, 146, 15)',
          confirmButtonText: 'Ok',
          closeOnConfirm: true,
          closeOnCancel: true
        });
        return;
      }
      this.callDeleteStationAPI(tabOfIds, tabOfItem);
      this.refreshCounter();
      this.updateUIWhenSelectionChange()
    },

    callPostAllStationsAPI: function(tabElem,tabData) {

      var _this = this;
      $.ajax({
        type: 'POST',
        url: config.coreUrl + 'stations/insertAll',
        data: JSON.stringify(tabData),
        contentType: 'application/json',
        dataType: 'json'
      })
      .done(function (resp) {
        var namePhoto,model;
        var tabModel = new Backbone.Collection();
        for( var i = 0 ; i < resp.length ; i++ ) {
          namePhoto = Object.keys(resp[i])[0];
          model = _this.myImageCollection.fullCollection.where({
            name: namePhoto
          });
          if (model[0]) {
            model[0].set({ stationId : resp[i][namePhoto]},{silent:true} )
            tabModel.add(model)
          }
          model=undefined;
        }

        $.ajax({
          type: 'PUT',
          url: config.coreUrl + 'sensorDatas/camtrap/'+_this.equipmentId+'/updateMany',
          contentType: 'application/json',
          data: JSON.stringify(tabModel)
        })
        .done(function (resp) {
          var index,model
          var tabSelected = _this.model.get('newSelected');

          for( var i = 0; i < tabSelected.length ; i ++ ) {
            index = tabSelected[i]
            model = _this.tabView[index].model
            if ( model.get('stationId') ){
              _this.tabView[index].setVisualStationAttached(true);
            }
          }

        })
        .fail(function (err) {
          console.log(err);
          alert("someting goes wrong")
        })

      })
      .fail(function (err) {
        console.log(err)
        throw new Error("error create station");
      });

    },

    callPostStationAPI: function (elem, data) {

      $.ajax({
          type: 'POST',
          url: config.coreUrl + 'stations/',
          data: JSON.stringify(data),
          contentType: 'application/json',
          dataType: 'json'
        })
        .done(function (resp) {
          elem.attachStation(resp.ID);
        })
        .fail(function (err) {
          console.log(err)
          throw new Error("error create station");
        });

    },


    createStation: function (event) {
 
      var _this = this;
      var tabSelected = this.model.get('newSelected') || [];
      var listOfElem = []
      

      if( !tabSelected ) {
        return;
      }
      
      var tabStationPending = []
        for( var item in tabSelected ) {
          var elem = tabSelected[item];
          if (this.tabView[elem].model.get('validated') === 2 && this.tabView[elem].model.get('stationId') === null  ) {
            tabStationPending.push(elem);
          }
        }

        if (tabStationPending.length == 0 ) {
          Swal({
            title: 'Error',
            text: 'You can\'t create stations on rejected photo(s)',
            type: 'error',
            confirmButtonColor: 'rgb(218, 146, 15)',
            confirmButtonText: 'Ok',
            closeOnConfirm: true,
            closeOnCancel: true
          });
          return;
        }
      //TODO will fail if same position , same name
      if( tabStationPending.length == 1 ) {
        var data = this.populateDataForCreatingStation(this.tabView[elem]);
        this.callPostStationAPI(this.tabView[elem], data);
      }
      if (tabStationPending.length > 1 ) {
        var allData = []
        for (var i = 0; i < tabStationPending.length; i++) {
          var elem = tabStationPending[i];
          var data = this.populateDataForCreatingStation(this.tabView[elem]);
          allData.push(data)
          // this.callPostStationAPI(this.tabView[elem], data);
        }
        this.callPostAllStationsAPI(tabStationPending,allData)
      }

      _this.refreshCounter();
      _this.updateUIWhenSelectionChange()
    },


    filterCollectionCtrl2: function (event) {

      console.log(event);
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

    fetchAllSessions: function () {
      var _this = this;
      $.ajax({
          url: config.coreUrl + 'sensorDatas/' + _this.type,
        })
        .done(function (resp) {
          _this.equipmentId = resp[1][_this.equipLine].sessionID
          _this.fetchSessionInfos();
          _this.initCollection();
        })
        .fail(function () {
          console.log("pas bon");
        });
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

    acceptPhoto: function (e) {
      if (this.tabSelected.length == 0) {
        if( e.currentTarget.className.indexOf('disabled') > -1 ) {
          return;
        }
        var tabPhotoAccepted = this.model.get('newSelected') || [];
        if( tabPhotoAccepted.length ==1 ) {
          var elem = tabPhotoAccepted[0];
          this.tabView[elem].setModelValidated(2);
          this.refreshCounter();
          this.updateUIWhenSelectionChange();
        }
        else {
          this.acceptAllPhoto();
        }
     }

    },

    acceptAllPhoto : function() {
      var _this = this;
      var tabPhotoAccepted = this.model.get('newSelected') || [];
      var collectionPhotoAccepted = new Backbone.Collection();
      var tabItemAccepted = [];
      var index;
      var tmpModel
      
      for( var i = 0 ; i < tabPhotoAccepted.length ; i++ ) {
        index = tabPhotoAccepted[i];
        tmpModel = this.tabView[index].model;
        if( tmpModel.validated !== 2 ) {
          collectionPhotoAccepted.push(tmpModel);
          tabItemAccepted.push(index)
        }
        index = undefined;
        tmpModel = undefined;
      }

      $.ajax({
        type: 'PUT',
        url: config.coreUrl + 'sensorDatas/camtrap/'+this.equipmentId+'/updateMany',
        contentType: 'application/json',
        data: JSON.stringify(collectionPhotoAccepted)
      })
      .done(function (resp) {
        var item
        for( var i = 0 ; i < tabItemAccepted.length ; i++ ) {
          index = tabItemAccepted[i]
          item = _this.tabView[index];

          item.setModelValidatedSilent(2);
          item = undefined;
        }
        _this.refreshCounter();
        _this.updateUIWhenSelectionChange();
      })
      .fail(function (err) {
        console.log(err);
        alert("someting goes wrong")
      })

    },

    nextPage: function (e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (this.currentCollection.hasNextPage()) {
        this.pageChange = 'N';
        this.currentCollection.getNextPage();
      }
    },

    prevPage: function (e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (this.currentCollection.hasPreviousPage()) {
        this.pageChange = 'P';
        this.currentCollection.getPreviousPage();
      }
    },

    firstPage: function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.currentCollection.getFirstPage();
    },

    lastPage: function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.currentCollection.getLastPage();
    },

    removeStationsBdd : function() {
      var _this = this ;
      var tabStationIdRejected = [];
      var tabPhotoRejected = this.model.get('newSelected') || [];

      for( var i = 0 ; i < tabPhotoRejected.length ; i++ ) {
        var index = tabPhotoRejected[i];
        var stationId = _this.tabView[index].model.get('stationId')
        if( stationId ) {
          tabStationIdRejected.push(stationId);
        }
      }
      $.ajax({
        type: 'POST',
        url: config.coreUrl + 'stations/deleteMany',
        contentType: 'application/json',
        data: JSON.stringify(tabStationIdRejected)
      })
      .done(function (resp) {
        //ok so all stations are deleted 

        for( var item in tabPhotoRejected ) {
          var elem = tabPhotoRejected[item]
          _this.tabView[elem].removeStationAndReject();        
        }
        _this.refreshCounter();
        _this.updateUIWhenSelectionChange();

      })
      .fail(function (err) {
        console.log(err);
      })
        
      //call delete 
      //resp ok 
      //for each model set stations null validated = 2
    },

    rejectAll: function() {
      var _this = this;
      var tabSelected = this.model.get('newSelected');
      var tabRejected = [];

      var index,item,model;
      for( var i = 0 ; i < tabSelected.length ; i ++ ) {
        index = tabSelected[i]
        model = _this.tabView[index].model;
        tabRejected.push(model.toJSON())
      }

      $.ajax({
        type: 'PUT',
        url: config.coreUrl + 'sensorDatas/camtrap/'+this.equipmentId+'/updateMany',
        contentType: 'application/json',
        data: JSON.stringify(tabRejected)
      })
      .done(function (resp) {
        var item
        for( var i = 0 ; i < tabSelected.length ; i++ ) {
          index = tabSelected[i]
          _this.tabView[index].setModelValidatedSilent(4);
        }
        _this.refreshCounter();
        _this.updateUIWhenSelectionChange();
      })
      .fail(function (err) {
        console.log(err);
        alert("someting goes wrong")
      })
    },

    canIRefused : function(tab) {
      var listPhotos = [];
      var index ;
      var flag = true;
      var _this = this
      for(var i= 0 ; i< tab.length ; i++ ) {
        index = tab[i]
        // if(this.tabView[index].model.get('tags') || this.tabView[index].model.get('stationId') ) {
        //   listPhotos.push(index+1)
        // }
        if(this.tabView[index].model.get('stationId') ) {
          listPhotos.push(index+1)
        }
      }
      if (listPhotos.length) {
        Swal({
          title: 'Care',
          // text: +_this.nbPhotosChecked + ' photos still underteminate and ' + (_this.nbPhotos - (_this.nbPhotosChecked + _this.nbPhotosAccepted + _this.nbPhotosRefused)) + ' not seen yet\n',
          text: 'you will destroy stations for photos :\n'+listPhotos.join(','),
          type: 'error',
          showCancelButton: true,
          confirmButtonColor: 'rgb(218, 146, 15)',
  
          confirmButtonText: 'Ok',
          cancelButtonText: 'Cancel',
          closeOnConfirm: true,
          closeOnCancel: true
          
        },function (isConfirm) {
          if (isConfirm) {
            _this.removeStationsBdd();
            // var tabToRefuse = []
            // for(var i = 0 ; i < tab.length ; i++ ) {
            //   _this.tabView[tab[i]].setModelValidated(4);
            //   tabToRefuse.push(tab[i]);
            // }
          } 
        });
      }
      else {
        _this.rejectAll();
        // for(var i = 0 ; i < tab.length ; i++ ) {
        //   _this.tabView[tab[i]].setModelValidated(4);
        // }
      }
    },

    rejectPhoto: function (e) {


      if (this.tabSelected.length == 0) {
        if( e.currentTarget.className.indexOf('disabled') > -1 ) {
          return;
        }
        this.canIRefused(this.model.get('newSelected'));
        this.refreshCounter();
        this.updateUIWhenSelectionChange()
        
      //   if (this.currentPosition !== null ) {
      //     this.canIRefused([this.currentPosition]);
         
      //   }
      // } else {
      //   this.canIRefused(this.tabSelected);

        // for (var i of this.tabSelected) {
        //   // this.tabView[i].setModelValidated(4);
        // }
      }
    },
    undeterminatePhoto: function (e) {
      if (this.tabSelected.length == 0) {
        if (this.currentPosition !== null) {
          this.tabView[this.currentPosition].setModelValidated(1);
        }
      } else {
        for (var i of this.tabSelected) {
          this.tabView[i].setModelValidated(1);
        }
      }
    },

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
        }
      }
    },

    displayModal: function (e) {
      e.preventDefault();

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
          }))
          this.rgFullScreen.$el.addClass("crop2 crop-paginator");
          this.rgFullScreen.$el.show();
        } else {
          if (!this.rgFullScreen.$el.hasClass("crop2")) {
            this.rgFullScreen.$el.addClass("crop2 crop-paginator");
          }
          this.rgFullScreen.currentView.changeModel(this.tabView[this.currentPosition].model);
          this.rgFullScreen.$el.show();
        }
      }
    },

    mouvement: function (e) {
      /** this.stopSpace handle up and down for the fullscreen **/

      var tabSelected = this.model.get('newSelected');
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
          this.model.set('newSelected',[newPosition]);
          // this.rgToolsBar.currentView.changeModel(this.tabView[newPosition].model);

          if (this.rgImageDetails.currentView != undefined) {
            this.rgImageDetails.currentView.changeDetails(this.tabView[newPosition].model)
          }

          if (this.rgFullScreen.currentView !== undefined && this.stopSpace) {
            this.rgFullScreen.currentView.changeModel(this.tabView[newPosition].model);
          }

        }
    },

    // mouvement: function (e) {
    //   /** this.stopSpace handle up and down for the fullscreen **/
    //   if (this.currentPosition !== null) {
    //     var lastPosition = this.currentPosition; //stock la position avant changement pour savoir si on a bougé

    //     switch (e.keyCode) {
    //       case 38:
    //         { // up
    //           if (this.currentPosition - 6 >= 0 && !this.stopSpace) {
    //             this.currentPosition -= 6;
    //           }
    //           break;
    //         }
    //       case 40:
    //         { //down
    //           if (this.currentPosition + 6 <= this.tabView.length - 1 && !this.stopSpace) {
    //             this.currentPosition += 6;
    //           }
    //           break;
    //         }
    //       case 37:
    //         { //left
    //           if (this.currentPosition - 1 >= 0) {
    //             this.currentPosition -= 1;
    //           } else {
    //             this.prevPage();
    //             return;
    //           }
    //           break;
    //         }
    //         //right
    //       case 39:
    //         { //right
    //           if (this.currentPosition + 1 <= this.tabView.length - 1) {
    //             this.currentPosition += 1;
    //           } else {
    //             this.nextPage();
    //             return;
    //           }
    //           break;
    //         }
    //     }

    //     if (lastPosition !== this.currentPosition) { // si on a bougé
    //       // if (this.tabSelected.length > 0 ) {
    //       //   this.tabSelected = [];
    //       //   this.tabView[this.currentPosition].$el.find('img').click()
    //       //   //dirty hack
    //       // }
    //       this.model.set('newSelected',[this.currentPosition]);

    //       if (this.tabSelected.length === 0) {
    //         // this.tabView[lastPosition].$el.find('.vignette').toggleClass('active');
    //         // this.tabView[this.currentPosition].handleFocus();
    //         this.rgToolsBar.currentView.changeModel(this.tabView[this.currentPosition].model);
    //       }

    //       if (this.rgImageDetails.currentView != undefined) {
    //         this.rgImageDetails.currentView.changeDetails(this.tabView[this.currentPosition].model)
    //       }

    //       if (this.rgFullScreen.currentView !== undefined && this.stopSpace) {
    //         this.rgFullScreen.currentView.changeModel(this.tabView[this.currentPosition].model);
    //       }

    //     }

    //   }

    // },

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
      if( ! this.toolsBar.$elemTags[0].disabled ) {
        if( this.toolsBar.$elemTags.data('select2').isOpen() ) {
          this.toolsBar.$elemTags.select2('close');
          this.toolsBar.$elemTags.select2().trigger('blur');
          //TODO BUG FIX HANDLE CONTEXT fullscreen ? one photos selected ? tab photos selected?
        }
        else {
          this.toolsBar.$elemTags.select2('open');
        }
      }
    },

    // findInput: function (e) {
    //   e.preventDefault(); // disable browser tab
    //   this.$el.find(".bootstrap-tagsinput  input").focus();
    // },

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
      var allSpan = parent$elem.getElementsByTagName('span')
      for (var i = 0; i < allSpan.length; i++) {
        if (allSpan[i].className.indexOf('selected') > -1) {
          allSpan[i].className = allSpan[i].className.replace(' selected', '')
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
        myFilter.validated = null;
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

      this.paginationFiltered = PageColl.extend({
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl + 'sensorDatas/' + this.type + '/' + this.equipmentId + '/datas/',
      });

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
        title: 'You can\'t validate this sessions',
        // text: +_this.nbPhotosChecked + ' photos still underteminate and ' + (_this.nbPhotos - (_this.nbPhotosChecked + _this.nbPhotosAccepted + _this.nbPhotosRefused)) + ' not seen yet\n',
        text: +_this.nbPhotosNotChecked + ' photos still underteminate',
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
        text += _this.nbPhotosRefused + ' will be refused';
      } else if (_this.nbPhotosRefused == 0) {
        text += _this.nbPhotosAccepted + ' will be accepted';
      } else {
        text += _this.nbPhotosAccepted + ' will be accepted and ' + _this.nbPhotosRefused + ' refused';
      }

      Swal({
          title: 'Validation',
          text: 'you have finish this sessions\nOn ' + _this.nbPhotos + ' photos ' + text,
          type: 'success',
          showCancelButton: true,
          confirmButtonColor: 'rgb(218, 146, 15)',

          confirmButtonText: 'Ok !',
          cancelButtonText: 'No ! i want to return to session\'s validation',
          closeOnConfirm: true,
          closeOnCancel: true
        },
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
                Swal({
                  title: 'Upload finished',
                  text: 'you have finish this sessions\nOn ' + _this.nbPhotos + ' photos ' + text,
                  type: 'success',
                  showCancelButton: true,
                  confirmButtonColor: 'rgb(218, 146, 15)',

                  confirmButtonText: 'Go to monitored sites',
                  cancelButtonText: 'Return to validation',
                  closeOnConfirm: true,
                  closeOnCancel: true

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
                  text: 'Something goes wrong',
                  type: 'error',
                  showCancelButton: true,
                  confirmButtonColor: 'rgb(218, 146, 15)',

                  confirmButtonText: 'Go to monitored sites',
                  cancelButtonText: 'Return to validation',
                  closeOnConfirm: true,
                  closeOnCancel: true
                });

              });
            //TODO mettre le status validated a 8 pour sauvegarder la validation de force
          }
          else {
            return;
          }

        }
      );
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

