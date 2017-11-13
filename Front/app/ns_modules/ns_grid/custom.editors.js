define([
	'jquery',
	'ag-grid',
	'backbone-forms',
	'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',
	'ns_modules/ns_bbfe/bbfe-autocompTree',
	'ns_modules/ns_bbfe/bbfe-autocomplete',
	'ns_modules/ns_bbfe/bbfe-dateTimePicker',
	'ns_modules/ns_bbfe/bbfe-timePicker',
	'ns_modules/ns_bbfe/bbfe-select',

], function($, AgGrid, Form,
	ObjectPicker,
	ThesaurusPicker,
	AutocompletePicker,
	DateTimePicker,
	TimePicker,
	SelectPicker
){

    var Editors = {};

		var CustomEditor = function(){
		};

		CustomEditor.prototype.init = function(params){
			//Insert new line if this is last one
			// if(params.node.lastChild){
			// 	params.api.addItems([{}]); //redraw every rows
			// 	params.api.startEditingCell({ colKey: params.column.colDef.field, rowIndex: params.node.childIndex });
			// }

		  var col = params.column.colDef;

		  var value = params.value;

			if(params.charPress){
				if(value instanceof Object){
					value.displayValue = params.charPress;
					value.value = params.charPress;
				} else {
					value = params.charPress;
				}
			}
		  var options = {
		    key: col.field,
		    schema: col.schema,
		    formGrid: true,
		  };
			if(col.form){
				options.form = col.form;
			}
		  var model = new Backbone.Model();
		  model.set(options.key, value);
		  options.model = model;
			this.params = params;

			this.initBBFE(options);

		  this.preventNavigationEvents();

		  window.formInEdition.form['.js-obs-form'] = { 'formChange': true};
		};

		CustomEditor.prototype.initBBFE = function(options){

		};

		CustomEditor.prototype.addDestroyableEventListener = function(eElement, event, listener){
		  eElement.addEventListener(event, listener);
		  this.destroyFunctions.push(function(){
		  	eElement.removeEventListener(event, listener);
		  });
		};

		CustomEditor.prototype.getGui = function(){
		  return this.element.el;
		};


		CustomEditor.prototype.afterGuiAttached = function () {
		  this.element.$el.focus();
		  this.element.$el.find('input').focus();
		};

		CustomEditor.prototype.destroy= function(){
			this.destroyFunctions.forEach(function (func) { return func(); });
			this.bbfe.remove();
		  return true;
		};

		CustomEditor.prototype.getValue = function(){
			if (this.element.schema.type ==='StateBox') { //hack
				return this.element.getValue();
			}
			if(this.element.getValue() === "" || this.element.getValue() === null){
				return;
			}
		  return this.element.getValue();
		};

		CustomEditor.prototype.preventNavigationEvents = function(){
			this.destroyFunctions = [];

		  this.addDestroyableEventListener(this.getGui(), 'mousedown', function (event) {
		    event.stopPropagation();
		  });

		  this.addDestroyableEventListener(this.getGui(), 'keydown', function (event) {
	      var isNavigationKey = event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40;
	      if (isNavigationKey) {
	        event.stopPropagation();
	      }
		  });
		};


    var ThesaurusEditor = function () {};
		ThesaurusEditor.prototype = new CustomEditor();

		ThesaurusEditor.prototype.initBBFE = function(options){
		  var _this = this;
			this.bbfe = new ThesaurusPicker(options);

			this.bbfe.itemClick = function(){
				_this.element.$el.change();
			};
			this.bbfe.getValue = function(){
				var displayValue = this.getDisplayedValue();
				this.validateValue(displayValue);
				return ThesaurusPicker.prototype.getValue.call(this,options);
			};
		  this.element = this.bbfe.render();
		};

		ThesaurusEditor.prototype.getValue = function(){
			if( this.bbfe.schema.editable ) {
				return {
					value: this.element.getValue(),
					displayValue: this.element.getDisplayedValue(),
					error: this.element.isTermError,
				}			
			}
			else {
			return {
				value: this.bbfe.value.value,
				displayValue : this.bbfe.value.displayValue,
				error : this.bbfe.isTermError,
			}
		}
		};


    var ObjectPickerEditor = function () {};
		ObjectPickerEditor.prototype = new CustomEditor();

		ObjectPickerEditor.prototype.initBBFE = function(options){
		  this.bbfe = new ObjectPicker(options);
		  this.element = this.bbfe.render();
		};

		ObjectPickerEditor.prototype.getValue = function(){
		  return {
		  	value: this.element.getValue(),
		  	displayValue: this.element.getDisplayValue(),
		  }
		};


    var AutocompleteEditor = function () {};

    AutocompleteEditor.prototype = new CustomEditor();
		AutocompleteEditor.prototype.initBBFE = function(options){
		  this.bbfe = new AutocompletePicker(options);
		  this.element = this.bbfe.render();
		};

		// AutocompleteEditor.prototype.getValue = function(){
		//   return {
		//   	value: this.element.getValue(),
		//   	displayValue: this.element.$input[0].value //not sure why
		//   }
		// };


    var NumberEditor = function () {};
    NumberEditor.prototype = new CustomEditor();

		NumberEditor.prototype.initBBFE = function(options){
		  this.bbfe = new Form.editors.Number(options);
		  this.element = this.bbfe.render();
		};

    var TextEditor = function () {};
    TextEditor.prototype = new CustomEditor();

		TextEditor.prototype.initBBFE = function(options){
		  this.bbfe = new Form.editors.Text(options);
		  this.element = this.bbfe.render();
		};

		TextEditor.prototype.getValue = function(){
		 return this.element.getValue();
		};

    var CheckboxEditor = function () {};
    CheckboxEditor.prototype = new CustomEditor();

		CheckboxEditor.prototype.initBBFE = function(options){
		  this.bbfe = new Form.editors.Checkbox(options);
		  this.element = this.bbfe.render();
		};

		CheckboxEditor.prototype.getGui = function(){
			this.element.$el.css({
				'margin': '5px 10px'
			});
		  return this.element.el;
		};

    var StateBoxEditor = function () {};
    StateBoxEditor.prototype = new CustomEditor();

		StateBoxEditor.prototype.initBBFE = function(options){
		  this.bbfe = new Form.editors.StateBox(options);
		  this.element = this.bbfe.render();
			if( this.params.eGridCell.className.indexOf('ag-cell-error') == -1 ) { //hack when cell in error no need to add margin left
				this.element.$el.find('label').css({'margin-left':'10px'})
			}


		};

			StateBoxEditor.prototype.afterGuiAttached = function () {
		  this.element.$el.focus();
		  this.element.$el.find('label').focus();
		};

		StateBoxEditor.prototype.getGui = function(){
			//  this.element.$el.css({
			//  	'margin-left': '10px'
			//  });
		  return this.element.el;
		};


    var DateTimeEditor = function () {};

    DateTimeEditor.prototype = new CustomEditor();
		DateTimeEditor.prototype.initBBFE = function(options){
		  this.bbfe = new DateTimePicker(options);
		  this.element = this.bbfe.render();

		};

    var SelectEditor = function () {};

    SelectEditor.prototype = new CustomEditor();
		SelectEditor.prototype.initBBFE = function(options){
		  this.bbfe = new SelectPicker(options);
			this.element = this.bbfe.render();
			if(this.element.value instanceof Object){
				this.element.value = this.element.value.value;
			}
		};

		SelectEditor.prototype.afterGuiAttached = function () {
			this.element.$el.focus();
		};


		SelectEditor.prototype.getValue = function(){
			return this.element.getValue();
		};


		Editors.ThesaurusEditor = ThesaurusEditor;
		Editors.ObjectPicker = ObjectPickerEditor;
		Editors.NumberEditor = NumberEditor;
		Editors.TextEditor = TextEditor;
		Editors.StateBoxEditor = StateBoxEditor;
		Editors.CheckboxEditor = CheckboxEditor;
		Editors.AutocompleteEditor = AutocompleteEditor;
		Editors.DateTimeEditor = DateTimeEditor;
		Editors.SelectEditor = SelectEditor;

    return Editors;

});
