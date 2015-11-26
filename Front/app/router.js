
define(['jquery', 'marionette', 'backbone', 'config', 'controller'],
<<<<<<< HEAD
	function($, Marionette, Backbone, config) {
=======
  function($, Marionette, Backbone, config) {
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca

  'use strict';
  return Marionette.AppRouter.extend({

    initialize: function(opt) {
      this.collection = new Backbone.Collection([
      {label: 'Manual import', href: 'importFile', icon: 'reneco-import'},
      {label: 'New', href: 'stations/new', icon: 'reneco-entrykey'},
      {label: 'Release', href: 'release', icon: 'reneco-to_release'},
      {label: 'Validate', href: 'validate', icon: 'reneco-validate'},
      {label: 'Stations', href: 'stations', icon: 'reneco-stations'},
<<<<<<< HEAD
      {label: 'Individuals', href: 'individual', icon: 'reneco-individuals'},
      {label: 'Sensors', href: 'sensor', icon: 'reneco-sensors'},
      {label: 'Monitored Sites', href: 'monitoredSite', icon: 'reneco-sensors'},
=======
      {label: 'Individuals', href: 'individuals', icon: 'reneco-individuals'},
      {label: 'Sensors', href: 'sensors', icon: 'reneco-sensors'},
      {label: 'Monitored Sites', href: 'monitoredSites', icon: 'reneco-sensors'},
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
      {label: 'Export', href: 'export', icon: 'reneco-export'},
      ]);
    },

    appRoutes: {
      'export(/)': 'export',

      'importFile(/)': 'importFile',

<<<<<<< HEAD
      'individual(/)': 'individual',
      'individual/new(/)': 'newIndividual',
      'individual(/):id(/)': 'individual',

      'stations(/)': 'stations',
      'stations/new(/)': 'newStation',
      'stations(/):id(/)': 'stations',

      'sensor/new(/)': 'newSensor',
      'sensor(/)': 'sensor',

      'monitoredSite(/)': 'monitoredSite',
      'monitoredSite/new(/)': 'newMonitoredSite',
      'monitoredSite(/):id(/)': 'monitoredSite',
=======
      'individuals/new(/)': 'newIndividual',
      'individuals/:id(/)': 'individuals',
      'individuals(/)': 'individuals',

      'stations/new/:from(/)': 'newStation',
      'stations/new(/)': 'newStation',
      'stations/:id(/)': 'stations',
      'stations(/)': 'stations',

      'sensors/new/:type(/)': 'newSensor',
      'sensors/:id(/)': 'sensors',
      'sensors(/)': 'sensors',

      'monitoredSites/new(/)': 'newMonitoredSite',
      'monitoredSites/:id(/)': 'monitoredSites',
      'monitoredSites(/)': 'monitoredSites',
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca

      'validate/:type(/)': 'validateType',
      'validate(/)': 'validate',

<<<<<<< HEAD
=======
      'release/:id(/)': 'release',
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
      'release(/)': 'release',

      '*route(/:page)': 'home',
    },

<<<<<<< HEAD
    /*execute: function(callback, args) {
=======
    execute: function(callback, args) {
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
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
<<<<<<< HEAD
    },*/
=======
    },
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca

    onRoute: function(url, patern, params) {
      patern = patern.replace(/\(/g, '');
      patern = patern.replace(/\)/g, '');
      patern = patern.replace(/\:/g, '');
      patern = patern.split('/');

      if (patern[0] == '*route') {
        $('#arial').html('');
<<<<<<< HEAD
      }else {

        var md = this.collection.findWhere({href: patern[0]});
        $('#arial').html('<a href="#' + md.get('href') + '">| &nbsp; ' + md.get('label') + '</a>');

=======
        $('#arialSub').html('');
      }else {
        var md = this.collection.findWhere({href: patern[0]});
        $('#arial').html('<a href="#' + md.get('href') + '">| &nbsp; ' + md.get('label') + '</a>');
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
        if (patern[1] && patern[1] != 'id' && patern[1] != 'type') {
          $('#arialSub').html('<a href="#' + patern[0] + '/' + patern[1] + '">| &nbsp;' + patern[1] + '</a>');
        }else {
          $('#arialSub').html('');
        }
      }
    },

  });
});
