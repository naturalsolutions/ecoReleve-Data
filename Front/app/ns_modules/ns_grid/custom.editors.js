define([
	'jquery',
	'ag-grid',
	'backbone-forms',
	'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',
	'ns_modules/ns_bbfe/bbfe-autoCompTree',
	'ns_modules/ns_bbfe/bbfe-autocomplete',

], function($, AgGrid, Form, ObjectPicker, ThesaurusPicker, Autocomplete) {
    
    var Editors = {};

    var Thesaurus = function () {
    };
		Thesaurus.prototype.init = function(params){     
		  var col = params.column.colDef;
		  var options = {
		    key: col.options.target || col.field,
		    schema: {
		      options: col.options,
		      editable: true,
		    },
		    formGrid: true
		  };

		  var model = new Backbone.Model();
		  model.set(options.key, params.value);

		  options.model = model;

		  this.picker = new ThesaurusPicker(options);
		  this.element = this.picker.render();
		  
		  this.addDestroyableEventListener(this.getGui(), 'mousedown', function (event) {
		    event.stopPropagation();
		  });

		  this.addDestroyableEventListener(this.getGui(), 'keydown', function (event) {
		      var isNavigationKey = event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40;
		      if (isNavigationKey) {
		          event.stopPropagation();
		      }
		  });

		  if (params.charPress){
		    this.element.$el.find('input').val(params.charPress).change();
		  } else {
		    if (params.value){
		      if (params.value.label !== undefined){
		        this.element.$el.find('input').attr('data_value',params.value.value);
		        this.element.$el.find('input').val(params.value.label).change();
		      } else {
		        this.element.$el.find('input').val(params.value).change();
		      }
		    }
		  }
		};
		Thesaurus.prototype.addDestroyableEventListener = function(eElement, event, listener){
		  eElement.addEventListener(event, listener);
		}
		Thesaurus.prototype.getGui = function(){
		  return this.element.el;
		};
		Thesaurus.prototype.afterGuiAttached = function () {
		  this.element.$el.find('input').focus();
		};
		Thesaurus.prototype.getValue = function(){
		  if (this.element.getItem){
		    return this.element.getItem();
		  }
		  return this.element.getValue();
		};
		Thesaurus.prototype.destroy= function(){
		  return true;
		}

		Editors.Thesaurus = Thesaurus;





    var ObjectPickerEditor = function () {
    };
		ObjectPickerEditor.prototype.init = function(params){
		  var col = params.column.colDef;

		  var options = {
		    key: col.options.target || col.field,
		    schema: {
		      options: col.options,
		      editable: true,
		    },
		    formGrid: true
		  };

		  var model = new Backbone.Model();
		  
		  var value = '';
		  if(params.value){
		  	value = params.value.value || params.value;
		  }
		  model.set(options.key, value);

		  options.model = model;

		  this.picker = new ObjectPicker(options);
		  this.element = this.picker.render();
		  
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
		ObjectPickerEditor.prototype.addDestroyableEventListener = function(eElement, event, listener){
		  eElement.addEventListener(event, listener);
		}
		ObjectPickerEditor.prototype.getGui = function(){
		  return this.element.el;
		};
		ObjectPickerEditor.prototype.afterGuiAttached = function(){
		  this.element.$el.find('input').focus();
		};
		ObjectPickerEditor.prototype.getValue = function(){
		  if (this.element.getItem){
		    return this.element.getItem();
		  }
		  return this.element.getValue();
		};
		ObjectPickerEditor.prototype.destroy= function(){
		  return true;
		}

		Editors.ObjectPicker = ObjectPickerEditor;





    var NumberEditor = function () {
    };
		NumberEditor.prototype.init = function(params){
			var col = params.column.colDef;

			var options = {
			  key: col.field,
			  schema: {
			    options: col.options,
			    editable: true,
			    editorClass: 'form-control'
			  },
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
		NumberEditor.prototype.addDestroyableEventListener = function(eElement, event, listener){
		  eElement.addEventListener(event, listener);
		}
		NumberEditor.prototype.getGui = function(){
			this.element.$el.addClass('form-control');
		  return this.element.el;
		};
		NumberEditor.prototype.afterGuiAttached = function(){
		  this.element.$el.focus();
		};
		NumberEditor.prototype.getValue = function(){
		  return this.element.getValue();
		};
		NumberEditor.prototype.destroy= function(){
		  return true;
		}

		Editors.NumberEditor = NumberEditor;





    var CheckboxEditor = function () {
    };
		CheckboxEditor.prototype.init = function(params){
			var col = params.column.colDef;

			var options = {
			  key: col.field,
			  schema: {
			    options: col.options,
			    editable: true,
			    editorClass: 'form-control'
			  },
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
		CheckboxEditor.prototype.addDestroyableEventListener = function(eElement, event, listener){
		  eElement.addEventListener(event, listener);
		}
		CheckboxEditor.prototype.getGui = function(){
			this.element.$el.addClass('form-control');
			this.element.$el.css({
				'margin': '5px'
			});
		  return this.element.el;
		};
		CheckboxEditor.prototype.afterGuiAttached = function(){
		  this.element.$el.focus();
		};
		CheckboxEditor.prototype.getValue = function(){
		  return this.element.getValue();
		};
		CheckboxEditor.prototype.destroy= function(){
		  return true;
		}

		Editors.CheckboxEditor = CheckboxEditor;





    var AutocompleteEditor = function () {
    };
		AutocompleteEditor.prototype.init = function(params){
			var col = params.column.colDef;

			console.log(col.options);

			var options = {
			  key: col.field,
			  schema: {
			    options: col.options,
			    editable: true,
			    editorClass: 'form-control'
			  },
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
		AutocompleteEditor.prototype.addDestroyableEventListener = function(eElement, event, listener){
		  eElement.addEventListener(event, listener);
		}
		AutocompleteEditor.prototype.getGui = function(){
		  return this.element.el;
		};
		AutocompleteEditor.prototype.afterGuiAttached = function(){
		  this.element.$el.find('input').focus();
		};
		AutocompleteEditor.prototype.getValue = function(){
		  return this.element.getValue();
		};
		AutocompleteEditor.prototype.destroy= function(){
		  return true;
		}

		Editors.AutocompleteEditor = AutocompleteEditor;
    return Editors;

});