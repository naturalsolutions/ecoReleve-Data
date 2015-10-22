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
	'ns_modules/ns_toolbar/lyt-toolbar',
	'./view-indivDetails'

], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter, LytIndivDetail, LytNewIndiv,Toolbar,IndivDetails
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/individual/templates/tpl-individual.html',
		className: 'full-height animated white rel',

		events : {
			'click #btnFilter' : 'filter',
			'click #back' : 'hideDetails',
			'click button#clear' : 'clearFilter',
		},

		ui: {
			'grid': '#grid',
			'paginator': '#paginator',
			'filter': '#filter',
			'detail': '#detail',
			'totalEntries': '#totalEntries',
		},

		regions: {
			detail : '#detail',
			toolbar : '#toolbar'
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
			// to integrate the toolbar, create a layout for the content of the modal windows
			// Be carreful, we provide LytNewIndiv and not his instance (new) !!!

			var itemsNewIndiv = [{ "label": "Individual", "val": 1 },{ "label": "Group", "val": 2 }];
			var toolbar = new Toolbar({content : LytNewIndiv, modalTitle : 'New individual', detailsView : IndivDetails, items : itemsNewIndiv });

			this.toolbar.show(toolbar);

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
				pageSize: 13,
				pagingServerSide: true,
				com: this.com,
				url: config.coreUrl+'individuals/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'indiv-count',
				onceFetched: function(params){
					var listPro = {};
					var idList  = [];
					this.collection.each(function(model){
						idList.push(model.get('ID'));
					});
					idList.sort();
					listPro.idList = idList;
					listPro.minId = idList[0];
					listPro.maxId = idList [(idList.length - 1)];
					listPro.state = this.collection.state;
					listPro.criteria = $.parseJSON(params.criteria);
					window.app.listProperties = listPro ;
					_this.totalEntries(this.grid);

					//console.log(idList);
					/*window.app.temp = this;

					_this.totalEntries(this.grid);
					var rows = this.grid.body.rows;
					if(_this.currentRow){
						for (var i = 0; i < rows.length; i++) {
							if(rows[i].model.attributes.ID == _this.currentRow.model.attributes.ID){
								_this.currentRow = rows[i];
								rows[i].$el.addClass('active');
								return rows[i];
							}
						}
					}else{
						var row = this.grid.body.rows[0];
						if(row){
							_this.currentRow = row;
							row.$el.addClass('active');
						}
					}*/
				}
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

		displayFilter: function(){
			this.filters = new NsFilter({
				url: config.coreUrl + 'individuals/',
				com: this.com,
				filterContainer: 'filter',
			});	
		},

		filter: function(){
			this.filters.update();
		},
		clearFilter : function(){
			this.filters.reset();
		},
		rowClicked: function(row){
			var id = row.model.get('ID');
			this.detail.show(new LytIndivDetail({id : id}));
			this.ui.detail.removeClass('hidden');

			Backbone.history.navigate('individual/'+id, {trigger: false});
		},

		rowDbClicked: function(row){

		},
		hideDetails : function(){
			this.ui.detail.addClass('hidden');
		},
		totalEntries: function(grid){
			this.total = grid.collection.state.totalRecords;
			this.ui.totalEntries.html(this.total);
		},
		/*showModal : function(){
			this.newIndiv.show(new LytNewIndiv({rg : this.newIndiv}));
		}*/
	});
});
