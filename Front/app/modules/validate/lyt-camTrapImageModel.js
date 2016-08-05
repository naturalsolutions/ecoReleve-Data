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
    urlRoot: config.coreUrl+'photos',
    defaults:{
      path :'',
      name: '',
      id: null,
      checked: null,
      validated: null,
    }
  });
});
