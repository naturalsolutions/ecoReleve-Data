define([
	'backbone'
], function(Backbone) {

  'use strict';

  return Backbone.Model.extend({
    schema: {
      latitude:    {type: 'Number'},
      longitude:   {type: 'Number'},
      label: {type: 'Text'},
      id: {type: 'Text'}
    },
    defaults: {
      latitude: 33.06 ,
      longitude: -3.96,
      label: 'Missour',
      id: '_'
    }
  });
});

