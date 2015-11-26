define([
	'backbone',
	'config'
], function(Backbone, config) {
  'use strict';
  return Backbone.Model.extend({
    defaults: {
      id: null,
      name: null,
      type: null,
      positions: []
    },
    urlRoot: config.coreUrl + 'monitoredSite/detail'
  });
});
