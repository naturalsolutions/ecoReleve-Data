//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',
	'config',
	'ns_modules/ns_com',
	'ns_grid/model-grid',
	'ns_map/ns_map',

], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid,NsMap// NsForm
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/individual/templates/tpl-indiv-details.html',
		className: 'full-height animated white',

		events : {
		},

		ui: {
			'grid': '#grid',
			'form': '#form',
			'map': '#map',
			'paginator' :'#paginator'
		},

		initialize: function(){
			this.translater = Translater.getTranslater();
			this.com = new Com();
		},

		onRender: function(){

			this.$el.i18n();
		},

		onShow : function(){
			//this.displayForm();
			this.displayGrid();
			this.displayMap();
		},

		displayGrid: function(){
			var _this = this;
			this.grid = new NsGrid({
				pageSize: 20,
				pagingServerSide: true,
				com: this.com,
				url: config.coreUrl+'individuals/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'indiv-count'
			});

			// this.grid.rowClicked = function(row){
			// 	_this.rowClicked(row);
			// };
			// this.grid.rowDbClicked = function(row){
			// 	_this.rowDbClicked(row);
			// };
			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
		},

		initMap: function(geoJson){
			this.map = new NsMap({
				geoJson: geoJson,
				zoom: 4,
				element : 'map',
				popup: true,
				cluster: true
			});
			//this.map.init();
		},

		displayMap: function(){

			var url  = config.coreUrl+ 'stations/?criteria=%7B%7D&lastImported=true&=true&geo=true&offset=0&order_by=%5B%5D&per_page=20';
			$.ajax({
				url: url,
				contentType:'application/json',
				type:'GET',
				context: this,
			}).done(function(datas){
				this.initMap(datas);
			}).fail(function(msg){
				console.error(msg);
			});
		}

	});
});
