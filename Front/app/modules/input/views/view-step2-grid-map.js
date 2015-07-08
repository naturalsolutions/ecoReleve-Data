define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'moment',
	'radio',
	'models/station',
	'ns_grid/model-grid',
	'ns_map/ns_map',


], function($, _, Backbone,  Marionette, config, moment, Radio,
	Station, NsGrid,NsMap
){

	'use strict';

	return Marionette.ItemView.extend({
		template: 'app/modules/input/templates/tpl-step2-grid.html',
		className: 'ns-full-height col-xs-12 panel-container',
		events : {
			'click button#display-grid' : 'displayGrid',
			'click button#display-map' : 'displayMap',
		},

		initialize: function(options) {
			var _this = this;
			this.com = options.parent.com;

			console.log(this.parent);

			if ( options.urlParams) {
				this.urlParams = options.urlParams; 
			}

			this.parent = options.parent;
			var myCell = Backgrid.NumberCell.extend({
				decimals: 5
			});

			console.log(this.urlParams);

			this.grid = new NsGrid({
				pageSize: 20,
				pagingServerSide: true,
				com: this.com,
				url: config.coreUrl+'stations/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'stations-count'
			});

			this.grid.rowClicked = function(row){
				_this.rowClicked(row);
			};
			this.grid.rowDbClicked = function(row){
				_this.rowDbClicked(row);
			};
			this.channel='modules';
			this.radio = Radio.channel(this.channel);
			this.radio.comply(this.channel+':map:update', this.updateGeoJson, this);
		},

		onShow: function() {
			var _this= this;
			this.$el.find('#stationsGridContainer').html(_this.grid.displayGrid());
			this.$el.find('#stationsGridPaginator').html(_this.grid.displayPaginator());
			// TODO url selon type de stations
			var url  = config.coreUrl+ 'stations/?criteria=%7B%7D&lastImported=true&=true&geo=true&offset=0&order_by=%5B%5D&per_page=20';
			this.initGeoJson(url);
		},

		rowClicked: function(row) {
			this.parent.model.set('station', row.model.get('ID'));

			if(this.currentRow){
				this.currentRow.removeClass('active');
			}
			row.$el.addClass('active');
			this.currentRow = row.$el;
		},

		rowDbClicked : function(row){
			this.rowClicked(row);
			this.parent.parent.nextStepWithoutCheck();
		},
		displayGrid: function(){
			$('.pannel-map').removeClass('active');
			$('.pannel-grid').addClass('active');
		},

		displayMap: function(){
			$('.pannel-grid').removeClass('active');
			$('.pannel-map').addClass('active');
		},

        initGeoJson: function(url){
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

		initMap: function(geoJson){
			this.map = new NsMap({
				geoJson: geoJson,
				zoom: 9,
				element : 'map',
				popup: true,
				cluster: true
			});
			this.map.init();
		},
		updateGeoJson: function(args){
			var url  = config.coreUrl+ 'stations/?lastImported=true&geo=true&offset=0&order_by=%5B%5D&per_page=20';
			$('#header-loader').removeClass('hidden');
			this.xhr;

			if(this.xhr && this.xhr.readyState != 4){
				this.xhr.abort();
			}
			console.log(args);
			var filters = args.filters;
			var criteria = [];
			for (var i=0; i< filters.length; i++){
				var filter = filters[i];
				var fl = {};
				fl.Column = filters[i].Column;
				fl.Operator = filters[i].Operator;
				fl.Value = filters[i].Value;
				criteria.push(fl);
			}
			//criteria:[{"Column":"Region","Operator":"Is","Value":"Maatarka"},{"Column":"Place","Operator":"Is","Value":"Rjam Cheick"}]
			url += '&criteria=' + JSON.stringify(criteria);

			this.xhr=$.ajax({
				url: url,
				contentType:'application/json',
				type:'GET',
				context: this,
			}).done(function(datas){
				this.map.updateLayers(datas);
				$('#header-loader').addClass('hidden');
			}).fail(function(msg){
				$('#header-loader').addClass('hidden');
				console.warn(msg);
			});
		}
	});
});
