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
	'ns_map/ns_map',
	'ns_form/NSFormsModuleGit',

], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid,NsMap, NsForm
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/individual/templates/tpl-indiv-details.html',
		className: 'full-height animated white',

		events : {
		},

		ui: {
			'grid': '#grid',
			'form': '#form',
			'map': '#map',
			'paginator' :'#paginator'
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.com = new Com();
			this.indivId = options.id;

		},

		onRender: function(){

			this.$el.i18n();
		},

		onShow : function(){
			this.displayForm();
			this.displayGrid();
			this.displayMap();
		},

		displayGrid: function(){
			var cols = [{
                name: 'Name',
                label: 'Name',
                editable: false,
                cell : 'string'
            }, {
                name: 'value',
                label: 'Value',
                editable: false,
                cell: 'string'
            }, {
                name: 'StartDate',
                label: 'Start Date',
                editable: false,
                cell: 'string',
            }, ];
			this.grid = new NsGrid({
				pageSize: 20,
				columns : cols,
				pagingServerSide: false,
				//com: this.com,
				url: config.coreUrl+'individuals/' + this.indivId  + '/history',
				urlParams : this.urlParams,
				rowClicked : true,
				//totalElement : 'indiv-count',
				//name : 'IndivHistory'
			});

			// this.grid.rowClicked = function(row){
			// 	_this.rowClicked(row);
			// };
			// this.grid.rowDbClicked = function(row){
			// 	_this.rowDbClicked(row);
			// };
			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
		},

		initMap: function(geoJson){
			this.map = new NsMap({
				geoJson: geoJson,
				zoom: 4,
				element : 'map',
				popup: true,
				cluster: true
			});
			//this.map.init();
		},

		displayMap: function(){

			var url  = config.coreUrl+ 'individuals/' + this.indivId  + '?geo=true';
			$.ajax({
				url: url,
				contentType:'application/json',
				type:'GET',
				context: this,
			}).done(function(datas){
				this.initMap(datas);
			}).fail(function(msg){
				console.error(msg);
			});
		},
		displayForm : function(){
			var id = this.indivId;
			this.nsform = new NsForm({
				name: 'IndivForm',
				modelurl: config.coreUrl+'individuals',
				buttonRegion: [],
				formRegion: 'form',
				displayMode: 'display',
				objecttype: this.type,
				id: id,
				reloadAfterSave : false,
				parent: this.parent
			});
		}

	});
});
