 define([
	'models/point',
	'google',
	'views/map'
], function(Point, GoogleLoader, Map) {

  'use strict';

  return {
    init: function(name, target, point, zoom) {
      var initPoint = point || (new Point({
        latitude: 43.29,
        longitude: 5.37,
        label: 'bureau'
      }));
      var mapZoom = zoom || 12;
      var height = $(window).height() - $('#header-region').height();
      $(target).height(height);
      return new Map({
        el: $(target),
        center: initPoint,
        zoom: mapZoom

      });
    }
  };
});
