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

		className: 'full-height animated white',
		events: {
			'click span.picker': 'showPicker',
			'click #btnFilter' : 'filter',
			'click .cancel' : 'hidePicker',
		},

		ui: {
			'filters': '#filter'
		},

		pickerType: 'individual',
		url : config.coreUrl+'individuals/',

		initialize: function(options) {
			//Form.editors.Base.prototype.initialize.call(this, options);
			
			this.model = new Backbone.Model();

			this.model.set('pickerType', this.pickerType);

			var value = options.model.get(options.schema.name);
			if(value){
				this.model.set('value', value);
			}else{
				this.model.set('value', '');
			}

			if(options.schema.editable){
				this.model.set('disabled', '');
				this.model.set('visu', '');
			}else{
				this.model.set('disabled', 'disabled');
				this.model.set('visu', 'hidden');
			}

			var template =  _.template(Tpl, this.model.attributes);
			this.$el.html(template);
			this.com = new Com();
			this._input = this.$el.find('input[name="' + this.pickerType + '"]')[0];
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
				url: this.url,
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
				url: this.url,
				com: this.com,
				filterContainer: this.$el.find('#filter'),
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
