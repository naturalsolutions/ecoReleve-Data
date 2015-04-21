define([
	"jquery",
	"underscore",
	"backbone",
	'marionette',
	'radio',
	'utils/datalist',
	'utils/forms',
	'config',
	'text!modules2/input/templates/individual-filter.html'
], function($, _, Backbone, Marionette, Radio, datalist, forms, config, template) {

	"use strict";

	return Marionette.ItemView.extend({
		template: template,

		events: {
			'click #clear-btn': 'clear',
			'change input[type=text]': 'update',
			'change select': 'update',
			'focus input[type=text]': 'fill',
			'submit': 'catch',
		},

		initialize: function(options) {
			this.radio = Radio.channel('individual');
			// Current filter
			this.filter =  {};
		},

		catch: function(evt) {
			evt.preventDefault();
		},

		clear: function(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			this.clearForm();
			this.filter = {};
			this.updateGrid();
		},

		clearForm: function() {
			this.$el.find('form').trigger('reset');
			this.$el.find('input').prop('disabled', false);
		},

		fill: function(evt) {
			var id = evt.target.id;
			var list = $('#'+id+'_list');
			if( list.children().length === 0 && id !== 'id') {
				var source = {
					url: config.coreUrl + 'individuals/search/values',
					data: {}
				};
				source.data.field_name = id;
				datalist.fill(source, list);
			}
		},

		setInputTextFromFilter: function(filter) {
			this.clearForm();
			for (var name in filter) {
				var value = filter[name].value;
				var op = filter[name].op;
				var input = this.$el.find('input#' + name);
				var select = this.$el.find('select#select-' + name);
				// value is not null
				if(value) {
					input.val(value);
				}
				// value is null
				else {
					forms.resetInput(input);
					input.prop('disabled', true);
				}
				select.val(op);
			}
			this.updateGrid();
		},

		onShow: function(evt) {
			if(!$.isEmptyObject(this.filter)) {
				this.setInputTextFromFilter(this.filter);
			}
			this.$el.parent().addClass('no-padding');
			var height=$(window).height();
			height -= $('#header-region').height();
			this.$el.height(height);
			$('#left-panel').css('padding-top', '0');
			this.$el.addClass('filter-bg-image');

			this.$el.find('.panel').css({'background-color' : 'rgba(0,0,0,0)', 'border':'none'});
			this.$el.find('.panel-heading').css({'border-radius':'0px'});

			this.$el.find('.panel-body').css({'background-color' : 'white'});
		},

		onDestroy: function(evt) {
			$('#left-panel').css('padding-right', '15');
			$('#left-panel').css('padding-top', '20');
		},

		onRender: function() {
		},

		update: function(evt) {
			// Input
			if (evt.target.type === 'text') {
				var name = evt.target.id;
				var input = $(evt.target);
				var value = evt.target.value;
				var op = $('select#select-' + name).val();
			}
			// Select
			else {
				var name = evt.target.id.split('-')[1];
				var input = $('input#' + name);
				var value = input.val();
				var op = evt.target.value;
			}
			switch(op) {
				case 'is':
				case 'is not':
				case 'begin with':
				case 'not begin with':
					input.prop('disabled', false);
					(value === '') ? this.removeFilter(name) : this.setFilter(name, value, op);
					break;
				case 'null':
				case 'not null':
					forms.resetInput(input);
					input.prop('disabled', true);
					this.setFilter(name, null, op);
					break;
				default:
					break;
			}
		},

		updateGrid: function() {
			this.radio.command('update', {filter:this.filter});
			//$('body').animate({scrollTop: 0}, 400);
		},

		getParams : function(){
			var inputs = $('input[type=text]');
			var criteria  = {};
			inputs.toArray().forEach(function(element){
				var input = element;
				var value = element.value;
				var name = element.id;
				var op = $('select#select-' + name).val();
				//TODO: put the switch in a function ?
				switch(op) {
					case 'is':
					case 'is not':
					case 'begin with':
					case 'not begin with':
						if(value !== '') {
							criteria[name] = {
								value: value,
								op: op
							};
						}
						break;
					case 'null':
					case 'not null':
						criteria[name] = {
							value: null,
							op: op
						};
						break;
					default:
						break;
				}
			}, this);
			return criteria;
		},
		setFilter: function(key, value, op) {
			this.filter[key] = {};
			this.filter[key]['value'] = value;
			this.filter[key]['op'] = op;
			this.updateGrid();
		},
		removeFilter: function(key) {
			if(this.filter[key]) {
				delete this.filter[key];
				this.updateGrid();
			}
		}
	});
});
