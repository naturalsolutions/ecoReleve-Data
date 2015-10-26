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
	'ns_navbar/ns_navbar',

], function($, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid,NsMap, NsForm, Navbar
){

	'use strict';

	return Marionette.LayoutView.extend({

		template: 'app/modules/individual/templates/tpl-indiv-details.html',
		className: 'full-height animated white',

		events : {
			'click #hideIndivDetails' : 'hideDetail',
			'click #showIndivDetails'  : 'showDetail',
			'click .tab-link' : 'displayTab',
		},
		ui: {
			'grid': '#grid',
			'gridEquipment': '#gridEquipment',
			'form': '#form',
			'map': '#map',
			'paginator' :'#paginator',
			'paginatorEquipment' :'#paginatorEquipment',
			'details' : '#indivLeft',
			'mapContainer' : '#indivRight',
			'showHideCtr' :'#showIndivDetails',
			'formBtns' : '#formBtns'
		},

		regions: {
			'rgNavbar': '#navbar'
		},

		initialize: function(options){
			this.translater = Translater.getTranslater();
			this.com = new Com();

			this.model = options.model;

			this.navbar = new Navbar({
				parent: this,
				globalGrid: options.globalGrid,
				model: options.model,
			});
		},

		reloadFromNavbar: function(model){
			this.map.destroy();
			this.ui.map.html('');
			this.display(model);
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			this.rgNavbar.show(this.navbar);
			this.display(this.model);
		},

		display: function(model){
			this.model = model;
			this.indivId = parseInt(this.model.get('ID'));
			this.displayForm(this.indivId);
			this.displayGrid(this.indivId);
			this.displayMap();
		},

		displayGrid: function(id){
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
				url: config.coreUrl+'individuals/' + id  + '/history',
				urlParams : this.urlParams,
				rowClicked : true,
			});
			var colsEquip = [{
					name: 'StartDate',
					label: 'Start Date',
					editable: false,
					cell : 'string'
			}, {
					name: 'Type',
					label: 'Type',
					editable: false,
					cell: 'string'
			},{
					name: 'UnicName',
					label: 'Platform',
					editable: false,
					cell: 'string'
			}, {
					name: 'Deploy',
					label: 'Status',
					editable: false,
					cell: 'string',
			}, ];
			this.gridEquip = new NsGrid({
				pageSize: 20,
				columns : colsEquip,
				pagingServerSide: false,
				url: config.coreUrl+'individuals/' + id  + '/equipment',
				urlParams : this.urlParams,
				rowClicked : true,
			});

			this.ui.grid.html(this.grid.displayGrid());
			this.ui.gridEquipment.html(this.gridEquip.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
			this.ui.paginatorEquipment.html(this.gridEquip.displayPaginator());
		},

		initMap: function(geoJson){
			this.map = new NsMap({
				geoJson: geoJson,
				zoom: 4,
				element : 'map',
				popup: true,
				cluster: true
			});
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

		displayTab : function(e){
			e.preventDefault();
			var ele = $(e.target);
			var tabLink = $(ele).attr('href');
			var tabUnLink = $('li.active.tab-ele a').attr('href');
			$('li.active.tab-ele').removeClass('active');
			$(ele).parent().addClass('active');
			$(tabLink).addClass('in active');
			$(tabUnLink).removeClass('active in');
		},

		displayForm : function(id){
			this.nsform = new NsForm({
				name: 'IndivForm',
				modelurl: config.coreUrl+'individuals',
				formRegion: this.ui.form,
				buttonRegion: [this.ui.formBtns],
				displayMode: 'display',
				objectType: this.type,
				id: id,
				reloadAfterSave : false,
				parent: this.parent
			});
		},
		hideDetail: function() {
			$(this.ui.details).animate({
					marginLeft: '-60%',
					}, 500, function() {
			});
			this.updateSize('hide');
		},
				
		showDetail: function() {
			$(this.ui.details).animate({
					marginLeft: '0',
					}, 500, function() {
			});
			this.updateSize('show');
		},
		updateSize: function(type) {
				this.map.resize();
				if(type === 'hide'){
					$(this.ui.showHideCtr).removeClass('masqued');
					$(this.ui.mapContainer).removeClass('col-md-7');
					$(this.ui.mapContainer).addClass('col-md-12');
				} else {
					$(this.ui.showHideCtr).addClass('masqued');
					$(this.ui.mapContainer).removeClass('col-md-12');
					$(this.ui.mapContainer).addClass('col-md-7');
				}
		},

	});
});
