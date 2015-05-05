define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'radio',
	'backgrid',
	'backbone.paginator',
	'backgrid.paginator',
	'ns_grid/model-col-generator',
	'backgridSelect_all',

], function($, _, Backbone, config, Radio, Backgrid, PageColl, Paginator, colGene, BgSelectAll){
	'use strict';
	return Backbone.Model.extend({


		/*===================================
		=            Grid module            =
		===================================*/
		
		/*
		dataTmp: {
			Date : "2012-07-05 16:41:00",
			StaID: 455513, 
			StaName: "4199-4710" 
		},*/
 
		init: false,
		pagingServerSide: true, 
		coll: false,

		initialize: function(options){
			
			this.channel= options.channel;
			this.radio= Radio.channel(this.channel);

			this.radio.comply(this.channel+':grid:update', this.update, this);

			this.url=options.url;
			this.pageSize=options.pageSize;
			//this.columns = options.columns,
			
			this.pagingServerSide=options.pagingServerSide;
			if (options.columns) {
				this.columns=options.columns;        
			}else {
				this.colGene = new colGene({url : this.url + 'getFields', paginable:this.pagingServerSide, checkedColl: options.checkedColl });
				this.columns = this.colGene.columns ;
			}

			if (options.collection){
				this.collection=options.collection;
				this.coll=true;
			}
			else{

				if(this.pagingServerSide){
					this.initCollectionPaginable();
				}else if(this.pageSize) {
						this.initCollectionPaginableClient();
				}
				else{
					this.initCollectionNotPaginable();
				}
			}
			if(this.pagingServerSide && options.columns){
				this.setHeaderCell();
			}

			this.initGrid();
			this.eventHandler();
		},

		setHeaderCell: function(){
			var hc= Backgrid.HeaderCell.extend({
				onClick: function (e) {
					e.preventDefault();
					var that=this;
					var column = this.column;
					var collection = this.collection;
					var sortCriteria = (collection.sortCriteria && typeof collection.sortCriteria.id === 'undefined') ? collection.sortCriteria : {};
					switch(column.get('direction')){
						case null:
							column.set('direction', 'ascending');
							sortCriteria[column.get('name')] = 'asc';
							break;
						case 'ascending':
							column.set('direction', 'descending');
							sortCriteria[column.get('name')] = 'desc';
							break;
						case 'descending':
							column.set('direction', null);
							delete sortCriteria[column.get('name')];
							break;
						default:
							break;
					}
					var tmp= this.column.attributes.name;
					if(!Object.keys(sortCriteria).length > 0)
						collection.sortCriteria[tmp] = 'asc';
					collection.fetch({reset: true});
				},
			});
			for (var i = 0; i < this.columns.length; i++) {
				this.columns[i].headerCell=hc;
			};
		},

		initCollectionPaginable:function(){
			var ctx = this;
			var PageCollection = PageColl.extend({
				sortCriteria: {},
				url: this.url+'search',
				mode: 'server',
				state:{
					pageSize: this.pageSize
				},
				queryParams: {
					
					offset: function() {return (this.state.currentPage - 1) * this.state.pageSize;},
					criteria: function() {
						
						return JSON.stringify(this.searchCriteria);},
					order_by: function() {
						var criteria = [];
						for(var crit in this.sortCriteria){
							criteria.push(crit + ':' + this.sortCriteria[crit]);
						}
						return JSON.stringify(criteria);},
				},
				fetch: function(options) {
					var params= {
						'page' : this.state.currentPage,
						'per_page' : this.state.pageSize,
						'offset': this.queryParams.offset.call(this),
						'order_by' : this.queryParams.order_by.call(this),
						'criteria' : this.queryParams.criteria.call(this),
					};
					if(ctx.init){
						ctx.updateMap(params);
					}
					ctx.init=true;
					PageColl.prototype.fetch.call(this, options);
				}
			});

			this.collection = new PageCollection();
		},

		updateMap: function(params){
			this.radio.command(this.channel+':map:update', { params : params });
		},
		
		initCollectionPaginableClient:function(){
			var PageCollection = PageColl.extend({
				url: this.url+'search',
				mode: 'client',
				state:{
					pageSize: this.pageSize
				},
				queryParams: {
					order: function(){
					},
					criteria: function() {
						return JSON.stringify(this.searchCriteria);
					},
				},
			});

			this.collection = new PageCollection();
		},

		
		initCollectionNotPaginable:function(){
			this.collection = new Backbone.Collection();
			this.collection.url=this.url+'search';

			
		},
		
		
		initGrid: function(){
			var tmp=JSON.stringify({criteria : null});
			
			this.grid = new Backgrid.Grid({
				columns: this.columns,
				collection: this.collection
			});
			if(!this.coll){
				this.collection.searchCriteria = {};
				this.collection.fetch({reset: true});
			}
		},


		update: function(args){
			if(this.pageSize){
				this.grid.collection.state.currentPage = 1;
				this.grid.collection.searchCriteria = args.filters;
				this.grid.collection.fetch({reset: true});
			}
			else{
				var datas= JSON.stringify(args.filters);
				this.grid.collection.fetch({reset: true, data : { 'criteria' : datas}});
			}
		},

		displayGrid: function(){
			return this.grid.render().el;
		},


		displayPaginator: function(){
			this.paginator = new Backgrid.Extension.Paginator({
				collection: this.collection
			});
			return this.paginator.render().el
		},

		eventHandler: function () {
			var self=this;
			this.grid.collection.on('backgrid:edited',function(model){
				model.save({patch:model.changed});
			})
		},


		action: function(){
			
		},

	});
});
