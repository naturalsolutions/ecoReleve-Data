define([
	'jquery',
], function($) {
  /*$.getJSON('./modules/input/data/protocols.json', function(data) {
  		var Protocol = Backbone.Model.extend({
  			schema : data.schema,
  			name : data.name
  		});
  		return Protocol;
  	});*/
  $.ajax({
    url: './modules/input/data/',
    success: function(data) {
      var tm = data;
    }
  });
});

