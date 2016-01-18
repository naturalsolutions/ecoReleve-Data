define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'radio',

  'moment',
  'dateTimePicker',
  'sweetAlert',
  'config',

  'ns_form/NSFormsModuleGit',

  'ns_map/ns_map',

  'i18n'

], function($, _, Backbone, Marionette, Radio,

  moment, datetime, Swal, config, NsForm, NsMap
) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height white',

    template: 'app/modules/stations/templates/tpl-station-new.html',
    events: {
      'focusout input[name="Dat e_"]': 'checkDate',
      'change input[name="LAT"], input[name="LON"]': 'getLatLng',
      'click #getCurrentPosition': 'getCurrentPosition',
      'click .tab-link': 'displayTab',
      'change select[name="FieldWorker"]': 'checkUsers',
      'click button#save': 'save'
    },

    name: 'Station creation',

    ui: {
      'staForm': '#staForm',
      'saveBtn': 'button#save'
    },

    initialize: function(options) {
      this.from = options.from;
    },

    onShow: function() {
      this.refrechView('#stWithCoords');
      this.map = new NsMap({
        popup: true,
        zoom: 2,
        element: 'map',
      });
    },

    onDestroy: function() {
      this.map.destroy();
      this.nsForm.destroy();
    },

    getCurrentPosition: function() {
      var _this = this;
      if (navigator.geolocation) {
        var loc = navigator.geolocation.getCurrentPosition(function(position) {
          var lat = parseFloat((position.coords.latitude).toFixed(5));
          var lon = parseFloat((position.coords.longitude).toFixed(5));
          _this.updateMarkerPos(lat, lon);
          _this.$el.find('input[name="LAT"]').val(lat).change();
          _this.$el.find('input[name="LON"]').val(lon).change();
        });
      } else {
        Swal({
          title: 'The browser dont support geolocalization API',
          text: '',
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: 'rgb(147, 14, 14)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        });
      }
    },

    getLatLng: function() {
      var lat = this.$el.find('input[name="LAT"]').val();
      var lon = this.$el.find('input[name="LON"]').val();
      this.updateMarkerPos(lat, lon);
    },

    updateMarkerPos: function(lat, lon) {
      if (lat && lon) {
        this.map.addMarker(null, lat, lon);
      }
    },

    checkUsers: function(e) {
      var usersFields = $('select[name="FieldWorker"]');
      var selectedUser = $(e.target).val();
      var exists = 0;
      $('select[name="FieldWorker"]').each(function() {
        var user = $(this).val();
        if (user == selectedUser) {
          exists += 1;
        }
      });
      if (exists > 1) {
        Swal({
          title: 'Fieldworker name error',
          text: 'Already selected ! ',
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: 'rgb(147, 14, 14)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        },
        function(isConfirm) {
          $(e.target).val('');
        });
      }
    },

    displayTab: function(e) {
      e.preventDefault();
      var ele = $(e.target);
      var tabLink = $(ele).attr('href');
      $('.tab-ele').removeClass('active');
      $(ele).parent().addClass('active');
      $(tabLink).addClass('active in');
      this.refrechView(tabLink);
    },

    refrechView: function(stationType) {
      var stTypeId;
      var _this = this;
      switch (stationType){
        case '#stWithCoords':
          stTypeId = 1;
          $('#getCurrentPosition').removeClass('hidden');
          break;
        case '#stWithoutCoords':
          stTypeId = 3;
          $('#getCurrentPosition').addClass('hidden');
          break;
        default:
          break;
      }

      if (this.nsForm) {
        this.nsForm.destroy();
      }

      this.ui.staForm.empty();

      this.nsForm = new NsForm({
        name: 'StaForm',
        modelurl: config.coreUrl + 'stations/',
        buttonRegion: [],
        formRegion: this.ui.staForm,
        displayMode: 'edit',
        objectType: stTypeId,
        id: 0,
        afterShow: function() {
          if(_this.from == 'release'){
            _this.$el.find('[name="fieldActivityId"]').val('1').change();
          }
          _this.$el.find('[name="FK_MonitoredSite"]').on('change', function() {
            var msId = $(this).val();
            _this.getCoordFromMs(msId);
          });
          /*$(".datetime").attr('placeholder','DD/MM/YYYY'); 

          $("#dateTimePicker").on("dp.change", function (e) {
            $('#dateTimePicker').data("DateTimePicker").format('DD/MM/YYYY').maxDate(new Date());
           });*/
        }
      });

      this.nsForm.savingSuccess =  function(model, resp) {
        _this.afterSave(model, resp);
      };

      this.rdy = this.nsForm.jqxhr;
    },

    getCoordFromMs: function(msId) {
      var _this = this;
      var url = config.coreUrl + 'monitoredSites/' + msId  + '/history/?geo=true';

      $.ajax({
        context: this,
        url: url,
      }).done(function(data) {
        var coords = data.features[0].geometry.coordinates;
        _this.$el.find('input[name="LAT"]').val(coords[0]).change();
        _this.$el.find('input[name="LON"]').val(coords[1]).change();
      }).fail(function() {
        console.error('an error occured');
      });
    },

    afterSave: function(model, resp) {
      var id = model.get('ID');
      if(this.from == 'release'){
        Backbone.history.navigate('#release/' + id, {trigger: true});
        return;
      }else{
        Backbone.history.navigate('#stations/' + id, {trigger: true});
      }
    },

    save: function() {
      this.nsForm.butClickSave();
    },

  });
});
