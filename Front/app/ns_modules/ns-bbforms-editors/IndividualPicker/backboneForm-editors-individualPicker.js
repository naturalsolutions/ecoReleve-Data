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
], function(
	$, _, Backbone, Marionette, Swal, Translater, config,
	Com, NsGrid, NsFilter, Form, Tpl
){
	'use strict';
	return Form.editors.IndividualPicker = Form.editors.Base.extend({
		previousValue: '',

		className: 'full-height animated white',
		events: {
			'click span.picker': 'showPicker',
			'click #btnFilter' : 'filter',
			'click .cancel' : 'hidePicker',
		},

		initialize: function(options) {
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
				pageSize: 20,
				pagingServerSide: true,
				com: this.com,
				url: config.coreUrl+'individuals/',
				urlParams : this.urlParams,
				rowClicked : true,
			});

			this.grid.rowClicked = function(args){
				_this.rowClicked(args.row);
			};
			this.grid.rowDbClicked = function(args){
				_this.rowDbClicked(args.row);
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
			$(this._input).val(value).change();
			this.hidePicker();
		},
		showPicker : function(){
			this.$el.find('#modal-outer').fadeIn('fast');
		},
		hidePicker : function(){
			this.$el.find('#modal-outer').fadeOut('fast');
		}
	}
	);
});
