define([
	'config',
	'moment'
], function(config, moment) {

  'use strict';

  return {
    loadAndFormat: function(string) {
      return moment(string, moment.ISO_8601).format(config.dateFormats[1]);
    },

    isValid: function(datetime) {
      return moment(datetime, config.dateFormats, true).isValid();
    }
  };
});
