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
	'./lyt-indiv-details',
	'./lyt-new-individual',


	'./view-indivDetails'

], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter, LytIndivDetail, LytNewIndiv, IndivDetails
){

	'use strict';

	return Marionette.LayoutView.extend({

		template: 'app/modules/individual/templates/tpl-individual.html',
		className: 'full-height animated white rel clearfix',

		events : {
			'click #btnFilter' : 'filter',
			'click #back' : 'hideDetails',
			'click button#clear' : 'clearFilter',
			'click button#createNew' : 'newIndividual'
		},

		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'filter': '#filter',
			'detail': '#detail',
			'btnNew' : '#createNew'
		},

		regions: {
			detail : '#detail',
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.com = new Com();

			if(window.app.temp){
				var coll = window.app.temp.collection;
				this.stationIndex = coll.indexOf(options.model);
			}
		},

		onRender: function(){
			this.$el.i18n();
		},


		onShow : function(){
			// Be carreful, we provide LytNewIndiv and not his instance (new) !!!
			var itemsNewIndiv = [{ "label": "Individual", "val": 1 },{ "label": "Group", "val": 2 }];

			this.displayFilter();
			this.displayGrid(); 
			if(this.options.id){
				this.detail.show(new LytIndivDetail({id : this.options.id}));
				this.ui.detail.removeClass('hidden');
			}
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
			this.detail.show(new LytIndivDetail({
				model : row.model,
				globalGrid : this.grid
			}));
			this.grid.currentRow = row;
			this.grid.upRowStyle();
			this.ui.detail.removeClass('hidden');
		},

		rowDbClicked: function(row){
		},

		displayFilter: function(){
			this.filters = new NsFilter({
				url: config.coreUrl + 'individuals/',
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
		newIndividual : function(){
			// TODO  implementation of group creation front/end
			this.ui.btnNew.tooltipList({
					availableOptions : [{
							label : 'Individual',
							val : 'individual'
					}/*, {
							label : 'Group',
							val : 'group'
					}*/
					],
					liClickEvent : function(liClickValue) {
							Backbone.history.navigate('#individual/new/' + liClickValue, {trigger: true});
					},
					position: 'top'
			});


		}
	});
});
