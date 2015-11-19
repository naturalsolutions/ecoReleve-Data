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
        type: 'GET',
        async: false,
      })
			.done(function(data) {
  var labels = [];
  var len = data.length;
  for (var i = 0; i < len; i++) {
    var label = data[i].proto_name;
    labels.push(label);
  }
  // sort
  labels.sort();
  for (var j = 0; j < len; j++) {
    content += '<option>' + labels[j] + '</option>';
  }
			});

      return content;
    }
  };
});

