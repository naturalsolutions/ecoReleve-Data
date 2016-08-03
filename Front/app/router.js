
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
      // get current route
      this.history.push(Backbone.history.fragment);
      var _this= this;
      window.checkExitForm(function(){
        _this.continueNav(callback, args);
      },function(){
        _this.previous();
      });
    },
    onRoute: function(url, patern, params) {
      patern = patern.replace(/\(/g, '');
      patern = patern.replace(/\)/g, '');
      patern = patern.replace(/\:/g, '');
      patern = patern.split('/');

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
        var patern;
        var patern =   href.split('/');
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
        var md = this.collection.findWhere({href: patern[0]});
        $('#arial').html('<a href="#' + md.get('href') + '">| &nbsp; ' + md.get('label') + '</a>');
        if (patern[1] && patern[1] != 'id' && patern[1] != 'type') {
          $('#arialSub').html('<a href="#' + patern[0] + '/' + patern[1] + '">| &nbsp;' + patern[1] + '</a>');
        }else {
          $('#arialSub').html('');
        }
     }
  });
});
