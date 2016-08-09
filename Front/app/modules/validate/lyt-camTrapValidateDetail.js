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
  'backbone.marionette.keyShortcuts',



], function($, _, Backbone, Marionette, Swal, Translater,
  config, NsGrid, NsMap, NsForm, moment, Navbar, PageColl, CamTrapItemView , CamTrapImageModel, ToolsBar, BckMrtKeyShortCut) {

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

      },

      events: {
        'click button#validate': 'validate',
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
      mouvement: function(e){
        if(document.activeElement.tagName !== "IMG" && ! this.lastImageActive ){
          console.log("aucune photo active on choisi la premiere");
        //  console.log(this.$el.find('.imageCamTrap img') );
          this.$el.find('.imageCamTrap img').first().focus();
          this.lastNoeudActive = this.$el.find('.imageCamTrap').first();
          this.lastImageActive = document.activeElement;
          //initialise la matrice
        }
        else{
          //on se replace sur la derniere image active
          console.log("on était sur une photo on se replace sur ");
          //console.log(this.lastImageActive);
          $(this.lastImageActive).focus();
      /*  }
        else {*/
          switch(e.keyCode)
          {
            case 38:
            {
              console.log("up");
              break;
            }
            case 40:
            {
              console.log("down");
              break;
            }
            case 37:{
            //  console.log("left");
              this.lastNoeudActive = $(this.lastNoeudActive).prev()
              if( this.lastNoeudActive.length === 0 ){ //si pas de suivant on retourne au premier
                this.$el.find('.imageCamTrap img').last().focus();
                this.lastNoeudActive = this.$el.find('.imageCamTrap').last();
                this.lastImageActive = document.activeElement;
              }
              else{
                this.lastNoeudActive.find("img").focus();
                this.lastImageActive = document.activeElement;
              }
              break;
            }
            case 39:
            {
              //console.log("right");
              this.lastNoeudActive = $(this.lastNoeudActive).next()
              if( this.lastNoeudActive.length === 0 ){ //si pas de suivant on retourne au premier
                this.$el.find('.imageCamTrap img').first().focus();
                this.lastNoeudActive = this.$el.find('.imageCamTrap').first();
                this.lastImageActive = document.activeElement;
              }
              else{
                this.lastNoeudActive.find("img").focus();
                this.lastImageActive = document.activeElement;
              }
              break;
            }
          }
        }
      },
      findInput: function(e){
        e.preventDefault(); // disable browser tab
        console.log("on va chercher input tag et on se place dedans");
        this.$el.find(".bootstrap-tagsinput  input").focus();
        //console.log(this.$el.find("#tagsInput").focus());
        //console.log();
      },
      displayAll: function (e){

        this.ui.gallery.html('');
        this.ui.paginator.html('');
        this.showImage(this.myImageCollection);
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
            _this.showImage(_this.myImageCollectionValidated);
        });

        this.ui.gallery.html('');
        this.ui.paginator.html('');
        this.showImage(this.myImageCollectionValidated);
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
            _this.showImage(_this.myImageCollectionDeleted);
        });

        this.ui.gallery.html('');
        this.ui.paginator.html('');
        this.showImage(this.myImageCollectionDeleted);
        this.displayPaginator(this.myPaginationDeleted);
        if( this.ui.gallery.html() === '' )
        {
          this.ui.gallery.html('NO IMAGES TO DISPLAY')
        }

      },
      keyAction: function (e){
        var _this = this;
          console.log("bim click sur ",e);
          console.log("elem focus:");
          console.log(document.activeElement.tagName);
          console.log(_this.myImageCollection);
          switch(e.keyCode)
          {
            case 13:{
              console.log("BIM FULLSCREEN");
              if( document.activeElement.tagName === "IMG" )
              {
                console.log(" c'est bien une image");
                console.log(_this);
              }
              break;
            }
            default:
            {
              console.log("detection touche");
              break;
            }
          }
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

        var ImageCollection = PageColl.extend({
          mode: 'client',
          state: {
            pageSize: 24
          },
          url: config.coreUrl+'sensors/'+this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId,
        });

        this.myImageCollection = new ImageCollection();

        this.myImageCollection.on("change",function(model){
          console.log("model :");
          console.log(model);
        });

        this.paginator = new Backgrid.Extension.Paginator({
          collection: this.myImageCollection
        });
        // this.validatedImg = this.myImageCollection.filter({validated : "true"})
        // this.deletedImg = this.myImageCollection.filter({validated : "false"})
        // this.toCheckImg = this.myImageCollection.filter({validated : "null"})
        // console.log("mes super filtres");
        // console.log("valide");
        // console.log(this.validatedImg);
        // console.log("suppr");
        // console.log(this.deletedImg);
        // console.log("a verif");
        // console.log(this.toCheckImg);

        this.initCollection();
      },
      initCollection : function() {
        var _this = this;
        this.myImageCollection.fetch().done(function(){
          console.log("collection fetch ok");
          _this.displayGallery(_this.myImageCollection);
          /*_this.showImage();
          _this.displayPaginator(_this.paginator);*/
        });
      },
      onRender: function() {
        this.$el.i18n();
      },

      reloadFromNavbar: function(model) {
        this.model = model;
        this.sensorId = this.model.get('fk_sensor');
        this.siteId = this.model.get('FK_MonitoredSite');
        this.equipmentId = this.model.get('equipID');

        this.display();
      },

      onShow: function() {
        var _this = this;
        this.rgNavbar.show(this.navbar);
        this.display();
        this.listenTo(this.myImageCollection, "reset", function(e,z){
            _this.showImage(_this.myImageCollection);
        });

      },

      setTotal: function(){
        this.ui.totalS.html(this.grid.grid.getSelectedModels().length);
        this.ui.total.html(this.grid.grid.collection.length);
      },

      display: function() {
        this.displaySensorForm();
        this.displaySiteForm();
        this.displayGallery(this.myImageCollection);
        this.displayPaginator(this.paginator)
        this.displayToolsBar();
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

      displayGallery: function (myCollectionToDisplay){
        this.showImage(myCollectionToDisplay);
          //var images = new ImageView ({ collection : myImageCollection});
    /*    var _this = this;
        this.myImageCollection.fetch().done(function(){
          _this.showImage();
          //_this.displayPaginator(_this.paginator);
        });*/

      },
      showImage: function(myCollectionToDisplay){
        var _this = this;

        var ImageModel = new CamTrapImageModel();

        this.ui.gallery.html('');

        myCollectionToDisplay.each(function(model){
          var newImg = new CamTrapItemView({
            model: model,
            parent: _this,
          });
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
        /*var resultat = this.toolsBar.render().el;

        this.ui.paginator.append(resultat);*/
      },

      roundDate: function(date, duration) {
        return moment(Math.floor((+date) / (+duration)) * (+duration));
      },

      keyPressed: function(e){
        console.log("yeahhhh yeaahh yeaahh "+e.keyCode);
      },

      displayListUnchecked: function() {
        var _this = this;
        console.log("et bim on displayListUnchecked");
        _this.swal({title:"warning",text:"Some photos not checked"},"warning");
      },


      validate: function() {
       //  console.log("pagination");
        //console.log(this.paginator);
        var _this = this;
        var flagUnchecked = false
        //console.log("le type ",this.type);
        var url = config.coreUrl+'sensors/'+this.type+'/uncheckedDatas';
        console.log("call sur ",url);
        // parcours de la page
        var sizePage = this.myImageCollection.length;
        var sizeAllPages = this.myImageCollection.fullCollection.length;
        var dataToSend = [];
        console.log("ma page");
        console.log(this.myImageCollection);
        console.log("ma full collection");
        console.log(this.myImageCollection.fullCollection);
        console.log("######################################");
        console.log("test collection model json");
        var test = this.myImageCollection.toJSON()
        console.log(test);
        /*  for ( var i = 0 ; i < sizeAllPages ; i ++ ){
          console.log(this.myImageCollection.fullCollection.get(i));
          //console.log(this.myImageCollection.fullCollection.models[i]);
          dataToSend.push({
            id:this.myImageCollection.fullCollection.models[i].id,
            status:this.myImageCollection.fullCollection.models[i].status
          })
        };*/


        for ( var i = 0 ; i < sizePage && !flagUnchecked ; i ++ ){
          switch (this.myImageCollection.models[i].status) {
            case 0 : {
              console.log("DELETE pk_id: "+this.myImageCollection.models[i].id+" url:"+this.myImageCollection.models[i].path );
              break;
            }
            case 1 : {
              console.log("SAVE pk_id:"+this.myImageCollection.models[i].id+" url:"+this.myImageCollection.models[i].path);
              break;
            }
            default :{
              console.log("N/A pk_id:"+this.myImageCollection.models[i].id+" url:"+this.myImageCollection.models[i].path);
              flagUnchecked = true;
              _this.displayListUnchecked();
              break;
            }
          }
        }

        console.log(dataToSend);

          $.ajax({
            url : url,
            method: 'POST',
            data: {data : JSON.stringify(this.myImageCollection) },
            context: this,
          })
          .done( function(response,status,jqXHR) {
            console.log(jqXHR);
          })
          .fail( function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);

          });
      },

        /*this.myImageCollection.each(function (model) {
          }
          //console.log(model);
        });*/
        /*
        var _this = this;
        var url = config.coreUrl + 'sensors/' + this.type      +
        '/uncheckedDatas/' + this.indId + '/' + this.pttId;
        var mds = this.grid.grid.getSelectedModels();

        console.log(mds.length);
        if (!mds.length) {
        return;
      }
      var col = new Backbone.Collection(mds);
      var params = col.pluck('PK_id');
      $.ajax({
      url: url,
      method: 'POST',
      data: {data: JSON.stringify(params)},
      context: this,
    }).done(function(resp) {
    if (resp.errors) {
    resp.title = 'An error occured';
    resp.type = 'error';
  }else {
  resp.title = 'Success';
  resp.type = 'success';
}

var callback = function() {
_this.navbar.navigateNext();
//loose the focus due to re-fetch
_this.globalGrid.fetchCollection();
};
resp.text = 'existing: ' + resp.existing + ', inserted: ' + resp.inserted + ', errors:' + resp.errors;
this.swal(resp, resp.type, callback);
}).fail(function(resp) {
this.swal(resp, 'error');
});*/
//},

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
