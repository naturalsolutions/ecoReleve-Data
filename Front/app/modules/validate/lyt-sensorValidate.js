//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',
	'config',
	'ns_grid/model-grid',
	'ns_modules/ns_com',

], function($, _, Backbone, Marionette, Swal, Translater, config, NsGrid, Com){

	'use strict';

	return Marionette.LayoutView.extend({

		template: 'app/modules/validate/templates/tpl-sensorValidate.html',
		className: 'full-height animated layer',

		initialize: function(options){
		},

		onRender: function(){
			this.$el.i18n();
		},


	});
});
