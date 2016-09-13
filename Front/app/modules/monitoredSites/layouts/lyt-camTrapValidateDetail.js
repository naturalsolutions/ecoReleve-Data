//radio
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'config',
  'ns_grid/model-grid',
  'ns_map/ns_map',
  'ns_form/NSFormsModuleGit',
  'moment',
  'ns_navbar/ns_navbar',
  'backbone.paginator',
  './lyt-camTrapItemView',
  './lyt-camTrapImageModel',
  './lyt-camTrapModal',
  'backbone.marionette.keyShortcuts',
  'backbone.virtualcollection',
  'jqueryui',



], function($, _, Backbone, Marionette, Swal, Translater,
  config, NsGrid, NsMap, NsForm, moment, Navbar, PageColl,
  CamTrapItemView , CamTrapImageModel, ModalView, BckMrtKeyShortCut,
  virtualcollection, jqueryUi

) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/monitoredSites/templates/tpl-camTrapValidateDetail.html',

    className: 'full-height animated white',
    childEvents:{

    },
    keyShortcuts:{
      'up' : 'mouvement',
      'down' : 'mouvement',
      'left' : 'mouvement',
      'right' : 'mouvement',
      'space': 'displayModal',
      'esc' : 'leaveModal',
      'pagedown': 'nextPage',
      'pageup' : 'prevPage',
      'home' : 'firstPage',
      'end' : 'lastPage',

    },

    events: {
      'click i#leftMouvementBtn': 'leftMouvement',
      'click i#rightMouvementBtn': 'rightMouvement',
    },

    ui: {
      'grid': '#grid',
      'totalEntries': '#totalEntries',
      'gallery': '#gallery',
      'gallerytest': '#gallerytest',
      'siteForm': '#siteForm',
      'sensorForm': '#sensorForm',
      'imageDetailsForm': '#imageDetailsForm',

      'dataSetIndex': '#dataSetIndex',
      'dataSetTotal': '#dataSetTotal',

      'totalS' : '#totalS',
      'total' : '#total',
      'paginator':'#paginator'

    },

    regions: {
      'rgNavbar': '#navbar',
      'rgGallery' : '#gallery',
      'rgModal': '#rgModal',
    },

  clickOnIconeView : function(e){
      var _this = this;
      e.preventDefault();

      var $elemToInactive = $('#rgToolsBarTop .active');
      var $elemToActive =  $(e.target);
      if( $elemToInactive[0]  != $elemToActive[0]) { //handle click on same icon
       $elemToInactive.toggleClass('active'); //remove active actual elem
       $elemToActive.toggleClass('active'); // add active elem clicked
       if($elemToActive.hasClass('reneco-ecollectionsmall')){
          this.leaveModal(e);
        }
        else if( $elemToActive.hasClass('reneco-image_file') ) {
          this.displayModal(e);
        }
        else{
          ;
            //console.log("list file");
        }
      }else{
        ;
        //console.log("rien a faire");
      }
      e.stopPropagation();
    },
    initialize: function(options) {
      this.translater = Translater.getTranslater();
      this.type = options.type;
      this.model = options.model;
      this.lastImageActive = null;
      this.currentViewImg = null;
      this.currentPosition = null;
      this.pageChange = '';
      this.currentCollection = null;
      this.currentPaginator = null;
      this.nbPhotos = 0;
      this.nbPhotosAccepted = 0;
      this.nbPhotosRefused = 0;
      this.nbPhotosChecked = 0;
      this.stopSpace = false;

      console.log(options);
      this.siteId = options.id;
      this.equipmentId = options.equipId;
      this.date = options.date;

      this.globalGrid = options.globalGrid;

      this.initCollection();
    },

    initCollection : function() {
      var _this = this;
      var ImageCollection = PageColl.extend({
        model : CamTrapImageModel,
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl + 'photos/?siteid='+_this.siteId+'&equipid='+this.equipmentId+''
      });

      this.myImageCollection = new ImageCollection();
      //this.myImageCollection.sync('patch', this.myImageCollection , { error: function () { console.log(this.myImageCollection); console.log("sync impossible");} });

      this.paginator = new Backgrid.Extension.Paginator({
        collection: this.myImageCollection
      });
      this.myImageCollection.on('sync', function() {
      });

      this.myImageCollection.fetch();

      this.paginator.collection.on('reset', function(e){
        console.log(_this.myImageCollection);
        //console.log("reset du paginator");
      });

    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      var _this = this;
      //this.rgNavbar.show(this.navbar);
      this.display();
    },

    display: function() {
      var _this = this;
      this.listenTo(this.myImageCollection, 'reset', function(e){// trigger on init or on change page
        //console.log("reset");
        _this.displayImages(_this.myImageCollection);
      });
      this.currentCollection = this.myImageCollection;

      this.displayPaginator(this.paginator)

    },

    displayImages: function(myCollectionToDisplay){
      var _this = this;
      this.currentCollection = myCollectionToDisplay;
      var ImageModel = new CamTrapImageModel();
      //TODO detruit les view a la main sinon pb avec les models
      if( typeof (_this.tabView) !== "undefined" ){
        this.destroyViews(_this.tabView);
      }
      //this.ui.gallery.html('');
      this.currentPosition = null;
      this.tabView = [];
      myCollectionToDisplay.each(function(model){
        var newImg = new CamTrapItemView({
          model: model,
          parent: _this,
        });
        _this.tabView.push(newImg);
        _this.ui.gallery.append(newImg.render().el);

      });
      if (this.tabView.length > 0){
        switch(this.pageChange){
          case 'N':{//next page
            this.pageChange = '';
            this.currentPosition = 0;//position to focus
            this.tabSelected = [];
            break;
          }
          case 'P': {//previous page
            this.pageChange = '';
            this.currentPosition = this.tabView.length-1; //position to focus
            this.tabSelected = [];
            break;
          }
          default:{
            //console.log("bim default");
            this.currentPosition = 0;
            this.tabSelected = [];
            break;
          }
        }
        this.focusImg();
        if( this.rgModal.currentView !== undefined){//si le modal existe on change
          this.rgModal.currentView.changeImage(this.tabView[this.currentPosition].model);
        }
        $('#gallery').selectable({
          filter: '.imageCamTrap',
           distance : 10,
           start : function(e , ui) {
             if (_this.tabView[_this.currentPosition].$el.find('.vignette').hasClass('active')  ) {
               _this.tabView[_this.current]
               _this.tabView[_this.currentPosition].$el.find('.vignette').removeClass('active');
             }

             if ( typeof _this.tabSelected != "undefined" && _this.tabSelected.length > 0 ) {
               for ( var i of _this.tabSelected ) {
         					if( _this.currentPosition != i  ) {
                    if (_this.tabView[i].$el.find('.vignette').hasClass('active')  ) {
             					_this.tabView[i].$el.find('.vignette').removeClass('active');
                    }
     				     }
               }
             }
           },
           selected: function (e , ui){
             if( e.ctrlKey) {
               if( $(ui.selected).hasClass('already-selected') ) {
                 $(ui.selected).removeClass('already-selected')
                 $(ui.selected).removeClass('ui-selected');
               }else{
                 $(ui.selected).addClass('tmp-selectedctrl');
               }
             }
             else{
               $(ui.selected).addClass('tmp-selected');
               $(ui.selected).removeClass('ui-selected');
             }
           },
           unselected: function(e , ui ) {
             $('#gallery .already-selected').removeClass('already-selected');
          },
           stop: function(e, ui) {

              $('#gallery .tmp-selected').addClass('already-selected').removeClass('tmp-selected').addClass('ui-selected');
              $('#gallery .tmp-selectedctrl').addClass('already-selected').removeClass('tmp-selectedctrl').addClass('ui-selected');

                var result = "";
                _this.tabSelected = [];

                $( ".ui-selected", this ).each(function() {
                   var index = $( ".imageCamTrap" ).index( this );
                   _this.tabSelected.push(index);
                   if( ! (_this.tabView[index].$el.find('.vignette').hasClass('active') ) ) {
                     _this.tabView[index].$el.find('.vignette').toggleClass('active');
                   }
                });
           }
        });
      }
    },

    destroyViews : function(tabView){
      for(var i = 0 ; i < tabView.length ; i++)
      {
        tabView[i].destroy();
      }
    },

    displayPaginator: function (pagin) {
      this.currentPaginator = pagin;
      this.ui.paginator.html('');
      this.ui.paginator.append(pagin.render().el);
    },

    displayToolsBar: function () {
      var _this = this ;
      this.toolsBar = new ToolsBar( {
        parent : _this,
      });
      this.rgToolsBar.show(this.toolsBar);
    },

    displayToolsBarTop: function(nbPhotos){
      var _this = this ;
      this.toolsBarTop = new ToolsBarTop( {
        parent : _this,
      });
      this.rgToolsBarTop.show(this.toolsBarTop);
    },

    reloadFromNavbar: function(model) {
      this.model = model;
      this.sensorId = this.model.get('fk_sensor');
      this.siteId = this.model.get('FK_MonitoredSite');
      this.equipmentId = this.model.get('equipID');

      this.initCollection();

      this.display();
    },


    setTotal: function(){
      this.ui.totalS.html(this.grid.grid.getSelectedModels().length);
      this.ui.total.html(this.grid.grid.collection.length);
    },

    nextPage : function(e) {
      if(e){
        e.preventDefault();
        e.stopPropagation();
      }
      if( this.currentCollection.hasNextPage() ){
        this.pageChange = 'N';
        this.currentCollection.getNextPage();
      }
    },

    prevPage : function(e) {
      if(e){
        e.preventDefault();
        e.stopPropagation();
      }
      if( this.currentCollection.hasPreviousPage() ){
        this.pageChange = 'P';
        this.currentCollection.getPreviousPage();
      }
    },

    firstPage : function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.currentCollection.getFirstPage();
    },

    lastPage : function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.currentCollection.getLastPage();
    },


    leaveModal: function(e){
      this.stopSpace = false;
      $('#rgToolsBarTop .reneco-ecollectionsmall').addClass('active');
      $('#rgToolsBarTop .reneco-image_file').removeClass('active');
      if(this.rgModal.currentView !== undefined) {
        this.rgModal.currentView.hide();
      }
    },

    displayModal: function(e){
      e.preventDefault();

      if(this.currentPosition !== null && !this.stopSpace) { //il faut une position pour afficher le modal
        /*activate icon*/
        this.stopSpace = true;
        $('#rgToolsBarTop .reneco-ecollectionsmall').removeClass('active');
        $('#rgToolsBarTop .reneco-image_file').addClass('active');
        if(this.rgModal.currentView === undefined) {
          this.rgModal.show( new ModalView({ model : this.tabView[this.currentPosition].model, parent :this}))
        }
        else {
          this.rgModal.currentView.changeImage(this.tabView[this.currentPosition].model);
          this.rgModal.currentView.onShow();
        }
      }
    },

    focusLastImg(){
      if( this.currentPosition === null) {//si aucune position
        if( this.tabView != null){
          this.currentPosition = this.tabView.length-1; //et on se place sur 0
          this.tabView[this.currentPosition].doFocus(); // focus la premiere image
          this.tabView[this.currentPosition].$el.find('.vignette').toggleClass('active');
        }
      }

    },

    focusImg(){
      if( this.currentPosition === null) {//si aucune position
          this.currentPosition = 0;
        }
      if( this.tabView != null){
        this.tabView[this.currentPosition].handleFocus(); // focus la premiere image
        //this.currentPosition = 0; //et on se place sur 0
        //this.tabView[0].$el.find('.vignette').toggleClass('active');
      }

    },

    mouvement: function(e){
      /** this.stopSpace handle up and down for the fullscreen **/
      if( this.currentPosition !== null) {
        var lastPosition = this.currentPosition;//stock la position avant changement pour savoir si on a bougé

        switch(e.keyCode)
        {
          case 38: {// up
            if ( this.currentPosition - 6 >= 0 && !this.stopSpace ){
              this.currentPosition-=6;
            }
            break;
          }
          case 40: {//down
            if ( this.currentPosition + 6 <= this.tabView.length - 1 && !this.stopSpace ){
              this.currentPosition+=6;
            }
            break;
          }
          case 37: { //left
            if ( this.currentPosition - 1 >= 0 ){
              this.currentPosition-=1;
            } else {
              this.prevPage();
              return;
            }
            break;
          }
          //right
          case 39: {//right
            if ( this.currentPosition + 1 <= this.tabView.length - 1 ){
              this.currentPosition+=1;
            }else {
              this.nextPage();
              return;
            }
            break;
          }
        }

        if (lastPosition !== this.currentPosition) {// si on a bougé
          if( this.tabSelected.length === 0)
            this.tabView[lastPosition].$el.find('.vignette').toggleClass('active');
          this.tabView[this.currentPosition].handleFocus();
          if( this.rgModal.currentView !== undefined){//si le modal existe on change
            this.rgModal.currentView.changeImage(this.tabView[this.currentPosition].model);
          }
        }

      }

    },

    rightMouvement: function() {
      var simE =  {keyCode : 39};
      this.mouvement(simE);
    },

    leftMouvement: function() {
    var simE =  {keyCode : 37};
      this.mouvement(simE);
    },

    prevImage: function(){
      var index = this.myImageCollection.indexOf(this.currentViewImg.model); // index 0 a n-1
      if( index - 1 < 0) {
        this.currentViewImg = this.tabView[0];
      }
      else {
        this.currentViewImg = this.tabView[index - 1]; // on se deplace de - 1
      }
      this.rgModal.currentView.changeImage(this.currentViewImg.model);

    },

    nextImage: function(){
      var index = this.myImageCollection.indexOf(this.currentViewImg.model);
      if( index >= this.tabView.length - 1 ) {
        this.currentViewImg = this.tabView[this.tabView.length - 1];
      }
      else {
        this.currentViewImg = this.tabView[index + 1];
      }
      this.rgModal.currentView.changeImage(this.currentViewImg.model);

    },

    displayAll: function (e){
      this.currentCollection = this.myImageCollection;
      //this.ui.gallery.html('');
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollection);
      this.displayPaginator(this.paginator);

    },

    roundDate: function(date, duration) {
      return moment(Math.floor((+date) / (+duration)) * (+duration));
    },

});
});
