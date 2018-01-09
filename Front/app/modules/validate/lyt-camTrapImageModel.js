define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'translater',
	'config',

], function($, _, Backbone, Marionette, Translater, config) {

  'use strict';

  return  Backbone.Model.extend({
    defaults:{
      path :'',
      name: '',
      id: null,
      checked: null,
      validated: null,
			tags : null,
			note : '',
      date_creation : '',
      stationId : null
    }
  });
});
