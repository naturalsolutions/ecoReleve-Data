define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'ns_grid/model-grid',
	'i18n'
], function($, _, Backbone, Marionette, config, NsGrid
){
	'use strict';
	return Marionette.LayoutView.extend({
		className: 'full-height export-layout', 
		template: 'app/modules/export/templates/tpl-export-step4.html',

		name : 'File type',


		ui:  {
			'pdfTile' : '#pdfTile',
			'csvTile' : '#csvTile',
			'gpxTile' : '#gpxTile',
		},

		events: {
			'change input' : 'changeValue',
			'click #test': 'test'
		},

		initialize: function(options){
			console.log(options.model);
			this.model = options.model;
		},

		onShow: function(){

			this.$el.find('.exp-file:first input').prop('checked', true).change();
			this.$el.find('.exp-file:first').addClass('active');
		},

		changeValue: function(e){
			this.$el.find('label.exp-file').each(function(){
				$(this).removeClass('active');
			});

			$(e.target).parent().addClass('active');

			this.model.set('fileType', $(e.target).val());
		},



		test: function(){
			var model = this.model;
			this.getFile();
		},

		validate: function(){
			return this.model;
		},

		check: function(){
			return true;
		},



		getFile: function() {
			console.log(this.model);
			var _this = this;
			this.datas = {
					fileType: this.model.get('fileType'),
					viewId: this.model.get('viewId'),
					filters: this.model.get('filters'),
					columns: this.model.get('columns'),
			};

			console.log(this.model.get('viewId'));

			console.log(this.datas);

			var route = config.coreUrl + 'export/views/getFile';

			$.ajax({
					url: route,
					data: {criteria: JSON.stringify(this.datas)},
					contentType:'application/json',
					type:'GET',
					context: this,

/*					xhrFields: {
					onprogress: function (e) {
							if (e.lengthComputable) {
									var progress = Math.floor( e.loaded / e.total * 100 ) + '%';
									console.info(progress);
									$('#progress > div').html(progress);
									$('#progress > div').width(progress);
									}
							}
					},*/


			}).done(function(data){
				var url = URL.createObjectURL(new Blob([data], {'type':'application/'+this.model.get('fileType')}));
				var link = document.createElement('a');
				link.href = url;
				link.download = this.model.get('viewId') + '_exports.' + this.model.get('fileType');
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}).fail(function(msg){

			});
		},




	});
});
