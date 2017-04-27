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
      FileName: '',
      id: null,
			tags : null,
			note : '',
			date_creation : '',
    }
  });
});
