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
    var label = data[i].fullname;
    var id = data[i].PK_id;
    content += '<option value="' + id + '">' + label + '</option>';
  }
			})
			.fail(function() {
  alert('error loading items, please check connexion to webservice');
			});

      return content;
    }
  };
});

