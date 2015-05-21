define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'sweetAlert',

	'ns_stepper/lyt-step',
	'ns_modules/ns_com',
	'ns_filter/model-filter',

	'collections/waypoints',

	'../../views/import-map',
	'../../views/import-grid',
	'translater'
], function(
	$, _, Backbone, Marionette, Radio, Swal,
	Step, Com, NSFilter,
	Waypoints,
	Map, Grid,Translater
){

	'use strict';

	return Step.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/
		className: 'importGPX full-height',

		events : {
			'change #importFieldActivity' : 'setFieldActivity',
			'click #resetFieldActivity' : 'resetFieldActivity',
			'click button#filter' : 'filter',
		},
		regions: {
			gridRegion: '#gridContainer',
			mapRegion : '#mapContainer'
		},
		feedTpl: function(){
			
		},
		initModel: function(myTpl){
			this.parseOneTpl(this.template);
		},
		onShow: function(){
			var collection = this.model.get('data_FileContent') ;

			this.com = new Com();


			var myCell = Backgrid.NumberCell.extend({
				decimals: 5,
				orderSeparator: ' ',
			});

			
			Radio.channel('import').command('initGrid');

			this.grid = new Grid({
				collections : collection,
				com: this.com,
			});
			this.gridRegion.show(this.grid);

			this.map = new Map({
				com: this.com,
				collection: collection
			});

			this.mapRegion.show(this.map);
			
			this.filtersList={
				name : "String",
				latitude: "Number",
				longitude : "Number",
				datetime: "DateTimePickerBS",
				waypointTime: "DATETIME",
			};
			this.filters = new NSFilter({
				filters: this.filtersList,
				channel: 'modules',
				com: this.com,
				clientSide: true,
			});

			this.com.setMotherColl(collection);
			this.translater = Translater.getTranslater();
            this.$el.i18n();
		},

		filter: function(){
			this.filters.update();
		},
		
		setFieldActivity : function(e){
			var currentFieldVal = $(e.target).val();
			this.$el.find('#locations tr').each(function(){
				$(this).find('select').val(currentFieldVal);
			});
			var collection = this.model.get('data_FileContent') ; 
			 collection.each(function(model) {
				model.set('fieldActivity',currentFieldVal);
			});
		},

		resetFieldActivity : function(e){
			this.$el.find('#importFieldActivity').val('');
			this.$el.find('#locations tr').each(function(){
				$(this).find('select').val('');
			});
			var collection = this.model.get('data_FileContent') ; 
			 collection.each(function(model) {
				model.set('fieldActivity','');
			});
		},
		nextOK: function(){
			/*var WaypointsError = this.translater.getValueFromKey('import.waypointsError');
			var WaypointsErrorMsg = this.translater.getValueFromKey('import.waypointsErrorMsg');
*/
			var collection =this.model.get('data_FileContent').where({import: true});
			if(collection.length == 0){
			Swal({
				title: WaypointsError,
				text: WaypointsErrorMsg,
				type: 'error',
				showCancelButton: false,
				confirmButtonColor: 'rgb(147, 14, 14)',
				confirmButtonText: "OK",
				closeOnConfirm: true,
			});
				return false;
			} else {
				 return true;
			}
		}
	});

});
