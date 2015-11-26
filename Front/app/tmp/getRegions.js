define([
	'jquery',
	'config',
], function($, config) {
  'use strict';
  return {
    getElements: function(url, coordinates) {
      var type = 'POST';
      if (coordinates) {
        type = 'GET';
      }
      var content = '';
      url = config.coreUrl + url;
      var query = $.ajax({
        context: this,
        url: url,
        dataType: 'json',
        type: type,
        async: false,
      })
			.done(function(data) {
  if (!coordinates) {
    var len = data.length;
    for (var i = 0; i < len; i++) {
      var label = data[i];
      content += '<option value="' +  data[i] + '">' +  data[i] + '</option>';
    }
  } else {
    var tab = [];
    for (var index in data) {
      var lat = data[index].lat;
      var lon = data[index].lon;
      tab.push('<option value="' +  index + '"  lat=' + lat + ' lon=' + lon + '>' +  index + '</option>');
    }
    tab.sort();
    content += tab.join(' ');
  }
			})
			.fail(function() {
  alert('error loading items, please check connexion to webservice');
			});

      return content;
    }
  };
});

