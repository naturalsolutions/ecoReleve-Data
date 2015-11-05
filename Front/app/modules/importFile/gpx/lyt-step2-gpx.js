define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'ns_modules/ns_com',
	'ns_filter/model-filter',
	'ns_map/ns_map',
	'ns_grid/model-grid',
	'sweetAlert',
	'i18n'

], function($, _, Backbone, Marionette, config,
	Com, NsFilter, NsMap, NsGrid,Swal
){

	'use strict';

	return Marionette.LayoutView.extend({

		className: 'full-height', 
		template: 'app/modules/importFile/gpx/templates/tpl-step2-gpx.html',

		name : 'Datas Selection',

		ui: {
			'grid': '#grid',
			'filters' : '#filters'

		},


		//temp
		events: {
			'click .backgrid tbody tr': 'focus',
			'click #btnSelectionGrid' : 'clearSelectedRows',
			'click table.backgrid td.editor' : 'cellToEdit',
			'click table.backgrid td.select-row-cell input[type=checkbox]' : 'checkSelect',
			'click table.backgrid th input' : 'checkSelectAll',
			'click button#filter': 'filter',
			'click button#clear' : 'clearFilter'
		},

		initialize: function(options){
			this.com = new Com();
			this.collection = options.model.attributes.data_FileContent;
			this.com.setMotherColl(this.collection);
			this.deferred = $.Deferred();
		},

		onShow : function(){
			this.displayGrid();
			this.displayFilters();
			$(this.ui.filters).find('input').each(function(){
				$(this).val('');
			});
			this.displayMap();
		},

		displayMap: function(){
			//should 2 it in the map?
			var features = {
				'features': [],
				'type': 'FeatureCollection'
			};

			var feature, attr;
			this.collection.each(function(m){
				attr = m.attributes;
				feature = {
					'type': 'Feature',
					'id': attr.id,
					'geometry': {
						'type': 'Point',
						'coordinates': [attr.longitude, attr.latitude],
					},
					'properties': {
						'date': '2014-10-23 12:39:29'
					},
				};
				features.features.push(feature);
			});
			this.features = features;

			this.map = new NsMap({
				cluster: true,
				popup: false,
				geoJson: this.features,
				com : this.com,
				bbox: true,
				selection : true,
				element: 'map',
				center: [-4.094, 33.006]
			});
		},


		displayFilters: function(){
			this.filtersList={
				1 : {
					name : 'name',
					type : 'Text',
					label : 'Name'
				},
				2 : {
					name : 'latitude',
					type : 'Number',
					label : 'Latitude'
				},
				3 : {
					name : 'longitude',
					type : 'Number',
					label : 'Longitude'
				},
				4 : {
					name : 'waypointTime',
					type : 'DateTimePicker',
					label : 'Date'
				}
			};
			this.filters = new NsFilter({
				filters: this.filtersList,
				com: this.com,
				clientSide: true,
				filterContainer: this.ui.filters
			});
		},

		displayGrid: function(){
			var _this = this;
			var myCell = Backgrid.NumberCell.extend({
				decimals: 5
			});


			/*var html = Marionette.Renderer.render('app/modules/import/_gpx/templates/options-list.html');
			var optionsList = $.parseHTML(html);*/
			var optionsList;
			this.loadCollection(config.coreUrl + 'fieldActivity', function(data){
				optionsList = $.parseHTML(data);
				var option=[];
				for (var i = 0; i < optionsList.length; i++) {
					option[0]=$(optionsList[i]).text();
					option[1]=$(optionsList[i]).attr('value');
					optionsList[i] = option;
					option=[];
				};
				var columns = [

				{
					name: 'id',
					label: 'ID',
					editable: false,
					renderable: false,
					cell: 'integer'
				},
				{
					editable: true,
					name: 'import',
					label: 'Import',
					cell: 'select-row',
					headerCell: 'select-all'
				},{
					name: 'name',
					label: 'Name',
					editable: false,
					cell: 'string'
				}, {
					name: 'waypointTime',
					label: 'Date',
					editable: false,
					cell: Backgrid.DatetimeCell
				}, {
					editable: false,
					name: 'latitude',
					label: 'LAT',
					cell: myCell
				}, {
					editable: false,
					name: 'longitude',
					label: 'LON',
					cell: myCell
				},{
					editable: true,
					name: 'fieldActivity',
					label: 'Field Activity',
					cell: Backgrid.SelectCell.extend({
						optionValues: optionsList
					})
				},
			];


			_this.grid = new NsGrid({
				pageSize: _this.PageSize,
				pagingServerSide: false,
				com: _this.com,
				columns: columns,
				collection: _this.collection
			});




			//should be in the module
			_this.ui.grid.html(_this.grid.displayGrid());
			});

			

			
		},


		/*===============================================
		=            Should be in the module            =
		===============================================*/

		
		checkSelect: function (e) {
			var id = $(e.target).parent().parent().find('td').html();
			this.grid.interaction('selection', id);
			if($(e.target).is(':checked')){
				this.focus(e);
			}
		},

		checkSelectAll: function (e) {
			var ids = _.pluck(this.grid.collection.models, 'id');
			if (!$(e.target).is(':checked')) {
				this.grid.interaction('resetAll', ids);
			} else {
				this.grid.interaction('selectionMultiple', ids);
			}
		},

		focus: function (e) {
			var tr, id;
			if ($(e.target).is('td')) {
				tr = $(e.target).parent();
			} else if ($(e.target).parent().is('td')){
				tr = $(e.target).parent().parent();
			}
			id = tr.find('td').first().text();
			this.grid.interaction('focus', id);
		},

		filter: function(){
			this.filters.update();
		},
		clearFilter : function(){
			this.filters.reset();
		},
		/*-----  End of Should be in the module  ------*/

		onDestroy: function(){
		},

		check: function(){

		},
		validate: function(){
			var _this = this;
			//seturl 4 mother coll
			var datas 
			var coll = this.com.getMotherColl();
			coll = new Backbone.Collection(coll.where({import : true}));
			coll.url = config.coreUrl + 'stations/';
			Backbone.sync('create', coll, {
				success: function(data){
					_this.deferred.resolve();
					var inserted = data.new;
					var exisits = data.exist;
					Swal({
						title: 'Stations import',
						text: 'inserted stations :' + inserted + ', exisiting stations:' + exisits,
						type: 'success',
						showCancelButton: false,
						confirmButtonColor: 'rgb(147, 14, 14)',
						confirmButtonText: 'OK',
						closeOnConfirm: true,
					},
					function(isConfirm){   
						Backbone.history.navigate('home', {trigger: true})
					});
				},
				error: function(){
				},
			});

			return this.deferred;
		},
		loadCollection : function(url, callback){
			var collection =  new Backbone.Collection();
			collection.url = url;
			collection.fetch({
				success : function (data) {
					var elems = '<option value=""></option>';
					//could be a collectionView
					for (var i in data.models ) {
						var current = data.models[i];
						var value = current.get('value') || current.get('PK_id');
						var label = current.get('label') || current.get('fullname');
						elems += '<option value ='+ value +'>'+ label +'</option>';
					}
					callback(elems);
				}
			});
		}


		//check the code for rowClicked
		

	});
});
