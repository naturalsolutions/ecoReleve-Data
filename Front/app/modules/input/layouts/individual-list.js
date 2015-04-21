define([
	'moment',
	'marionette',
	'config',
	'modules2/input/views/individual-filter',
	'modules2/input/views/individual-grid',
	'text!modules2/input/templates/modalIndivSelect.html'
], function(moment, Marionette, config, FilterView, GridView, template) {

	'use strict';

	return Marionette.LayoutView.extend({
		//className: 'container-fluid no-padding',
		template: template,

		regions: {
			left: '#filter-left-panel',
			main: '#filter-main-panel'
		},

		onShow: function() {
			this.left.show(new FilterView());
			this.main.show(new GridView());
		},

		onBeforeDestroy: function() {
		   // Radio.channel('input').reset();
		}
	});
});
