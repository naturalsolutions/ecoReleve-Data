define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'config',
	
	'backgrid'

], function(
	$, _, Backbone, Marionette, Radio, config,
	Backgrid
){

	'use strict';

	return Marionette.ItemView.extend({
		template: 'app/modules/export/templates/export-step4-preview.html',


		
		initialize: function(options) {
			this.radio = Radio.channel('exp');
			this.radio.comply('columns-update', this.updateColumns, this);
			
			this.viewName = options.viewName;
			this.filterCriteria = options.filterCriteria;
			this.boxCriteria = options.boxCriteria;
			
		},
		
		updateColumns: function(args){
			this.columnCriteria = args.columns;
			this.initDatas();

		},

		initDatas: function(){
			this.datas= {
				viewName: this.viewName,
				filters: this.filterCriteria,
				bbox: this.boxCriteria,
				columns: this.columnCriteria
			}
			this.ajaxCall();
		},


		ajaxCall: function(){
			var url = config.coreUrl + '/views/filter/' + this.viewName + '/result';

			var jqxhr = $.ajax({
				url: url,
				data: JSON.stringify({criteria: this.datas}),
				contentType:'application/json',
				type:'POST',
				context: this,
			}).done(function(data){
				this.displayGrid(data);
			}).fail(function(msg){
				console.error(msg);
			});
		},


		onShow: function() {

		},


		displayGrid: function(data){
			var collection = new Backbone.Collection(data.rows);

			var col=[]
			for (var i = 0; i < data.columns.length; i++) {
				col.push({
					name: data.columns[i],
					label: data.columns[i],
					editable: false,
					cell: 'string'
				});
			};


			this.grid = new Backgrid.Grid({
				columns: col,
				collection: collection
			});

			this.$el.find("#grid").html(this.grid.render().el);
		},

	});
});
