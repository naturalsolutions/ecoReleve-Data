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
        //'space': 'displayModal',
        'backspace' : 'toggleModelStatus',

      },

      events: {
        'click button#validate': 'validate',
        //'click img':'onClickImage',
      //  'onkeydown #gallery' : 'keyPressed',
      //  'pageable:state:change': 'toto',
        'click button#displayAll': 'displayAll',
        'click button#displayDeleted': 'displayDeleted',
        'click button#displayValidated': 'displayValidated',
        'click button#displayTags': 'displayTags',
        'keydown document': 'keyAction'
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
      toggleModelStatus: function(e){
        e.preventDefault();
      },
      displayModal: function(e){
        e.preventDefault();
      },
      mouvement: function(e){
        if(document.activeElement.tagName !== "IMG" && ! this.lastImageActive ){
          this.$el.find('.imageCamTrap img').first().focus();
          this.lastNoeudActive = this.$el.find('.imageCamTrap').first();
          this.lastImageActive = document.activeElement;
        }
        else{

          switch(e.keyCode)
          {
            case 38:
            {
              console.log("haut");
              var i = 0;
                var position = this.myImageCollection.indexOf(this.currentViewImg.model);
                if( (position - 6 ) > 0  ){
                  this.currentViewImg = this.tabView[position-6]; // on se deplace de - 1
                  this.rgModal.currentView.changeImage(this.currentViewImg.model);
                }

                console.log("youhouu je suis position " +position );
                //this.lastNoeudActive = $(this.lastNoeudActive).prev();
              break;
            }
            case 40:
            {
              var position = this.myImageCollection.indexOf(this.currentViewImg.model);
              if( (position + 6 ) < this.tabView.length - 1  ){
                this.currentViewImg = this.tabView[position+6]; // on se deplace de - 1
                this.rgModal.currentView.changeImage(this.currentViewImg.model);
              }
              console.log("youhouu je suis position " +position );
              console.log("bas");

              break;
            }
            //left
            case 37:{
            this.toolsBar.testBim("left");
              this.lastNoeudActive = $(this.lastNoeudActive).prev()
              if( this.lastNoeudActive.length === 0 ){ //si pas de suivant on retourne au premier
                this.$el.find('.imageCamTrap img').first().focus();
                this.lastNoeudActive = this.$el.find('.imageCamTrap').first();
                this.lastImageActive = document.activeElement;
              }
              else{
                this.lastNoeudActive.find("img").focus();
                this.lastImageActive = document.activeElement;
              }
              this.prevImage();
              break;
            }
            //right
            case 39:
            {
              this.toolsBar.testBim("right");
              this.lastNoeudActive = $(this.lastNoeudActive).next()

              if( this.lastNoeudActive.length === 0 ){ //si pas de suivant on retourne au premier
                this.$el.find('.imageCamTrap img').last().focus();
                this.lastNoeudActive = this.$el.find('.imageCamTrap').last();
                this.lastImageActive = document.activeElement;
              }
              else{
                this.lastNoeudActive.find("img").focus();
                this.lastImageActive = document.activeElement;
              }
              this.nextImage();
              break;
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



      initialize: function(options) {
        this.translater = Translater.getTranslater();
        this.type = options.type;
        this.model = options.model;
        this.lastImageActive = null;

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
        this.toolsBar = new ToolsBar();
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
