define([
	'jquery',
	'config',
], function($, config) {
  'use strict';
  return {
    getElements: function(url) {
      var content = '';
      url = config.coreUrl + url;
      var query = $.ajax({
        context: this,
        url: url,
        dataType: 'json',
        async: false,
      })
			.done(function(data) {
  var len = data.length;
  for (var i = 0; i < len; i++) {
    var label = data[i].caption;
    content += '<option value="' + label + '">' + label + '</option>';
  }
			})
			.fail(function() {
  alert('error loading items, please check connexion to webservice');
			});
      return content;
    }
  };
});
