define([
	'moment',
	'jquery',
	'underscore',
	'backbone',
	'backbone.paginator',
	'backgrid',
	'backgrid.paginator',
	'marionette',
	'radio',
	'config',


	'text!modules2/input/templates/individual-list.html'
], function(moment, $, _, Backbone, PageableCollection, Backgrid, Paginator, Marionette, Radio, config, template) {

	'use strict';

	return Marionette.ItemView.extend({
		template: 'app/modules/input/templates/individual-list.html',


		events :{
			'click tbody > tr': 'detail',
			'dblclick tbody > tr' : 'navigate'
		},

		initialize: function(options) {
			this.radio = Radio.channel('individual');
			this.radio.comply('update', this.update, this);

			var Individuals = PageableCollection.extend({
				sortCriteria: {'id':'asc'},
				url: config.coreUrl + 'individuals/search',
				mode: 'server',
				state:{
					pageSize: 25,
				},
				queryParams: {
					offset: function() {return (this.state.currentPage - 1) * this.state.pageSize;},
					criteria: function() {return JSON.stringify(this.searchCriteria);},
					order_by: function() {
						var criteria = [];
						for(var crit in this.sortCriteria){
							criteria.push(crit + ':' + this.sortCriteria[crit]);
						}
						return JSON.stringify(criteria);},
				},
				fetch: function(options) {
					options.type = 'POST';
					PageableCollection.prototype.fetch.call(this, options);
				}
			});

			var individuals = new Individuals();

			var myHeaderCell = Backgrid.HeaderCell.extend({
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
					collection.sortCriteria = (Object.keys(sortCriteria).length > 0) ? sortCriteria : {'id': 'asc'};
					collection.fetch({reset: true,success : function(resp){ 
					}});
				},
			});

			var columns = [{
				name: 'id',
				label: 'ID',
				editable: false,
				cell: Backgrid.IntegerCell.extend({
					orderSeparator: ''
				}),
				headerCell: myHeaderCell
			}, {
				name: 'ptt',
				label: 'PTT',
				editable: false,
				cell: Backgrid.IntegerCell.extend({
					orderSeparator: ''
				}),
				headerCell: myHeaderCell
			}, {
				name: 'age',
				label: 'AGE',
				editable: false,
				cell: 'string',
				headerCell: myHeaderCell
			}, {
				name: 'origin',
				label: 'ORIGIN',
				editable: false,
				cell: 'string',
				headerCell: myHeaderCell
			}, {
				name: 'species',
				label: 'SPECIES',
				editable: false,
				cell: 'string',
				headerCell: myHeaderCell
			}, {
				name: 'sex',
				label: 'SEX',
				editable: false,
				cell: 'string',
				headerCell: myHeaderCell
			}];
			// Initialize a new Grid instance
			this.grid = new Backgrid.Grid({
				columns: columns,
				collection: individuals,
			});
			var that=this;
			individuals.searchCriteria = {};
			individuals.fetch( {reset: true,   success : function(resp){ 
						that.$el.find('#indiv-count').html(individuals.state.totalRecords+' individuals');
						}
			} );

			this.paginator = new Backgrid.Extension.Paginator({
				collection: individuals
			});
		},


		update: function(args) {
			var that=this;
			this.grid.collection.searchCriteria = args.filter;
			// Go to page 1
			this.grid.collection.state.currentPage = 1;
			this.grid.collection.fetch({reset: true, success:function(){
				that.$el.find('#indiv-count').html(that.grid.collection.state.totalRecords+' individuals');
			}

			});
		},

		onShow: function() {
			this.$el.parent().addClass('no-padding');
			$('#main-panel').css({'padding-top': '0'});
			this.$el.addClass('grid');
			var height = $(window).height();
			height -= $('#header-region').height() + $('#main-panel').outerHeight();
			this.$el.find('#grid-row').height(height);
			height = $(window).height();
			this.$el.height(height-$('#header-region').height());
			$('#gridContainer').append(this.grid.render().el);
			this.$el.append(this.paginator.render().el);
		},

		onDestroy: function(){
			$('#main-panel').css('padding-top', '20');
			this.grid.remove();
			this.grid.stopListening();
			this.grid.collection.reset();
			this.grid.columns.reset();
			delete this.grid.collection;
			delete this.grid.columns;
			delete this.grid;
		},

		detail: function(evt) {
			var row = $(evt.currentTarget);
			var id = $(row).find(':first-child').text()
			//Radio.channel('route').trigger('indivId', {id: id});
			Radio.channel('input').command('indivId', {id: id});
			$('table.backgrid tr').removeClass('active');
			$(row).addClass('active');
		},
		navigate : function(evt){
			this.detail(evt);
			this.radio.command('filterMask');
		}
	});
});
