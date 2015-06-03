define([
	'jquery',
	'underscore',
	'backbone',
	'backbone.paginator',
	'backgrid',
	'ns_grid/model-grid',
	'backgrid.paginator',
	'marionette',
	'radio',
	'backgridSelect_all',
], function(
	$, _, Backbone, PageableCollection, Backgrid, NsGrid, Paginator, Marionette, Radio
){
	'use strict';
	return Marionette.ItemView.extend({
		template: 'app/modules/import/templates/import-grid.html',
		className:'detailsImportPanel',
		events: {
			'click .backgrid-container tbody tr': 'focus',
			'click #btnSelectionGrid' : 'clearSelectedRows',
			'click table.backgrid td.editor' : 'cellToEdit',
			'click table.backgrid td.select-row-cell input[type=checkbox]' : 'checkSelect',
			'click table.backgrid th input' : 'checkSelectAll',
		},

		all : false,

		initialize: function(options) {
			this.radio = Radio.channel('import-gpx');
			this.collection = options.collections; 
			this.com = options.com;
			if(options.com){
				this.com = options.com;
				this.com.addModule(this);
			}
			this.locations = new Backbone.Collection();
			this.locations = this.collection;
		},

		onShow: function() {
			var myCell = Backgrid.NumberCell.extend({
				decimals: 5
			});

			var html = Marionette.Renderer.render('app/modules/import/_gpx/templates/options-list.html');
			var optionsList = $.parseHTML(html);

			var option=[];
			for (var i = 0; i < optionsList.length; i++) {
				option[0]=$(optionsList[i]).attr('value');
				option[1]=$(optionsList[i]).attr('value');
				optionsList[i] = option;
				option=[];
			};

			var columns = [
			{
				name: "id",
				label: "ID",
				editable: false,
				renderable: false,
				cell: "integer"
			},
			{
				editable: true,
				name: "import",
				label: "Import",
				cell: 'select-row',
				headerCell: 'select-all'
			},{
				name: "name",
				label: "Name",
				editable: false,
				cell: "string"
			}, {
				name: "waypointTime",
				label: "Date",
				editable: false,
				cell: Backgrid.DatetimeCell
			}, {
				editable: false,
				name: "latitude",
				label: "LAT",
				cell: myCell
			}, {
				editable: false,
				name: "longitude",
				label: "LON",
				cell: myCell
			},{
				editable: true,
				name: "fieldActivity",
				label: "Field Activity",
				cell: Backgrid.SelectCell.extend({
					optionValues: optionsList
				})
			},
			];
			/*
			this.grid = new NsGrid.Grid({
				columns: columns,
				collection: this.locations
			});
			*/
			this.grid = new NsGrid({
				//name: curName,
                channel: 'modules',
                //url: 'api/Sample/',
                pageSize: this.PageSize,
                pagingServerSide: false,
                //totalElement: 'NbElements',
                com: this.com,
                columns: columns,
				collection: this.locations
                //filterCriteria: filter
             });

			//this.$el.find("#locations").append(this.grid.render().el);

			var Grid = this.grid.displayGrid();

            this.$el.find('#locations').html(this.grid.displayGrid());
            //this.$el.find('#paginator').html(this.grid.displayPaginator());
		},

		action: function(action, params){
		  switch(action){
			case 'focus':
			  this.hilight(params);
			  break;
			case 'selection':
			  this.selectOne(params);
			  break;
			case 'selectionMultiple':
			  this.selectMultiple(params);
			  break;
			case 'resetAll':
			   this.clearAll();
			  break;
			case 'filter':
			   this.filter(params);
			  break;
			default:
			  console.warn('verify the action name');
			  break;
		  }
		},

		interaction: function(action, id){
		  if(this.com){
			this.com.action(action, id);                    
		  }else{
			this.action(action, id);
		  }
		},

		hilight: function(){
		},

		clearAll: function(){
			var coll = new Backbone.Collection();
			coll.reset(this.grid.collection.models);
			for (var i = coll.models.length - 1; i >= 0; i--) {
				coll.models[i].attributes.import = false;
			};
			//to do : iterrate only on checked elements list of (imports == true)
		},

		selectOne: function(id){
			var model_id = id;
			var coll = new Backbone.Collection();
			coll.reset(this.grid.collection.models);

			model_id = parseInt(model_id);
			var mod = coll.findWhere({id : model_id});

			if(mod.get('import')){
				mod.set('import',false);
				mod.trigger("backgrid:select", mod, false);
			}else{
				mod.set('import',true);
				mod.trigger("backgrid:select", mod, true);
			}
		},

		selectMultiple: function(ids){
			var model_ids = ids, self = this, mod;

			for (var i = 0; i < model_ids.length; i++) {
				mod = this.grid.collection.findWhere({id : model_ids[i]});
				mod.set('import', true);
				mod.trigger("backgrid:select", mod, true);
			};
		},

		checkSelect: function(e){
			var id = $(e.target).parent().parent().find('td').html();
			this.interaction('selection', id);
		},

		checkSelectAll: function(e){
			var ids = _.pluck(this.grid.collection.models, 'id');
			if(!$(e.target).is(':checked')){
				this.interaction('resetAll', ids);
			}else{
				this.interaction('selectionMultiple', ids);
			}
		},

		focus: function(e) {
			if($(e.target).is('td')) {
				var tr = $(e.target).parent();
				var id = tr.find('td').first().text();
				this.interaction('focus', id);
			}
		},

		filter: function(params){
			this.grid.update({ filters: params });
			//this.grid.filter(params);
			/*this.grid.collection = coll;
			this.grid.body.collection = coll;
			this.grid.body.refresh();*/
		},

		

	});
});
