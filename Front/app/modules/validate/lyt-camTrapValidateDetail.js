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
  'ns_modules/ns_com',
  'ns_map/ns_map',
  'ns_form/NSFormsModuleGit',
  'moment',
  'ns_navbar/ns_navbar',
  'backbone.paginator',
  'backgrid.paginator',



], function($, _, Backbone, Marionette, Swal, Translater,
  config, NsGrid, Com, NsMap, NsForm, moment, Navbar, PageColl, Paginator) {

    'use strict';

    return Marionette.LayoutView.extend({
      template: 'app/modules/validate/templates/tpl-camTrapValidateDetail.html',

      className: 'full-height animated white',

      events: {
        'click button#validate': 'validate',
        'onkeydown #gallery' : 'keyPressed',
        'pageable:state:change': 'toto'
      },

      ui: {
        'grid': '#grid',
        'totalEntries': '#totalEntries',
        'gallery': '#gallery',
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
        'imageTemplate' : '#gallery'
      },
      toto: function(e){
        console.log(this.myImageCollection)
      },
      initialize: function(options) {
        console.log("on a lancé la vue pour les camtrap ");
        this.translater = Translater.getTranslater();
        this.type = options.type;
        console.log('details/cam',options)
        this.com = new Com();
        this.model = options.model;


        this.sensorId = this.model.get('fk_sensor');
        this.siteId = this.model.get('FK_MonitoredSite');
        this.equipmentId = this.model.get('equipID');

        this.navbar = new Navbar({
          parent: this,
          globalGrid: options.globalGrid,
          model: this.model,
        });
        //this.initCollection();
        this.globalGrid = options.globalGrid;
        //this.showDeferred = $.Deferred();

        var ImageCollection = PageColl.extend({
          mode: 'client',
          state: {
            pageSize: 24
          },
          url: config.coreUrl+'sensors/'+this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId
        });
        this.myImageCollection = new ImageCollection();
      },

      onRender: function() {
        this.$el.i18n();
      },

      reloadFromNavbar: function(model) {
        this.model = model;
        this.sensorId = this.model.get('fk_sensor');
        this.siteId = this.model.get('FK_MonitoredSite');
        this.equipmentId = this.model.get('equipID');

        this.com = new Com();
        this.display();
      },

      onShow: function() {
        var _this = this;
        this.rgNavbar.show(this.navbar);
        this.display();
        this.listenTo(this.myImageCollection, "reset", function(e,z){
            _this.showImage();
        });
        this.com.onAction = function() {
          // _this.setTotal();
        };
      },

      setTotal: function(){
        this.ui.totalS.html(this.grid.grid.getSelectedModels().length);
        this.ui.total.html(this.grid.grid.collection.length);
      },

      display: function() {
        var _this = this;
        this.displaySensorForm();
        this.displaySiteForm();
        this.displayGallery();
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

      displayGallery: function (){
          //var images = new ImageView ({ collection : myImageCollection});
        var _this = this;
        this.myImageCollection.fetch().done(function(){
          _this.showImage();
          _this.displayPaginator();
        });

      },
      showImage: function(){
        var _this = this;
        var ImageModel = Backbone.Model.extend({
          urlRoot: config.coreUrl+'photos',
          default:{
            path :'',
            name: '',
            id:null,
            status: -1
          }
        });

        var ImageItemView = Marionette.ItemView.extend({
          model: ImageModel,
          events:{
            'click #save':'onClickImage'
          },
          //tagName : 'li',
          //template : 'app/modules/validate/templates/tpl-image.html',
          template : 'app/modules/validate/templates/tpl-image.html',
          //template : $('#itemview-image-template').html(),

          onClickImage: function(e){
            var _this = this;
            console.log('click image',this.model.id)
            // status -1 undefined , 0 delete , 1 save
            this.model.status = 0;
            //_this.myImageCollectionView.collection.remove(this.model);
            //this.model.save();

          }
        });

        this.ui.gallery.html('');
          this.myImageCollection.each(function(model){
            var newImg = new ImageItemView({model:model});
            _this.ui.gallery.append(newImg.render().el);

          });
      },

      displayPaginator: function () {

        this.paginator = new Backgrid.Extension.Paginator({
          collection: this.myImageCollection
        });
        var resultat = this.paginator.render().el;

      this.ui.paginator.append(resultat);
      },

      roundDate: function(date, duration) {
        return moment(Math.floor((+date) / (+duration)) * (+duration));
      },

      keyPressed: function(e){
        console.log("yeahhhh yeaahh yeaahh "+e.keyCode);
      },

      validate: function() {
        console.log("bim on valide");
        console.log("parcours de la collection");
        this.myImageCollectionView.collection.each(function (model) {
          switch (model.status) {
            case 0 : {
              console.log("DELETE :"+model.id+" url:"+model.path );
              break;
            }
            case 1 : {
              console.log("SAVE   :"+model.id+" url:"+model.path);
              break;
            }
            default :{
              console.log("N/A    :"+model.id+" url:"+model.path);
              break;
            }
          }
          //console.log(model);
        });
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
