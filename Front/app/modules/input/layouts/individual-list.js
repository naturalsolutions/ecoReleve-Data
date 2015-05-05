define([
	'moment',
	'marionette',
	'config',
	'../views/individual-filter',
	'../views/individual-grid'
], function(moment, Marionette, config, FilterView, GridView) {

	'use strict';

	return Marionette.LayoutView.extend({
		//className: 'container-fluid no-padding',
		template: 'app/modules/input/templates/modalIndivSelect.html',


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
