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
	'ns_filter/model-filter',


	'./lyt-ms-details',



], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter, LytMsDetail
){

	'use strict';

	return Marionette.LayoutView.extend({

		template: 'app/modules/monitoredSite/templates/tpl-ms.html',
		className: 'full-height animated white rel',


		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'filter': '#filter',
			'detail': '#detail',
		},

		events : {
			'click #btnFilter' : 'filter',
			'click #back' : 'hideDetails',
			'click button#clear' : 'clearFilter'
		},

		regions: {
			detail : '#detail'
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.com = new Com();

		},

		onRender: function(){

			this.$el.i18n();
		},


		onShow : function(){
			this.displayFilter();
			this.displayGrid(); 
			if(this.options.id){
				this.detail.show(new LytMsDetail({id : this.options.id}));
				this.ui.detail.removeClass('hidden');
			}
		},

		displayGrid: function(){
			var _this = this;
			this.grid = new NsGrid({
				pageSize: 20,
				pagingServerSide: true,
				com: this.com,
				url: config.coreUrl+'monitoredSite/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'totalEntries',
			});

			this.grid.rowClicked = function(args){
				_this.rowClicked(args.row);
			};
			this.grid.rowDbClicked = function(args){
				_this.rowDbClicked(args.row);
			};
			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
		},

		rowClicked: function(row){
			this.detail.show(new LytMsDetail({
				model : row.model,
				globalGrid: this.grid
			}));
			this.ui.detail.removeClass('hidden');
			this.grid.currentRow = row;
			this.grid.upRowStyle();
			//Backbone.history.navigate('monitoredSite/'+id, {trigger: false})
		},
		rowDbClicked: function(row){

		},

		displayFilter: function(){
			this.filters = new NsFilter({
				url: config.coreUrl + 'monitoredSite/',
				com: this.com,
				filterContainer: this.ui.filter,
			});
		},

		filter: function(){
			this.filters.update();
		},
		clearFilter : function(){
			this.filters.reset();
		},
		hideDetails : function(){
			this.ui.detail.addClass('hidden');
		},
	});
});
