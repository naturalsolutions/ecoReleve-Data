define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'radio',

	'backbone_forms',
	'ns_filter/model-filter',

	'ns_grid/model-grid',
	'ns_map/ns_map',
	'ns_modules/ns_com',


], function(
	$, _, Backbone, Marionette, config, Radio,
	BbForms, NsFilter, NsGrid, NsMap, Com

){

	return Marionette.LayoutView.extend({
		className: 'full-height white',
		template: 'app/modules/stations/visu/templates/tpl-stations.html',

		events: {
			'click button#update' : 'update',
			'click button#displayPanelGrid' : 'displayPanelGrid',
			'click button#displayPanelMap' : 'displayPanelMap',
			'click button#reset' : 'reset',
			'click button#add' : 'add',
			'click button#deploy' : 'deploy',
			'click button#clear' : 'clearFilter'
		},
		ui: {
			'totalEntries': '#totalEntries',
		},
		initialize: function(){

			this.radio = Radio.channel('route');
			this.datas={};
			this.form;
			this.datas;
			this.com = new Com();


			this.filtersList={
				nbFieldWorker: 'DECIMAL(9, 5)',
				FieldActivity_Name: 'String',
				Region: 'String',
				Place: 'String',
				LAT: "DECIMAL(9, 5)",
				LON: "DECIMAL(9, 5)",
				Creation_date: "DATE",
			};
		},
		onShow: function(){
			$('#main-region').addClass('full-height');
			this.displayGrid();
			this.displayFilters();
			this.displayMap();
		},

		displayPanelGrid: function(){
			$('.pannel-map').removeClass('active');
			$('.pannel-grid').addClass('active');
		},

		displayPanelMap: function(){
			$('.pannel-grid').removeClass('active');
			$('.pannel-map').addClass('active');
		},
		clearFilter : function(){
			this.filters.reset();
		},
		infos: function(){
			this.offset = this.gridView.getGrid().getPaginatorOffSet();
			this.limit = this.gridView.getGrid().getPageSize();
		},

		update: function(){
			this.filters.update();
		},

		displayMap: function(){
			this.map = new NsMap({
				url: config.coreUrl + 'stations/?geo=true',
				cluster: true,
				com: this.com,
				zoom: 3,
				element : 'map',
				popup: true,
			});
			//this.map.initErrorWarning('<i>There is too much datas to display on the map. <br /> Please be more specific in your filters.</i>');
		},

		displayGrid: function(){
			var _this = this;
			this.grid= new NsGrid({
				com: this.com,
				channel: 'modules',
				url: config.coreUrl + 'stations/',
				pageSize : 24,
				pagingServerSide : true,
				name:'StationVisu',
				onceFetched: function(){
					_this.totalEntries(this.grid);
				}
			});
			
			$('#grid').html(this.grid.displayGrid());
			$('#paginator').append(this.grid.displayPaginator());
		},

		displayFilters: function(){
			this.filters = new NsFilter({
				url: config.coreUrl + 'stations/',
				com: this.com,
				name: 'StationVisu',
				filterContainer: 'filters'
			});
		},

		today: function(){
			var filters=[];
			var today = new Date();
			today.setHours(00);
			today.setMinutes(00);
			today.setSeconds(01);
			filters.push({"Column":"begin_date","Operator":">","Value": today});
			today.setHours(23);
			today.setMinutes(59);
			today.setSeconds(59);
			filters.push({"Column":"end_date","Operator":"<","Value": today});

			this.grid.update(filters);
			this.mapView.update(filters);
		},

		reset: function(){
			this.filters.reset();
		},


		add: function(){
			//this.radio.command('site:add');
		},
		deploy: function(){

			this.radio.command('site:deploy',{back_module:'site'});
		},

		detail: function(evt) {
			var row = $(evt.currentTarget);
			var id = $(row).find(':first-child').text()

			//Radio.channel('route').command('site:detail', id);
		},
		totalEntries: function(grid){
			this.total = grid.collection.state.totalRecords;
			this.ui.totalEntries.html(this.total);
		},

	});
});


