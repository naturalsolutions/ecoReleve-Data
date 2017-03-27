define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',

  'moment',
  'dateTimePicker',
  'sweetAlert',

  'ns_form/NSFormsModuleGit',
  'ns_map/ns_map',

  'i18n'

], function(
  $, _, Backbone, Marionette,
  moment, datetime, Swal,
  NsForm, NsMap
){

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/stations.new.tpl.html',
    className: 'full-height white',

    events: {
      'click .js-btn-current-position': 'getCurrentPosition',
      'click .js-btn-save': 'save',

      'focusout input[name="Dat e_"]': 'checkDate',
      'change input[name="LAT"], input[name="LON"]': 'getLatLng',
      'click .tab-link': 'displayTab',
      'change select[name="FieldWorker"]': 'checkUsers',
    },

    name: 'Station creation',

    ui: {
      'staForm': '.js-form',
    },

    initialize: function(options) {
      this.from = options.from;
      this.histoMonitoredSite = {};
    },

    onShow: function() {
      this.refrechView('#stWithCoords');
      this.map = new NsMap({
        popup: true,
        zoom: 2,
        element: 'map',
      });
      this.$el.i18n();
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
      var _this = this;
      e.preventDefault();
      window.checkExitForm(function(){
        _this.swithTab(e);
      });

     },
     swithTab : function(e){
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
          $('.js-get-current-position').removeClass('hidden');
          break;
        case '#stWithoutCoords':
          stTypeId = 3;
          $('.js-get-current-position').addClass('hidden');
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
        modelurl: 'stations/',
        buttonRegion: [],
        formRegion: this.ui.staForm,
        displayMode: 'edit',
        objectType: stTypeId,
        id: 0,
        afterShow: function() {
          if(_this.from == 'release'){
            _this.$el.find('[name="fieldActivityId"]').val('1').change();
          }
        }
      });

      this.nsForm.savingSuccess =  function(model, resp) {
        _this.afterSave(model, resp);
      };

      this.nsForm.savingError = function (response) {
        var msg = 'An error occured, please contact an admninstrator';
        var type_ = 'error';
        var title = 'Error saving';
        if (response.status == 510) {
          msg = 'A station already exists with these parameters';
          type_ = 'warning';
          title = 'Error saving';
        }

        Swal({
          title: title,
          text: msg,
          type: type_,
          showCancelButton: false,
          confirmButtonColor: 'rgb(147, 14, 14)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        });
      };
      this.rdy = this.nsForm.jqxhr;
    },

    getCoordFromMs: function(msId) {
      var _this = this;
      var url = 'monitoredSites/' + msId;

      $.ajax({
        context: this,
        url: url,
      }).done(function(data) {
        var lat = data['LAT'];
        var lon = data['LON'];

        _this.histoMonitoredSite = data;
        _this.histoMonitoredSite.error = false;

        $.ajax({
          context: this,
          url: 'monitoredSites/'+_this.histoMonitoredSite.FK_MonitoredSite+'/history/',
        }).done(function(data) {
          _this.histoMonitoredSite.veryFirstDate = new moment().valueOf();
          _this.histoMonitoredSite.veryLastDate = new moment('00/00/0000 00:00:00','DD/MM/YYYY HH:mm:ss').valueOf();
          var tmpDate = null;
          for( var i = 0 ; i < data[1].length ; i++ ) {
            tmpDate = new moment(data[1][i].StartDate , 'DD/MM/YYYY HH:mm:ss');
            if( _this.histoMonitoredSite.veryFirstDate >= tmpDate.valueOf() ) {
              _this.histoMonitoredSite.veryFirstDate = tmpDate.valueOf();
            }
            if ( _this.histoMonitoredSite.veryLastDate <= tmpDate.valueOf() ) {
              _this.histoMonitoredSite.veryLastDate = tmpDate.valueOf();
            }
          }

          _this.$el.find('input[name="LAT"]').val(_this.histoMonitoredSite.LAT).change();
          _this.$el.find('input[name="LON"]').val(_this.histoMonitoredSite.LON).change();
        }).fail(function() {
          console.error('an error occured');
          _this.histoMonitoredSite.error = true;
        });

      }).fail(function() {
        console.error('an error occured');
        _this.histoMonitoredSite.error = true;
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
      var _this = this;
      var tmpValues = this.nsForm.BBForm.getValue();

         if( !this.histoMonitoredSite.error &&  moment(tmpValues.StationDate).valueOf() < moment(this.histoMonitoredSite.startDate).valueOf() ) {
           Swal({
             title: 'Careful, there is no coordinate for this monitored site at this date',
             text: 'The creationdate of this monitored site\'s coordinates will be modified. Do you want to proceed?',
             type: 'warning',
             showCancelButton: true,
             confirmButtonColor: 'rgb(147, 14, 14)',
             confirmButtonText: 'OK',
             closeOnConfirm: true,
           },
           function(isConfirm) {
             if( isConfirm ) { //update startdate monitored site
               var data = {
               'LAT': tmpValues.LAT,
               'LON': tmpValues.LON,
               'StartDate': tmpValues.StationDate,
               'ELE': tmpValues.ELE,
               'Precision': tmpValues.precision,
               'Comments': tmpValues.Comments,
               'FK_MonitoredSite': tmpValues.FK_MonitoredSite
             }
               tmpValues.StartDate = tmpValues.StationDate;
               $.ajax({
                 context: _this,
                 url: 'monitoredSites/'+_this.histoMonitoredSite.FK_MonitoredSite+'/history/',
                 data: JSON.stringify(data),
                 dataType: "json",
                 type: "POST",
                 contentType: "application/json; charset=utf-8",
                 success: function (data) {
                    _this.nsForm.butClickSave();
                 },
                 error: function (data) {
                  console.error('an error occured');
                 }
               });
             }
             else {//remove MonitoredSite's stations
               _this.$el.find('input[name="FK_MonitoredSite"]').val("").change();
               _this.nsForm.butClickSave();
             }
           });
         }
         else {
           this.nsForm.butClickSave();
         }
    }

  });
});
