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
	'ns_filter/model-filter',
	'backbone_forms',
	'requirejs-text!ns_modules/ns-bbforms-editors/IndividualPicker/tpl-individual.html',
	//'requirejs-text!./tpl-individual.html',
], function(
	$, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter, Form, Tpl
){
	'use strict';
	return Form.editors.IndividualPickerEditor = Form.editors.Base.extend({
		previousValue: '',


		
		/*
		hasChanged: function(currentValue) {
			if (currentValue !== this.previousValue){
				this.previousValue = currentValue;
				this.trigger('change', this);
			}
		},

		initialize: function(options) {
			console.log('options',options);
			Form.editors.Base.prototype.initialize.call(this, options);
			this.template = options.template || this.constructor.template;
			this.options = options;
			console.log('this',this);
			console.log('options',options);
			this._input = $('<input type="text" />');



		},

		getValue: function() {
			return  this._input.val();
		},

		setValue: function(value) {

		},

		render: function(){
			var options = this.options;
			var schema = this.schema;
			var $el = $($.trim(this.template()));

			this.$el.append(this._input);

			return this;
		}*/
		//template: 'app/ns-modules/ns-bbforms-editors/IndividualPicker/tpl-individual.html',
		className: 'full-height animated white',
		events: {
            'click span.picker': 'showPicker',
            'click #btnFilter' : 'filter',
            'click .filterCancel' : 'hidePicker'
		},

		initialize: function(options) {

			console.log('options',options);
			Form.editors.Base.prototype.initialize.call(this, options);
			var template =  _.template(Tpl);
			this.$el.html(template);
			this.com = new Com();
			this._input = this.$el.find('input[name="indivpicker"]')[0];
			this.displayGrid();
			this.displayFilter();
			this.translater = Translater.getTranslater();
		},

		displayGrid: function(){
			var _this = this;
			this.grid = new NsGrid({
				pageSize: 10,
				pagingServerSide: true,
				com: this.com,
				url: config.coreUrl+'individuals/',
				urlParams : this.urlParams,
				rowClicked : true,
				totalElement : 'indiv-count'
			});

			this.grid.rowClicked = function(row){
				_this.rowClicked(row);
			};
			this.grid.rowDbClicked = function(row){
				_this.rowDbClicked(row);
			};
			
			var gridCont = this.$el.find('#grid')[0];
			$(gridCont).html(this.grid.displayGrid());
			var paginatorCont = this.$el.find('#paginator')[0];
			$(paginatorCont).html(this.grid.displayPaginator());
		},
		displayFilter: function(){
			this.filters = new NsFilter({
				url: config.coreUrl + 'individuals/',
				com: this.com,
				filterContainer: 'filter',
			});
		},
		filter: function(e){
			e.preventDefault();
			this.filters.update();
		},

		rowClicked: function(row){
			var id = row.model.get('ID');
			this.setValue(id);
		},

		rowDbClicked: function(row){
			this.rowClicked(row);
		},
		getValue: function() {
			return  $(this._input).val();
		},
		setValue: function(value) {
			$(this._input).val(value);
			this.hidePicker();
		},
		showPicker : function(){
			var modal = this.$el.find('#myModal')[0];
			$(modal).addClass('in');
			$(modal).css('display','block');
			$('body').append('<div class="modal-backdrop fade in"></div>');
		},
		hidePicker : function(){
			var myModal = this.$el.find('#myModal')[0];
			$(myModal).hide();
			$(myModal).attr('aria-hidden', true);
			$('div.modal-backdrop.fade.in').remove();
		}
	}
	);
});
