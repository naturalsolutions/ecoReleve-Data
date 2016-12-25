define([
	'ag-grid',
	'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',
	'ns_modules/ns_bbfe/bbfe-autoCompTree',

], function(AgGrid, ObjectPicker, ThesaurusPicker) {
    
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
		    fromGrid: true
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

    return Editors;

});