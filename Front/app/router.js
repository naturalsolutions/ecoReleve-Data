
define(['jquery', 'marionette', 'backbone', 'config', 'sweetAlert', 'controller'],
  function($, Marionette, Backbone, config,Swal) {

  'use strict';
  return Marionette.AppRouter.extend({
    history: [],
    initialize: function(opt) {
      this.collection = new Backbone.Collection([
      {label: 'Manual import', href: 'importFile', icon: 'reneco-import'},
      {label: 'New', href: 'stations/new', icon: 'reneco-entrykey'},
      {label: 'Release', href: 'release', icon: 'reneco-to_release'},
      {label: 'Validate', href: 'validate', icon: 'reneco-validate'},
      {label: 'Stations', href: 'stations', icon: 'reneco-stations'},
	  {label: 'Observations', href: 'observations', icon: 'reneco-stations'},
      {label: 'Individuals', href: 'individuals', icon: 'reneco-individuals'},
      {label: 'Sensors', href: 'sensors', icon: 'reneco-sensors'},
      {label: 'Monitored Sites', href: 'monitoredSites', icon: 'reneco-sensors'},
      {label: 'Export', href: 'export', icon: 'reneco-export'},
      ]);
    },

    appRoutes: {
      'export(/)': 'export',

      'importFile(/)': 'importFile',

      'individuals/new(/)': 'newIndividual',
      'individuals/:id(/)': 'individuals',
      'individuals(/)': 'individuals',

      'stations/new/:from(/)': 'newStation',
      'stations/new(/)': 'newStation',
      'stations/:id(/)': 'stations',
      'stations(/)': 'stations',

	  'observations/:id(/)': 'observations',

      'sensors/new/:type(/)': 'newSensor',
      'sensors/:id(/)': 'sensors',
      'sensors(/)': 'sensors',

      'monitoredSites/new(/)': 'newMonitoredSite',
      'monitoredSites/:id(/)': 'monitoredSites',
      'monitoredSites(/)': 'monitoredSites',

      'validate/:type(/)': 'validateType',
      'validate(/)': 'validate',

      'release/:id(/)': 'release',
      'release(/)': 'release',

      '*route(/:page)': 'home',
    },

    execute: function(callback, args) {
      // for demo, user language is stored in database, we need to be sure that user is logged to send ajax query to get it,
      // --> global var to have information ( see lyt-header.js to undersand )
      window.app.logged = false;
      $.ajax({
        context: this,
        url: config.coreUrl + 'security/has_access',
        success : function(){
           window.app.logged = true;
        }
      });
      // get current route
      var route = Backbone.history.fragment;

      if ((route != '') && (route != '#')){
        var allowed = this.checkRoute();
        if(!allowed) {
            return false;
        }
      }
      this.history.push(Backbone.history.fragment);
      var _this= this;
      window.checkExitForm(function(){
        _this.continueNav(callback, args);
      },function(){
        _this.previous();
      });
    },
    onRoute: function(url, patern, params) {
      var notAllowed = window.notAllowedUrl ;
      patern = patern.replace(/\(/g, '');
      patern = patern.replace(/\)/g, '');
      patern = patern.replace(/\:/g, '');
      patern = patern.split('/');

      for (var i=0; i< notAllowed.length;i++){
            if (notAllowed[i] == patern[0]) {
                return ;
            }
      }

      if (patern[0] == '*route') {
        $('#arial').html('');
        $('#arialSub').html('');
      }else {
        this.setNav(patern);
      }
    },
    previous: function() {
        var href = this.history[this.history.length-2];
        var url = '#'+ href;
        Backbone.history.navigate(url,{trigger:false, replace: false});
        this.history.pop();
        var patern = href.split('/');
        this.setNav(patern);
    },
    continueNav : function(callback, args){
        $.ajax({
          context: this,
          url: config.coreUrl + 'security/has_access'
        }).done(function() {
          $.xhrPool.abortAll();
          callback.apply(this, args);
        }).fail(function(msg) {
          if (msg.status === 403) {
            document.location.href = config.portalUrl;
          }
        });
    },
    unique : function(list) {
        var result = [];
        $.each(list, function(i, e) {
            if ($.inArray(e, result) == -1) result.push(e);
        });
        return result;
    },
    setNav : function(patern){

        var url = patern[0];

        var md = this.collection.findWhere({href: patern[0]});
        $('#arial').html('<a href="#' + md.get('href') + '">| &nbsp; ' + md.get('label') + '</a>');
        if (patern[1] && patern[1] != 'id' && patern[1] != 'type') {
          $('#arialSub').html('<a href="#' + patern[0] + '/' + patern[1] + '">| &nbsp;' + patern[1] + '</a>');
        }else {
          $('#arialSub').html('');
        }
     },
     checkRoute : function(){
        var route = Backbone.history.fragment;
        var notAllowed = window.notAllowedUrl ;
        route = route.replace(/\(/g, '');
        route = route.replace(/\)/g, '');
        route = route.replace(/\:/g, '');
        route = route.split('/');
        for (var i=0; i< notAllowed.length;i++){
            if (notAllowed[i] == route[0]) {
              $('#arialSub').html('');
              Backbone.history.navigate("#",true);
              return false;
            }
        }
        return true;
      }
  });
});
