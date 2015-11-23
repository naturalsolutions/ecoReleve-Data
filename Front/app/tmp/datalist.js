define([
	'jquery'
], function($) {

  'use strict';

  return {
    fill: function(source, target) {
      $.ajax(source).done(function(data) {
        var html = '';
        _.each(data, function(item) {
          html += '<option>' + item + '</option>';
        });
        $(target).html(html);
      });
    }
  };
});
