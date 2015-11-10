define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'ns_grid/model-grid',
	'i18n'
], function($, _, Backbone, Marionette, config, NsGrid
){
	'use strict';
	return Marionette.LayoutView.extend({
		className: 'full-height', 
		template: 'app/modules/export/templates/tpl-export-step3.html',

		name : ' Preview',

		ui: {
			'grid': '#grid',
		},

		initialize: function(options){
			this.model = options.model;
		},


		onShow: function(){
			this.displayGrid(); 
		},

		displayGrid: function(){
			var _this = this;
			this.grid = new NsGrid({
				pageSize: 20,
				pagingServerSide: true,
				url: config.coreUrl + 'export/views/' + this.model.get('viewId') + '/',
				urlParams : this.model.get('filters'),
				totalElement : 'totalEntries',
			});

			this.ui.grid.html(this.grid.displayGrid());
		},

		validate: function(){
			return this.model;
		},

		check: function(){
			return true;
		},



	});
});
