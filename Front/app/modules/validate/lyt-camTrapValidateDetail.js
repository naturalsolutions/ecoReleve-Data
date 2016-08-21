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
  './lyt-camTrapToolsBarView',
  './lyt-camTrapModal',
  'backbone.marionette.keyShortcuts',
  'backbone.virtualcollection',
  './lyt-camTrapToolsBarTopView',



], function($, _, Backbone, Marionette, Swal, Translater,
  config, NsGrid, NsMap, NsForm, moment, Navbar, PageColl,
  CamTrapItemView , CamTrapImageModel, ToolsBar, ModalView, BckMrtKeyShortCut,
  virtualcollection, ToolsBarTop

) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/validate/templates/tpl-camTrapValidateDetail.html',

    className: 'full-height animated white',
    childEvents:{

    },
    keyShortcuts:{
      'up' : 'mouvement',
      'down' : 'mouvement',
      'left' : 'mouvement',
      'right' : 'mouvement',
      'tab': 'findInput',
      'space': 'displayModal',
      'backspace' : 'toggleModelStatus',
      'esc' : 'leaveModal',
      'pageup': 'nextPage',
      'pagedown' : 'prevPage',
      'home' : 'firstPage',
      'end' : 'lastPage',

    },

    events: {
      'click button#validate': 'validate',

      'click button#displayAll': 'displayAll',
      'click button#displayDeleted': 'displayDeleted',
      'click button#displayValidated': 'displayValidated',
      'click button#displayTags': 'displayTags',
      'click button#refusedBtn': 'rejectPhoto',
      'click button#upStarsBtn': 'increaseStars',
      'click button#downStarsBtn': 'decreaseStars',
      'click button#acceptedBtn': 'acceptPhoto',
      'click button#validate' : 'validateAll',
      'click .reneco-ecollectionsmall' : 'clickOnIconeView',
      'click .reneco-image_file' : 'clickOnIconeView',
      'click .reneco-list' :'clickOnIconeView',
      'click #js_accepted_top' : 'filterCollectionCtrl',
      'click #js_refused_top' :'filterCollectionCtrl',
      'click #js_checked_top' : 'filterCollectionCtrl',
      'click #js_notchecked_top' :'filterCollectionCtrl',
      'click #infossession' : 'filterCollectionCtrl',
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
      'rgToolsBar' :'#rgToolsBar',
      'rgToolsBarTop' : '#rgToolsBarTop'
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
            //console.log("list file");
        }
      }else{
        console.log("rien a faire");
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
      this.currentCollection = null;
      this.currentPaginator = null;
      this.nbPhotos = 0;
      this.nbPhotosAccepted = 0;
      this.nbPhotosRefused = 0;
      this.nbPhotosChecked = 0;
      this.stopSpace = false;

      this.sensorId = this.model.get('fk_sensor');
      this.siteId = this.model.get('FK_MonitoredSite');
      this.equipmentId = this.model.get('equipID');

      this.navbar = new Navbar({
        parent: this,
        globalGrid: options.globalGrid,
        model: this.model,
      });

      this.globalGrid = options.globalGrid;

      // this.validatedImg = this.myImageCollection.filter({validated : "true"})
      // this.deletedImg = this.myImageCollection.filter({validated : "false"})
      // this.toCheckImg = this.myImageCollection.filter({validated : "null"})

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
        url: config.coreUrl+'sensors/' + this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId,
        patch : function(){
          console.log("ouais ouais ouais j'overwrite");
        }
      });

      this.myImageCollection = new ImageCollection();
      this.myImageCollection.sync('patch', this.myImageCollection , { error: function () { console.log(this.myImageCollection); console.log("sync impossible");} });

      this.paginator = new Backgrid.Extension.Paginator({
        collection: this.myImageCollection
      });
      this.myImageCollection.on('sync', function() {
        _this.refreshCounter();

      });

      this.myImageCollection.fetch();

      this.paginator.collection.on('reset', function(e){
      });

    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      var _this = this;
      this.rgNavbar.show(this.navbar);
      this.display();
    },

    display: function() {
      var _this = this;
      this.listenTo(this.myImageCollection, 'reset', function(e){// trigger on init or on change page
        _this.displayImages(_this.myImageCollection);
        _this.rgToolsBarTop.show(this.toolsBarTop);
      });
      this.currentCollection = this.myImageCollection;
      this.displaySensorForm();
      this.displaySiteForm();
      this.displayImageDetailForm();
      this.displayPaginator(this.paginator)
      this.displayToolsBar();
      this.displayToolsBarTop();
    },

    displayImages: function(myCollectionToDisplay){
      var _this = this;
      console.log(myCollectionToDisplay);
      this.currentCollection = myCollectionToDisplay;
      var ImageModel = new CamTrapImageModel();
      //TODO detruit les view a la main sinon pb avec les models
      if( typeof (_this.tabView) !== "undefined" ){
        this.destroyViews(_this.tabView);
      }
      this.ui.gallery.html('');
      _this.currentPosition = null;
      _this.tabView = [];
      myCollectionToDisplay.each(function(model){
        var newImg = new CamTrapItemView({
          model: model,
          parent: _this,
        });
        _this.tabView.push(newImg);
        _this.ui.gallery.append(newImg.render().el);

      });
      if (this.tabView.length > 0){
        this.focusFirstImg();
      }
    },

    destroyViews : function(tabView){

      for(var i = 0 ; i < tabView.length ; i++)
      {
        tabView[i].destroy();
      }

    },

    displaySensorForm: function() {
      this.nsform = new NsForm({
        name: 'sensorForm',
        buttonRegion: [this.ui.btn],
        modelurl: config.coreUrl + 'sensors',
        formRegion: this.ui.sensorForm,
        displayMode: 'display',
        id: this.sensorId,
        reloadAfterSave: false,
      });
    },

    displaySiteForm: function() {
      this.nsform = new NsForm({
        name: 'siteForm',
        buttonRegion: [this.ui.btn],
        modelurl: config.coreUrl + 'monitoredSites',
        formRegion: this.ui.siteForm,
        displayMode: 'display',
        id: this.siteId,
        reloadAfterSave: false,
      });
    },

    displayImageDetailForm: function() {
      this.nsform = new NsForm({
        name: 'imageDetailsForm',
        buttonRegion: [this.ui.btn],
        modelurl: config.coreUrl + 'sensors',
        formRegion: this.ui.imageDetailsForm,
        displayMode: 'display',
        id: this.sensorId,
        reloadAfterSave: false,
      });
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


    acceptPhoto : function(e) {
      if(this.currentPosition !== null ) {
        this.tabView[this.currentPosition].setModelValidated(2);
      }

    },

    nextPage : function(e) {
      e.preventDefault();
      e.stopPropagation();
      if( this.currentCollection.hasNextPage() ){
        this.leaveModal();
        this.currentCollection.getNextPage();
      }
    },

    prevPage : function(e) {
      e.preventDefault();
      e.stopPropagation();
      if( this.currentCollection.hasPreviousPage() ){
        console.log("on a une page avant");
        this.leaveModal();
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

    rejectPhoto : function(e) {

      if(this.currentPosition !== null ) {
        this.tabView[this.currentPosition].setModelValidated(4);
      }

    },

    toggleModelStatus: function(e){
      e.preventDefault();
      if(this.currentPosition !== null ) {
        this.tabView[this.currentPosition].toggleModelStatus();
      }

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
        $('#rgToolsBarTop .reneco-ecollectionsmall').removeClass('active');
        $('#rgToolsBarTop .reneco-image_file').addClass('active');
        if(this.rgModal.currentView === undefined) {
          this.rgModal.show( new ModalView({ model : this.tabView[this.currentPosition].model, parent :this}))
        }
        else {
          this.rgModal.currentView.changeImage(this.tabView[this.currentPosition].model);
          this.rgModal.currentView.onShow();
        }
        this.stopSpace = true;
      }
    },

    focusFirstImg(){
      if( this.currentPosition === null) {//si aucune position
        if( this.tabView != null){
          this.tabView[0].$el.find('img').focus(); // focus la premiere image
          this.currentPosition = 0; //et on se place sur 0
          this.tabView[0].$el.find('.vignette').toggleClass('active');
        }
      }
    },

    mouvement: function(e){

      if( this.currentPosition === null) {//si aucune position
        this.focusFirstImg();
      }
      else{
        var lastPosition = this.currentPosition;//stock la position avant changement pour savoir si on a bougé
        switch(e.keyCode)
        {
          case 38: {// up
            if ( this.currentPosition - 6 >= 0){
              this.currentPosition-=6;
            }
            break;
          }
          case 40: {//down
            if ( this.currentPosition + 6 <= this.tabView.length - 1 ){
              this.currentPosition+=6;
            }
            break;
          }
          case 37: { //left
            if ( this.currentPosition - 1 >= 0 ){
              this.currentPosition-=1;
            }
            break;
          }
          //right
          case 39: {//right
            if ( this.currentPosition + 1 <= this.tabView.length - 1 ){
              this.currentPosition+=1;
            }
            break;
          }
        }

        if (lastPosition !== this.currentPosition) {// si on a bougé
          this.tabView[this.currentPosition].$el.find('img').focus();//on change le focus
          this.tabView[lastPosition].$el.find('.vignette').toggleClass('active');
          this.tabView[this.currentPosition].$el.find('.vignette').toggleClass('active');
          if( this.rgModal.currentView !== undefined){//si le modal existe on change
            this.rgModal.currentView.changeImage(this.tabView[this.currentPosition].model);
          }
        }
      }

    },

    findInput: function(e){
      e.preventDefault(); // disable browser tab
      this.$el.find(".bootstrap-tagsinput  input").focus();
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

    fillTagsInput : function(){
      var $inputTags = this.toolsBar.$el.find("#tagsinput");
      this.toolsBar.removeAll();//vide les tags

      var tabTagsTmp = this.tabView[this.currentPosition].getModelTags()
      if( tabTagsTmp !== null )
      {
        tabTagsTmp = tabTagsTmp.split(","); //charge les nouveaux
        for(var i = 0 ; i < tabTagsTmp.length ; i++ ) {
          this.toolsBar.addTag(tabTagsTmp[i]);
        }
      }

    },

    displayAll: function (e){
      this.currentCollection = this.myImageCollection;
      this.ui.gallery.html('');
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollection);
      this.displayPaginator(this.paginator);

    },

    refreshCounter : function(){
      this.nbPhotos = this.myImageCollection.fullCollection.length;
      this.nbPhotosAccepted = this.myImageCollection.fullCollection.where({validated:2}).length ;
      this.nbPhotosRefused  = this.myImageCollection.fullCollection.where({validated:4}).length ;
      this.nbPhotosChecked = this.myImageCollection.fullCollection.where({validated:1}).length ;
      this.toolsBarTop.$el.find("#nbphotos").text(this.nbPhotos);
      this.toolsBarTop.$el.find("#nbphotosaccepted").text(this.nbPhotosAccepted);
      this.toolsBarTop.$el.find("#nbphotosrefused").text(this.nbPhotosRefused);
      this.toolsBarTop.$el.find("#nbphotoschecked").text(this.nbPhotosChecked);
      this.toolsBarTop.$el.find("#nbphotosnotchecked").text(this.nbPhotos - (this.nbPhotosChecked + this.nbPhotosAccepted + this.nbPhotosRefused));
    },

    filterCollectionCtrl: function(e) {

        var $elem = $(e.currentTarget);
        var myFilter = {};
        if( $('#rgToolsBarTop .reneco-image_file').hasClass('active') )
          this.leaveModal();

        if ( $elem.hasClass('accepted') ) {
          myFilter.validated = 2;
        }
        else if ( $elem.hasClass('refused') ) {
          myFilter.validated = 4;
        }
        else if ( $elem.hasClass('checked') ) {
          myFilter.validated = 1;
        }
        else if ( $elem.hasClass('notchecked') ) {
          myFilter.validated = null;
        }
        else if ($elem.hasClass('allphotos') ){
          //remet la collection mere
          this.ui.gallery.html('');
          this.displayImages(this.myImageCollection);
          this.ui.paginator.html('');
          this.displayPaginator(this.paginator);

        }
        if ( !$elem.hasClass('allphotos') ){
          this.initCollectionFiltered(myFilter);
        }

    },

    initCollectionFiltered: function(filter){
      var _this = this;

      this.filterModelFiltered = new virtualcollection(
        this.myImageCollection.fullCollection ,
        {
          filter
        }
      );

      this.paginationFiltered = PageColl.extend({
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl+'sensors/' + this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId,
      });

      console.log(this.filterModelFiltered);
      this.displayFiltered();
    },

    displayFiltered: function (e){
      var _this = this ;

       var paginationFiltered = PageColl.extend({
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl+'sensors/' + this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId,
        queryParams: {
          totalPages: null,
          totalRecords: null,
        },
        parseState: function (resp, queryParams, state, options) {
          return {totalRecords: resp.total_entries};
        }
      });

      this.myImageCollectionFiltered = new paginationFiltered(this.filterModelFiltered.models)
      this.myPaginationFiltered = new Backgrid.Extension.Paginator({
        collection: this.myImageCollectionFiltered
      });
      this.listenTo(this.myImageCollectionFiltered, "reset", function(e){
        console.log("RESET DE LA COLLECTION");
        _this.displayImages(_this.myImageCollectionFiltered);
      });

      this.ui.gallery.html('');
      this.displayImages(this.myImageCollectionFiltered);
      this.ui.paginator.html('');
      this.displayPaginator(this.myPaginationFiltered);
/*
      if( typeof this.myImageCollectionFiltered != 'undefined') {
        console.log("on reset collection filter");
        //console.log(JSON.stringify(this.filterModelFiltered.updateFilter( {validated : 4}).models) );
        this.myImageCollectionFiltered.parse(
          { "total_entries" : this.filterModelFiltered.updateFilter( {validated : 4}).models.length},
          JSON.stringify(this.filterModelFiltered.updateFilter( {validated : 4}).models)
        );

        console.log(this.myImageCollectionFiltered);
      }
      else{
        console.log("on new la collection filter");
        this.myImageCollectionFiltered = new paginationFiltered(this.filterModelFiltered.models)
      }
      if( typeof this.myPaginationFiltered != 'undefined') {
        console.log("on detruit pagination filter");
        this.myPaginationFiltered = null;
      }
      else{
        console.log("création pagination premiere");
        this.myPaginationFiltered = new Backgrid.Extension.Paginator({
          collection: this.myImageCollectionFiltered
        });
        _this.ui.gallery.html('');
        _this.displayImages(_this.myImageCollectionFiltered);
        _this.ui.paginator.html('');
        _this.displayPaginator(_this.myPaginationFiltered);
      }

      this.listenTo(this.myImageCollectionFiltered, "reset", function(e){
        console.log("RESET DE LA COLLECTION");
        _this.displayImages(this.myImageCollectionFiltered);
      });
      console.log(this.myImageCollectionFiltered);
      console.log(this.myPaginationFiltered);
      //_this.myImageCollectionFiltered.parse({ "total_entries" : _this.myImageCollectionFiltered.models.length},_this.myImageCollectionFiltered.models );
      console.log(this.myImageCollectionFiltered);
      this.myPaginationFiltered = new Backgrid.Extension.Paginator({
        collection: this.myImageCollectionFiltered
      }); // quand la collection a fetch on instantie la pagination
      console.log(this.myPaginationFiltered);
      this.ui.gallery.html('');
      this.displayImages(this.myImageCollectionFiltered);
      this.ui.paginator.html('');
      this.displayPaginator(this.myPaginationFiltered);
      this.currentCollection = this.myImageCollectionFiltered;

      if( this.ui.gallery.html() === '' )
      {
        this.ui.gallery.html('NO IMAGES TO DISPLAY')
      }
      else {
      //  console.log(this.ui.gallery.html());
      }
      //this.focusFirstImg();
*/
    },

    displayValidated: function (e){
      var _this = this ;

      var filterModelValidated = new virtualcollection(this.myImageCollection.fullCollection ,
        {
          filter : {validated : 2}
        });

      var paginationFiltered = PageColl.extend({
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl+'sensors/' + this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId,
      });

      this.myImageCollectionValidated = new paginationFiltered(filterModelValidated.models)
      this.myPaginationValidated = new Backgrid.Extension.Paginator({
        collection: this.myImageCollectionValidated
      });

      this.listenTo(this.myImageCollectionValidated, "reset", function(e,z){
        _this.displayImages(_this.myImageCollectionValidated);
      });
      this.currentCollection = this.myImageCollectionValidated;
      this.ui.gallery.html('');
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollectionValidated);
      this.displayPaginator(this.myPaginationValidated);
      if( this.ui.gallery.html() === '' )
      {
        this.ui.gallery.html('NO IMAGES TO DISPLAY')
      }
      else {
        console.log(this.ui.gallery.html());
      }
      //this.focusFirstImg();

    },

    displayDeleted: function (e){
      /*var filterModel = this.myImageCollection.fullCollection.where({validated:false});
      console.log(filterModel);
      filterModel[0].set("validated",true);*/
      var _this = this ;

      var filterModelDeleted = new virtualcollection(this.myImageCollection.fullCollection ,
        {
          filter : {validated : 4}
        });

      var paginationFiltered = PageColl.extend({
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl+'sensors/' + this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId,
      });

      this.myImageCollectionDeleted = new paginationFiltered(filterModelDeleted.models)
      this.myPaginationDeleted = new Backgrid.Extension.Paginator({
        collection: this.myImageCollectionDeleted
      });

      this.listenTo(this.myImageCollectionDeleted, "reset", function(e,z){
        _this.displayImages(_this.myImageCollectionDeleted);
      });

      this.currentCollection = this.myImageCollectionDeleted

      this.ui.gallery.html('');
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollectionDeleted);
      this.displayPaginator(this.myPaginationDeleted);
      if( this.ui.gallery.html() === '' )
      {
        this.ui.gallery.html('NO IMAGES TO DISPLAY')
      }
      //this.focusFirstImg();

    },

    roundDate: function(date, duration) {
      return moment(Math.floor((+date) / (+duration)) * (+duration));
    },

    displaySwalUnchecked: function(compteur) {
      var _this = this;
      Swal({
                  title: 'Warning validate without check ALL photos',
                  text:  +_this.nbPhotosChecked+' photos still underteminate and '+(_this.nbPhotos - (_this.nbPhotosChecked + _this.nbPhotosAccepted + _this.nbPhotosRefused) )+' not seen yet\n'+'If you continue all of this photos will be accept automatically' ,
                  type: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: 'rgb(218, 146, 15)',

                  confirmButtonText: 'Ok',

                  closeOnConfirm: true,
                },
                function() {
                  console.log("je force la validation");
                  //TODO mettre le status validated a 8 pour sauvegarder la validation de force

                }
              );
      //_this.swal({title:"warning",text:"You gonna validate without checked "+String(nbUnchecked)+" photos"},"warning");
    },

    displaySwalValidate: function(compteur){
      var _this = this;
      var text = "";
      if( _this.nbPhotosAccepted == 0 ) {
        text += _this.nbPhotosRefused+' will be refused';
      }
      else if( _this.nbPhotosRefused == 0 ) {
        text += _this.nbPhotosAccepted+' will be accepted';
      }else{
        text +=  _this.nbPhotosAccepted+' will be accepted and '+_this.nbPhotosRefused+' refused';
      }

      Swal({
                  title: 'Well done',
                  text:  'you have finish this sessions\nOn '+_this.nbPhotos+' photos '+text,
                  type: 'success',
                  showCancelButton: true,
                  confirmButtonColor: 'rgb(218, 146, 15)',

                  confirmButtonText: 'Ok',

                  closeOnConfirm: true,
                },
                function() {
                  console.log("je valide");

                }
              );
    },


    validateAll: function() {
      console.log("on veut tout valider ");
      console.log("et bim bam boom");
      console.log("toto et mario");
      var compteur = {};
      if( this.nbphotosnotchecked >0 || this.nbPhotosChecked > 0) {
        this.displaySwalUnchecked();
      }
      else {
        this.displaySwalValidate();
      }


      /*for(var i = 0 ; i < this.currentCollection.fullCollection ; i++ )
      {
        if(this.currentCollection.fullCollection.models[i].attributes.)
      }*/
    /*  compteur.total = 0
      compteur.unchecked = 0;
      compteur.total = this.myImageCollection.fullCollection.length;
      for( var model of this.myImageCollection.fullCollection.models )
      {
        if(model.attributes.validated === 0 || model.attributes.validated === null)
        {
          compteur.unchecked+=1;
        }
      }

      if( compteur.unchecked ){
        this.displaySwalUnchecked(compteur);
      }
      else {
        this.displaySwalValidate(compteur);
      }
      console.log("photo a check : "+compteur.unchecked);*/
    /*  var _this = this;
      var flagUnchecked = false
      var url = config.coreUrl+'sensors/'+this.type+'/uncheckedDatas';
      // parcours de la page
      var sizePage = this.myImageCollection.length;
      var sizeAllPages = this.myImageCollection.fullCollection.length;
      var dataToSend = [];
      var test = this.myImageCollection.toJSON()*/
      /*  for ( var i = 0 ; i < sizeAllPages ; i ++ ){
      dataToSend.push({
      id:this.myImageCollection.fullCollection.models[i].id,
      status:this.myImageCollection.fullCollection.models[i].status
    })
  };*/

/*  for ( var i = 0 ; i < sizePage && !flagUnchecked ; i ++ ){
    switch (this.myImageCollection.models[i].status) {
      case 0 : {
        break;
      }
      case 1 : {
        break;
      }
      default :{
        flagUnchecked = true;
        _this.displayListUnchecked();
        break;
      }
    }
  }
  $.ajax({
    url : url,
    method: 'POST',
    data: {data : JSON.stringify(this.myImageCollection) },
    context: this,
  })
  .done( function(response,status,jqXHR) {
  })
  .fail( function(jqXHR, textStatus, errorThrown) {

  });*/
},

/*swal: function(opt, type, callback) {
  var btnColor;
  switch (type){
    case 'success':
    btnColor = 'green';
    break;
    case 'error':
    btnColor = 'rgb(147, 14, 14)';
    break;
    case 'warning':
    btnColor = 'orange';
    break;
    default:
    return;
    break;
  }

  Swal({
    title: opt.title || opt.responseText || 'error',
    text: opt.text || '',
    type: type,
    showCancelButton: false,
    confirmButtonColor: btnColor,
    confirmButtonText: 'OK',
    closeOnConfirm: true,
  },
  function(isConfirm) {
    //could be better
    if (callback) {
      callback();
    }
  });
},*/

});
});
