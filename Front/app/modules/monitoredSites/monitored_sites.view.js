define([
  'modules/objects/manager.view'
], function(ManagerView) {

  'use strict';

  return ManagerView.extend({
  	model: new Backbone.Model({
  	  label: 'monitored sites',
  	  single: 'monitored site',
  	  type: 'monitoredSites',
  	}),
  });
});
