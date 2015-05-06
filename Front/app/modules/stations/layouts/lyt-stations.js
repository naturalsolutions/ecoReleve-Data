define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'radio',

	'backbone_forms',
	'ns_filter/model-filter',

	'../views/stations-grid',
	'../views/stations-map',

], function(
	$, _, Backbone, Marionette, config, Radio,
	BbForms, NSFilter,
	ViewGrid, ViewMap

){

	return Marionette.LayoutView.extend({
		className: 'full-height monitored-sites',
		template: 'app/modules/stations/templates/tpl-stations.html',

		events: {
			'click button#update' : 'update',
			'click button#display-grid' : 'displayGrid',
			'click button#display-map' : 'displayMap',
			'click button#reset' : 'reset',
			'click button#add' : 'add',
			'click button#deploy' : 'deploy',
			//'click tbody > tr': 'detail',
		},

		initialize: function(){
			this.radio = Radio.channel('route');
			this.datas={};
			this.form;
			this.datas;

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
			this.mapView= new ViewMap();
			this.gridView= new ViewGrid();
			this.filters = new NSFilter({
				filters: this.filtersList,
				channel: 'modules',
				url: config.coreUrl + 'station/',
			});


			
		},

		displayGrid: function(){
			$('.pannel-map').removeClass('active');
			$('.pannel-grid').addClass('active');
		},

		displayMap: function(){
			$('.pannel-grid').removeClass('active');
			$('.pannel-map').addClass('active');
		},

		onDestroy: function() {
			//$('body').removeClass('');
		},

		onRender: function(){

		},

		infos: function(){
			this.offset = this.gridView.getGrid().getPaginatorOffSet();
			this.limit = this.gridView.getGrid().getPageSize();
		},

		update: function(){
			this.filters.update();
		},

/*        today: function(){
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

		},*/

		reset: function(){
			this.filters.reset();
		},


		add: function(){
			this.radio.command('site:add');
		},
		deploy: function(){

			this.radio.command('site:deploy',{back_module:'site'});
		},

		detail: function(evt) {
			var row = $(evt.currentTarget);
			var id = $(row).find(':first-child').text()

			Radio.channel('route').command('site:detail', id);
		}

	});
});


