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



], function($, _, Backbone, Marionette, Swal, Translater,
  config, NsGrid, NsMap, NsForm, moment, Navbar, PageColl,
  CamTrapItemView , CamTrapImageModel, ToolsBar, ModalView, BckMrtKeyShortCut

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
      'esc' : 'leaveModal'

    },

    events: {
      'click button#validate': 'validate',
      //'click img':'onClickImage',
      //  'onkeydown #gallery' : 'keyPressed',
      //'pageable:state:change': function(){console.log("on a changé de page");},
      'click button#displayAll': 'displayAll',
      'click button#displayDeleted': 'displayDeleted',
      'click button#displayValidated': 'displayValidated',
      'click button#displayTags': 'displayTags',
      'click button#refusedBtn': 'rejectPhoto',
      'click button#upStarsBtn': 'increaseStars',
      'click button#downStarsBtn': 'decreaseStars',
      'click button#acceptedBtn': 'acceptPhoto',
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

      'totalS' : '#totalS',
      'total' : '#total',
      'paginator':'#paginator'

    },

    regions: {
      'rgNavbar': '#navbar',
      'rgGallery' : '#gallery',
      'rgModal': '#rgModal',
      'rgToolsBar' :'#rgToolsBar'
    },
    acceptPhoto : function(e){
      if(this.currentPosition !== null )
      {
        console.log("on toggle "+ this.currentPosition);
        this.tabView[this.currentPosition].setModelValidated(true);
      }
      else{
        console.log("on est sur aucune photo");
      }
    },

    rejectPhoto : function(e){
      if(this.currentPosition !== null )
      {
        console.log("on toggle "+ this.currentPosition);
        this.tabView[this.currentPosition].setModelValidated(false);
      }
      else{
        console.log("on est sur aucune photo");
      }
    },

    toggleModelStatus: function(e){
      e.preventDefault();
      console.log("on veut toggle");
      if(this.currentPosition !== null )
      {
        console.log("on toggle "+ this.currentPosition);
        this.tabView[this.currentPosition].toggleModelStatus();
      }
      else{
        console.log("on est sur aucune photo");
      }
    },
    leaveModal: function(e){
      if(this.rgModal.currentView !== undefined) {
        this.rgModal.currentView.hide();
      }
    },
    displayModal: function(e){
      e.preventDefault();
      /*if(this.currentPosition !== null && this.rgModal.currentView !== undefined)
      this.tabView[this.currentPosition].onClickImage();*/
      if(this.currentPosition !== null ) { //il faut un focus

        if(this.rgModal.currentView === undefined) {
          console.log("creation modal");
          this.rgModal.show( new ModalView({ model : this.tabView[this.currentPosition].model}))
        }
        else {
          console.log("reutilisation modal");
          this.rgModal.currentView.changeImage(this.tabView[this.currentPosition].model);
          this.rgModal.currentView.onShow();
        }
      }
    },
    mouvement: function(e){
      console.log("en entrant");
      console.log("position " + this.currentPosition);

      if( this.currentPosition === null) {
        console.log("pas de position");
        this.tabView[0].$el.find('img').focus();
        this.currentPosition = 0;
      }
      else{
        var lastPosition = this.currentPosition;

        switch(e.keyCode)
        {
          case 38:// up
          {
            if ( this.currentPosition - 6 >= 0){
              this.currentPosition-=6;
            }
            break;
          }
          case 40://down
          {
            if ( this.currentPosition + 6 <= this.tabView.length - 1 ){
              this.currentPosition+=6;
            }
            break;
          }
          case 37:{ //left
            if ( this.currentPosition - 1 >= 0 ){
              this.currentPosition-=1;
            }
            break;
          }
          //right
          case 39://right
          {
            if ( this.currentPosition + 1 <= this.tabView.length - 1 ){
              this.currentPosition+=1;
            }
            break;
          }
        }

        if (lastPosition !== this.currentPosition) {
          console.log(lastPosition+" != "+this.currentPosition);
          this.tabView[this.currentPosition].$el.find('img').focus();
          console.log(this.tabView[this.currentPosition].getModelTags());
          if( this.rgModal.currentView !== undefined){
            this.rgModal.currentView.changeImage(this.tabView[this.currentPosition].model);
          }
        }
        else {
          console.log(lastPosition+" == "+this.currentPosition);
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
      console.log("chaine :" +tabTagsTmp);
      if( tabTagsTmp !== null )
      {
        tabTagsTmp = tabTagsTmp.split(","); //charge les nouveaux
        console.log("tableau :" +tabTagsTmp);
        for(var i = 0 ; i < tabTagsTmp.length ; i++ )
        {
          this.toolsBar.addTag(tabTagsTmp[i]);
        }
      }


    },



    initialize: function(options) {
      this.translater = Translater.getTranslater();
      this.type = options.type;
      this.model = options.model;
      this.lastImageActive = null;
      this.currentViewImg = null;
      this.currentPosition = null;

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
        mode: 'client',
        state: {
          pageSize: 24
        },
        url: config.coreUrl+'sensors/' + this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId,
      });

      this.myImageCollection = new ImageCollection();


      this.paginator = new Backgrid.Extension.Paginator({
        collection: this.myImageCollection
      });
      this.myImageCollection.fetch();

      /*console.log(this.myImageCollection);
      console.log(this.paginator);*/

      this.paginator.collection.on('reset', function(e){
        console.log("jai change de page");
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

    reloadFromNavbar: function(model) {
      this.model = model;
      this.sensorId = this.model.get('fk_sensor');
      this.siteId = this.model.get('FK_MonitoredSite');
      this.equipmentId = this.model.get('equipID');

      this.initCollection();

      this.display();
    },

    display: function() {
      var _this = this;
      this.listenTo(this.myImageCollection, 'reset', function(e){
        _this.displayImages(_this.myImageCollection);
      });

      this.displaySensorForm();
      this.displaySiteForm();
      this.displayPaginator(this.paginator)
      this.displayToolsBar();
    },


    setTotal: function(){
      this.ui.totalS.html(this.grid.grid.getSelectedModels().length);
      this.ui.total.html(this.grid.grid.collection.length);
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

    displayImages: function(myCollectionToDisplay){
      var _this = this;

      var ImageModel = new CamTrapImageModel();

      this.ui.gallery.html('');
      this.tabView = [];
      myCollectionToDisplay.each(function(model){
        var newImg = new CamTrapItemView({
          model: model,
          parent: _this,
        });
        _this.tabView.push(newImg);
        _this.ui.gallery.append(newImg.render().el);

      });

    },

    displayPaginator: function (pagin) {
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

    displayAll: function (e){
      this.ui.gallery.html('');
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollection);
      this.displayPaginator(this.paginator);

    },

    displayValidated: function (e){
      var _this = this ;

      var filterModel = this.myImageCollection.fullCollection.where({validated:true});

      var paginationFiltered = PageColl.extend({
        mode: 'client',
        state: {
          pageSize: 24
        }
      });



      this.myImageCollectionValidated = new paginationFiltered(filterModel)
      this.myPaginationValidated = new Backgrid.Extension.Paginator({
        collection: this.myImageCollectionValidated
      });

      this.listenTo(this.myImageCollectionValidated, "reset", function(e,z){
        _this.displayImages(_this.myImageCollectionValidated);
      });

      this.ui.gallery.html('');
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollectionValidated);
      this.displayPaginator(this.myPaginationValidated);
      if( this.ui.gallery.html() === '' )
      {
        this.ui.gallery.html('NO IMAGES TO DISPLAY')
      }

    },

    displayDeleted: function (e){
      var _this = this ;

      var filterModel = this.myImageCollection.fullCollection.where({validated:false});

      var paginationFiltered = PageColl.extend({
        mode: 'client',
        state: {
          pageSize: 24
        }
      });

      this.myImageCollectionDeleted = new paginationFiltered(filterModel)
      this.myPaginationDeleted = new Backgrid.Extension.Paginator({
        collection: this.myImageCollectionDeleted
      });

      this.listenTo(this.myImageCollectionDeleted, "reset", function(e,z){
        _this.displayImages(_this.myImageCollectionDeleted);
      });

      this.ui.gallery.html('');
      this.ui.paginator.html('');
      this.displayImages(this.myImageCollectionDeleted);
      this.displayPaginator(this.myPaginationDeleted);
      if( this.ui.gallery.html() === '' )
      {
        this.ui.gallery.html('NO IMAGES TO DISPLAY')
      }

    },

    roundDate: function(date, duration) {
      return moment(Math.floor((+date) / (+duration)) * (+duration));
    },

    keyPressed: function(e){
    },

    displayListUnchecked: function() {
      var _this = this;
      _this.swal({title:"warning",text:"Some photos not checked"},"warning");
    },

    validate: function() {
      var _this = this;
      var flagUnchecked = false
      var url = config.coreUrl+'sensors/'+this.type+'/uncheckedDatas';
      // parcours de la page
      var sizePage = this.myImageCollection.length;
      var sizeAllPages = this.myImageCollection.fullCollection.length;
      var dataToSend = [];
      var test = this.myImageCollection.toJSON()
      /*  for ( var i = 0 ; i < sizeAllPages ; i ++ ){
      dataToSend.push({
      id:this.myImageCollection.fullCollection.models[i].id,
      status:this.myImageCollection.fullCollection.models[i].status
    })
  };*/

  for ( var i = 0 ; i < sizePage && !flagUnchecked ; i ++ ){
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

  });
},

swal: function(opt, type, callback) {
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
},

});
});
