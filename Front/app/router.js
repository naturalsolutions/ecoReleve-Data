
define(['jquery', 'marionette', 'backbone', 'config', 'controller'],
	function($, Marionette, Backbone, config) {

  'use strict';
  return Marionette.AppRouter.extend({

    initialize: function(opt) {
      this.collection = new Backbone.Collection([
      {label: 'Manual import', href: 'importFile', icon: 'reneco-import'},
      {label: 'New', href: 'stations/new', icon: 'reneco-entrykey'},
      {label: 'Release', href: 'release', icon: 'reneco-to_release'},
      {label: 'Validate', href: 'validate', icon: 'reneco-validate'},
      {label: 'Stations', href: 'stations', icon: 'reneco-stations'},
      {label: 'Individuals', href: 'individual', icon: 'reneco-individuals'},
      {label: 'Sensors', href: 'sensor', icon: 'reneco-sensors'},
      {label: 'Monitored Sites', href: 'monitoredSite', icon: 'reneco-sensors'},
      {label: 'Export', href: 'export', icon: 'reneco-export'},
      ]);
    },

    appRoutes: {
      'export(/)': 'export',

      'importFile(/)': 'importFile',

      'individual(/)': 'individual',
      'individual/new(/)': 'newIndividual',
      'individual(/):id(/)': 'individual',

      'stations(/)': 'stations',
      'stations/new(/)': 'newStation',
      'stations(/):id(/)': 'stations',

      'sensor/new(/)': 'newSensor',
      'sensor(/)': 'sensor',
      'sensor(/):id(/)': 'sensor',

      'monitoredSite(/)': 'monitoredSite',
      'monitoredSite/new(/)': 'newMonitoredSite',
      'monitoredSite(/):id(/)': 'monitoredSite',

      'validate/:type(/)': 'validateType',
      'validate(/)': 'validate',

      'release(/)': 'release',

      '*route(/:page)': 'home',
    },

    execute: function(callback, args) {
      $.ajax({
        context: this,
        url: config.coreUrl + 'security/has_access'
      }).done(function() {
        callback.apply(this, args);
      }).fail(function(msg) {
        if (msg.status === 502 || msg.status === 403) {
          document.location.href = config.portalUrl;
        }
      });
    },

    onRoute: function(url, patern, params) {
      patern = patern.replace(/\(/g, '');
      patern = patern.replace(/\)/g, '');
      patern = patern.replace(/\:/g, '');
      patern = patern.split('/');

      if (patern[0] == '*route') {
        $('#arial').html('');
      }else {

        var md = this.collection.findWhere({href: patern[0]});
        $('#arial').html('<a href="#' + md.get('href') + '">| &nbsp; ' + md.get('label') + '</a>');

        if (patern[1] && patern[1] != 'id' && patern[1] != 'type') {
          $('#arialSub').html('<a href="#' + patern[0] + '/' + patern[1] + '">| &nbsp;' + patern[1] + '</a>');
        }else {
          $('#arialSub').html('');
        }
      }
    },

  });
});
