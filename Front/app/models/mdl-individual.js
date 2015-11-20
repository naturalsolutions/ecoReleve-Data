define([
	'backbone',
	'config'
], function(Backbone, config) {
  'use strict';
  return Backbone.Model.extend({
    urlRoot: config.coreUrl + 'individuals/' + '',

    initialize: function(id) {
      this.id = id;
      this.formUrl = this.urlRoot + this.id  + '';
      this.geoUrl = this.urlRoot + this.id + '?geo=true';
      this.historyUrl = this.urlRoot + this.id  + '/history';
      this.equipmentUrl = this.urlRoot + this.id  + '/equipment';
    },

  });
});
