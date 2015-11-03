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
	'tooltipster-list',

], function($, _, Backbone, Marionette, Swal, Translater, config, 
	Com, NsGrid, NsMap, NsForm,
	Navbar
){

	'use strict';

	return Marionette.LayoutView.extend({
		template: 'app/modules/sensor/templates/tpl-sensor-details.html',
		className: 'full-height animated white',
		events : {
			'click #hideSensorDetails' : 'hideDetail',
			'click #showSensorDetails'  : 'showDetail',
			'click #prev' : 'navigatePrev',
			'click #next' : 'navigateNext',
			'click .tab-link' : 'displayTab',
		},
		ui: {
			'grid': '#grid',
			'gridEquipment': '#gridEquipment',
			'form': '#form',
			'map': '#map',
			'paginator' :'#paginator',
			'paginatorEquipment' :'#paginatorEquipment',
			'details' : '#sensorLeft',
			'mapContainer' : '#sensorRight',
			'showHideCtr' :'#showSensorDetails',
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
			this.sensorId = this.model.get('ID');
			this.displayForm(this.sensorId);
			this.displayGrid(this.sensorId);
			this.displayMap();
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
			var url  = config.coreUrl+ 'individuals/' + this.sensorId  + '?geo=true';
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
				name: 'SensorForm',
				modelurl: config.coreUrl+'sensors',
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
			if (this.sensorId > selectedList.minId){
				//get index of current element id in list of selected elements ids
				var index = selectedList.idList.indexOf(this.sensorId);
				var prevId = selectedList.idList[(index-1)];
		this.updateView(prevId);
			}
			else {
				this.updateSensorColl('prev');
			}
    },
		navigateNext : function() {
			var selectedList  = window.app.listProperties;
			if (this.sensorId < selectedList.maxId){
				//get index of current element id in list of selected elements ids
				var index = selectedList.idList.indexOf(this.sensorId);
				var nextId = selectedList.idList[(index+1)];
				this.updateView(nextId);
			}
			else {
				this.updateSensorColl('next');
			}
		},
   updateSensorColl : function(nav){
   		var _this = this;
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
    	var url =  config.coreUrl+'sensors/';
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
            }
        });
    },
    updateLocalData :function(data,nav,currentPage){
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
			Backbone.history.navigate('sensors/'+id);
			this.displayForm(id);
			this.displayGrid(id);
			this.sensorId = id;
			// update id displayed
			$('span.ID').text('ID : '+id);
		},
		displayGrid: function(id){
			var cols = [{
                name: 'FK_Individual',
                label: 'Individual id',
                editable: false,
                cell : 'string'
            }, 
            {
                name: 'FK_MonitoredSite',
                label: 'Monitored site id',
                editable: false,
                cell : 'string'
            }, 
            {
                name: 'StartDate',
                label: 'Start date',
                editable: false,
                cell: 'string'
            }, 
            {
                name: 'Deploy',
                label: 'status',
                editable: false,
                cell: 'string'
            }
      ];
			this.grid = new NsGrid({
				pageSize: 20,
				columns : cols,
				pagingServerSide: false,
				url: config.coreUrl+'sensors/' + id  + '/history',
				urlParams : this.urlParams,
				rowClicked : true,
			});
			this.ui.grid.html(this.grid.displayGrid());
			this.ui.paginator.html(this.grid.displayPaginator());
		}
	});

});
