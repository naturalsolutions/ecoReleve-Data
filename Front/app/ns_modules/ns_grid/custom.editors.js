define([
	'jquery',
	'ag-grid',
	'backbone-forms',
	'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',
	'ns_modules/ns_bbfe/bbfe-autoCompTree',
	'ns_modules/ns_bbfe/bbfe-autocomplete',

], function($, AgGrid, Form, ObjectPicker, ThesaurusPicker, Autocomplete) {
    
    var Editors = {};

		var CustomEditor = function(){
		};

		CustomEditor.prototype.init = function(eElement, event, listener){
		  
		}

		CustomEditor.prototype.addDestroyableEventListener = function(eElement, event, listener){
		  eElement.addEventListener(event, listener);
		  this.destroyFunctions.push(function(){
		  	eElement.removeEventListener(event, listener);
		  });
		}
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



    var Thesaurus = function () {

    };
		
		Thesaurus.prototype = new CustomEditor();

		Thesaurus.prototype.init = function(params){

		  var col = params.column.colDef;

		  var value = params.value;
		  if(value instanceof Object){
		  	value = params.value.value;
		  }

			this.params = params;

		  var options = {
		    key: col.options.target || col.field,
		    schema: col.schema,
		    formGrid: true
		  };

		  var model = new Backbone.Model();
		  model.set(options.key, value);
		  options.model = model;

		  this.bbfe = new ThesaurusPicker(options);
		  this.element = this.bbfe.render();
		 



			//?
/*			if (params.charPress){
		    this.element.$el.find('input').val(params.charPress).change();
		  } else {
		    if (params.value){
		      if (params.value.label !== undefined){
		        this.element.$el.find('input').attr('data_value', params.value.value);
		        this.element.$el.find('input').val(params.value.label).change();
		      } else {
		        this.element.$el.find('input').val(params.value).change();
		      }
		    }
		  }*/

		  this.preventNavigationEvents();
		};

		Thesaurus.prototype.getValue = function(){
			var value = this.element.getValue();
			var dfd = this.element.validateAndTranslate(value);
			//var error = this.element.commit();

			return {
				value: value,
				dfd: dfd,
				//error: error
			};

		};


		Editors.Thesaurus = Thesaurus;



    var ObjectPickerEditor = function () {
    };

		ObjectPickerEditor.prototype = new CustomEditor();

		ObjectPickerEditor.prototype.init = function(params){
		  var col = params.column.colDef;

		  var options = {
		    key: col.options.target || col.field,
		    schema: col.schema,
		    formGrid: true
		  };

		  var model = new Backbone.Model();
		  
		  var value = '';
		  if(params.value){
		  	value = params.value.value || params.value;
		  }
		  model.set(options.key, value);

		  options.model = model;

		  this.bbfe = new ObjectPicker(options);
		  this.element = this.bbfe.render();

		  this.preventNavigationEvents();

		};

		ObjectPickerEditor.prototype.getValue = function(){
		  if (this.element.getItem){
		    return this.element.getItem();
		  }
		  return this.element.getValue();
		};


		Editors.ObjectPicker = ObjectPickerEditor;





    var NumberEditor = function () {
    };

    NumberEditor.prototype = new CustomEditor();

		NumberEditor.prototype.init = function(params){
			var col = params.column.colDef;

			var options = {
			  key: col.field,
			  schema: col.schema,
			  formGrid: true
			};

			
		  var model = new Backbone.Model();
		  
		  var value = '';
		  if(params.value){
		  	value = params.value.value || params.value;
		  }
		  model.set(options.key, value);

		  options.model = model;
		  this.bbfe = new Form.editors.Number(options);
		  this.element = this.bbfe.render();
		  
		  this.preventNavigationEvents();
		};

		Editors.NumberEditor = NumberEditor;





    var CheckboxEditor = function () {
    };
    CheckboxEditor.prototype = new CustomEditor();

		CheckboxEditor.prototype.init = function(params){
			var col = params.column.colDef;

			var options = {
			  key: col.options.target || col.field,
			  schema: col.schema,
			  formGrid: true
			};

			
		  var model = new Backbone.Model();
		  
		  var value = '';
		  if(params.value){
		  	value = params.value.value || params.value;
		  }
		  model.set(options.key, value);

		  options.model = model;

		  this.bbfe = new Form.editors.Checkbox(options);
		  this.element = this.bbfe.render();
		  
		  this.preventNavigationEvents();
		};

		CheckboxEditor.prototype.getGui = function(){
			this.element.$el.css({
				'margin': '5px 10px'
			});
		  return this.element.el;
		};
		Editors.CheckboxEditor = CheckboxEditor;



    var AutocompleteEditor = function () {
    };

    AutocompleteEditor.prototype = new CustomEditor();
		AutocompleteEditor.prototype.init = function(params){
			var col = params.column.colDef;

			var options = {
			  key: col.options.target || col.field,
			  schema: col.schema,
			  formGrid: true
			};

			
		  var model = new Backbone.Model();
		  
		  var value = '';
		  if(params.value){
		  	value = params.value.value || params.value;
		  }
		  model.set(options.key, value);

		  options.model = model;

		  this.bbfe = new Autocomplete(options);
		  this.element = this.bbfe.render();
		  
		  this.preventNavigationEvents();
		};


		Editors.AutocompleteEditor = AutocompleteEditor;
    return Editors;

});