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
  'ns_navbar/ns_navbar'



], function($, _, Backbone, Marionette, Swal, Translater,
 config, NsGrid, Com, NsMap, NsForm, moment, Navbar) {

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/validate/templates/tpl-camTrapValidateDetail.html',

    className: 'full-height animated white',

    events: {
      'click button#validate': 'validate',
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
    },

    regions: {
      'rgNavbar': '#navbar',
      'imageTemplate' : '#gallery'
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
      this.showDeferred = $.Deferred();
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
    initCollection: function(data) {

      var params = {
        url: config.coreUrl+'sensors/'+this.type+'/uncheckedDatas/'+this.sensorId+'/'+this.siteId+'/'+this.equipmentId  ,
        method: 'GET',
        context: this,
      };
      var deferred = $.ajax(params)
      .done( function (response) {
        //console.log("la super réponse");
        //console.log(response);
        //return response;
      })
      .fail( function(jqXHR , textStatus , errorThrown ) {
       console.log(jqXHR.status);
       console.log(errorThrown);
     });

     return deferred.promise();

    },
    displayGallery: function (){
      var _this = this;
      var ImageModel = Backbone.Model.extend({
        urlRoot: config.coreUrl+'photos',
        default:{
          path :'',
          name: '',
          id:null,
        }
      });

      var ImageCollection = Backbone.Collection.extend({
        model: ImageModel,

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

        initialize: function(){

      },
        onRender: function(){

      },
        onShow: function(){

      },

        onClickImage: function(e){
          var __self = this;
          console.log("j'ai cliker sur l'image")

          //_this.myImageCollectionView.collection.remove(this.model);
          //this.model.save();

        }
    });

      var ImageCollectionView = Marionette.CollectionView.extend({
        //tagName: 'ul',
        childView : ImageItemView,

        initialize: function(){

          },
        onRender: function(){

         },
        onShow: function(){

          }

      });


      this.initCollection()
      .then( function(response) {

      var myImageCollection = new ImageCollection(response);

      _this.myImageCollectionView = new ImageCollectionView({collection: myImageCollection});

      _this.imageTemplate.show(_this.myImageCollectionView);
    });

    },

    roundDate: function(date, duration) {
      return moment(Math.floor((+date) / (+duration)) * (+duration));
    },

    validate: function() {
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
