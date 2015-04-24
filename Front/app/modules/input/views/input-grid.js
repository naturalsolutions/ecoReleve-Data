//radio

define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',

	'backbone.paginator',
	'backgrid',

	'backgrid.paginator',

	'moment',

], function($, _, Backbone, Marionette, Radio,
	PageableCollection, Backgrid, Paginator, moment
	//optList
) {
	'use strict';
	return Marionette.ItemView.extend({
		
		template : 'app/modules/input/templates/input-grid.html',
		//className:'detailsInputPanel',
		events: {
			'click .backgrid-container tbody tr': 'focus'
		},
		initialize: function(options) {
			this.radio = Radio.channel('input');
			this.collection = options.collections;  
			var Locations = PageableCollection.extend({
				//url: config.coreUrl + 'dataGsm/' + this.gsmID + '/unchecked?format=json',
				mode: 'client',
				state:{
					pageSize: 20
				}
			});
			this.com = options.com;
			if(options.com){
				this.com = options.com;
				this.com.addModule(this);
			}
			this.locations = new Locations();
			// add each model of the view collection to the pageableCollection
			var self = this;
			this.collection.each(function(model) {
				self.locations.add(model);
			});
		},
		updateGrid: function(id) {
		},

		updateMap: function(evt) {
			if($(evt.target).is("td")) {
				var tr = $(evt.target).parent();
				var id = tr.find('td').first().text();
				var idNumber = Number(id);
				var currentModel = this.locations.findWhere({PK: idNumber});
				// unselect rows and select clicked row
				$('table.backgrid tr').removeClass('active');
				$(tr).addClass('active');
				Radio.channel('input').command('updateMap', currentModel);
				Radio.channel('input').command('generateStation', currentModel);
				$('#btnNext').removeClass('disabled');
			}
		},
		onShow: function() {
			var optionsList = $.parseHTML(optList);

			var option=[];
			for (var i = 0; i < optionsList.length; i++) {
				option[0]=$(optionsList[i]).attr('value');
				option[1]=$(optionsList[i]).attr('value');
				optionsList[i] = option;
				option=[];
			};

			var myCell = Backgrid.NumberCell.extend({
				decimals: 5
			});
			var columns = [{
				name: "PK",
				label: "ID",
				editable: false,
				renderable: false,
				cell: "string"
			}, {
				name: "Name",
				label: "Name",
				editable: false,
				cell: "string"
			}, {
				name: "DATE",
				label: "Date",
				editable: false,
				cell: "string"  //"Date"
			}, {
				editable: false,
				name: "LAT",
				label: "LAT",
				cell: myCell
			}, {
				editable: false,
				name: "LON",
				label: "LON",
				cell: myCell
			},  {
				editable: true,
				name: "FieldActivity_Name",
				label: "Field Activity",
				cell: Backgrid.SelectCell.extend({
					optionValues: optionsList               
				 })
			}
			];
			// Initialize a new Grid instance
			this.grid = new Backgrid.Grid({
				className: 'table',
				columns: columns,
				collection: this.locations
			});
			this.$el.find("#locations").append(this.grid.render().el);
			// Initialize a new Paginator instance
			this.paginator = new Backgrid.Extension.Paginator({
				collection: this.locations
			});

			this.$el.append(this.paginator.render().el);
			Radio.channel('input').comply('grid:updateFieldActivity', this.updateFieldActivity, this);
		},
		action: function(action, ids){
		  switch(action){
			case 'focus':
			  this.hilight(ids);
			  break;
			case 'selection':
			  this.selectOne(ids);
			  break;
			case 'selectionMultiple':
			  this.selectMultiple(ids);
			  break;
			case 'resetAll':
			   this.clearAll();
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
				//var idNumber = Number(id);
				//var currentModel = this.locations.findWhere({PK: idNumber});
				// style selected
				// 1- remove selected style for all childs
				$(tr).parent().find('tr').each(function( ) {
					$(this).removeClass('trSelected');

				});
				$(tr).addClass('trSelected');
				Radio.channel('input').command('generateStation', currentModel);
				this.updateModel(id);
				this.interaction('focus', id);
			}
		},
		updateFieldActivity : function(e){
			var td = $(e.target).parent();
			var id = $(td).parent().find('td').first().text();
			this.updateModel(id);
			
		},
		updateModel : function(id){
			var idNumber = Number(id);
			var currentModel = this.locations.findWhere({PK: idNumber});
			Radio.channel('input').command('generateStation', currentModel);
		}
	});
});
