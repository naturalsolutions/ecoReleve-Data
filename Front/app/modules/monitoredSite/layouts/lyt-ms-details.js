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
	Com, NsGrid, NsMap, NsForm
){

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/

		template: 'app/modules/monitoredSite/templates/tpl-ms-details.html',
		className: 'full-height animated white',

		events : {
			'click #hideIndivDetails' : 'hideDetail',
			'click #showDetails'  : 'showDetail',
			'click #prev' : 'navigatePrev',
			'click #next' : 'navigateNext'
		},
		ui: {
			'grid': '#grid',
			'form': '#form',
			'map': '#map',
			'paginator' :'#paginator',
			'details' : '#infos',
			'mapContainer' : '#mapContainer',
			'showHideCtr' :'#showDetails',
			'formBtns' : '#formBtns'
		},

		initialize: function(options){


			this.translater = Translater.getTranslater();
			this.com = new Com();
			

			this.indivId = parseInt(options.id);
		},

		onRender: function(){
			this.$el.i18n();
		},

		onShow : function(){
			console.log('passed');
			this.displayForm(this.indivId);
			this.displayGrid(this.indivId);
			this.displayMap();
			$(this.ui.showHideCtr).html('<span class="glyphicon glyphicon-chevron-right big"></span><span class="ID rotate">ID : '+this.indivId+'</span>');
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
				//com: this.com,
				url: config.coreUrl+'monitoredSite/' + id  + '/history',
				urlParams : this.urlParams,
				rowClicked : true,

			});

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
		},
		displayMap: function(){

			var url  = config.coreUrl+ 'monitoredSite/' + this.indivId  + '?geo=true';
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
		displayForm : function(id){
			this.nsform = new NsForm({
				name: 'IndivForm',
				modelurl: config.coreUrl+'monitoredSite',
				buttonRegion: [],
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
		navigatePrev : function() {
			var selectedList  = window.app.listProperties;
			if (this.indivId > selectedList.minId){
				//get index of current element id in list of selected elements ids
				var index = selectedList.idList.indexOf(this.indivId);
				var prevId = selectedList.idList[(index-1)];
				this.updateView(prevId);
			}
			else {
				this.updateIndivColl('prev');
			}
		},
		navigateNext : function() {
			var selectedList  = window.app.listProperties;
			if (this.indivId < selectedList.maxId){
				//get index of current element id in list of selected elements ids
				var index = selectedList.idList.indexOf(this.indivId);
				var nextId = selectedList.idList[(index+1)];
				this.updateView(nextId);
			}
			else {
				this.updateIndivColl('next');
			}
		},
	   updateIndivColl : function(nav){
			var _this = this;
			//  call ajax to update data (next/ prev page on pagination)
			// get url params to make ajax call
			var storedList = window.app.listProperties;
			var  nbPages  = storedList.state.totalPages;
			var currentPage = storedList.state.currentPage;
			var criteria = storedList.criteria;

			switch(nav){
				case 'next':
					if(currentPage < nbPages){
						currentPage +=1;
					} else {
						currentPage =1;
					}
					break;
				case 'prev':
					if(currentPage > 1){
						currentPage -=1;
					} else {
						currentPage =nbPages;
					}
					break;

				default:
					break;
			}
			
			var order_by = [];
			var per_page = 20;
			var offset = (currentPage-1) * per_page;

			
			var data = {
				offset:offset,
				per_page: per_page,
				order_by: JSON.stringify(order_by),
				criteria : JSON.stringify(criteria)
			};
			var url =  config.coreUrl+'monitoredSite/'; //?offset=' + offset  + '&per_page=' + per_page  + '&order_by=%5B%5D';//+ '&order_by=' + order_by 
			$.ajax({
				url:url,
				context:this,
				type:'GET',
				dataType:'json',
				data : (data),
				success: function(data){
					_this.updateLocalData(data,nav,currentPage);
				},
				error: function(data){
				   /* Swal({
						title: "Change individual",
						text: 'Error to navigate to another individual.',
						type: 'error',
						showCancelButton: false,
						confirmButtonColor: 'rgb(147, 14, 14)',
						confirmButtonText: "OK",
						closeOnConfirm: true
					});*/
				}
			});
		},
		updateLocalData :function(data,nav,currentPage){
			//console.log(data);
			var storedList = window.app.listProperties;
			//get list of ids for the new page elements
			var idList = [];
			data[1].forEach(function(ele) {
				idList.push(ele.ID);
			});
			idList.sort();
			var newId ;
			if(nav=='next'){
				newId = idList[0];
			} else {
				newId = idList[(idList.length) - 1];
			}
			this.updateView(newId);
			storedList.state.currentPage = currentPage;	
			storedList.idList = idList;
			storedList.minId = idList[0];
			storedList.maxId = idList[(idList.length) - 1];
		},
		updateView : function(id){
			Backbone.history.navigate('individual/'+id);
			this.displayForm(id);
			this.displayGrid(id);
			this.indivId = id;
			// update id displayed
			$('span.ID').text('ID : '+id);
		}
	});
});
