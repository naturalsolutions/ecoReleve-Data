define(['jquery', 'ag-grid'], function($, AgGrid) {

    var Renderers = {};

		function Thesaurus() {
		    this.eGui = document.createElement('span');
		}

		Thesaurus.prototype.init = function (params) {
			var _this= this;

			var value = params.value;
			var dfd;

			if(value instanceof Object){
				value = params.value.value;
				dfd = params.value.dfd;
			}
			_this.formatDisplayedValue(value);

			var validators = params.colDef.schema.validators;
			if(!value && validators.length){
				// required //'cause thesaurus validators are weird
				if(validators[0] === 'required'){
					this.handleError(params);
				}
			} else {
					//async validation
				if(dfd){
					dfd.then(
					function(resp){
						//remove colname from error col
						_this.handeRemoveError(params);
						_this.formatDisplayedValue(value);
						
						params.data[params.colDef.field] = value;
					},
					function(){
						_this.handleError(params);
					});
				}
			}
		};

		Thesaurus.prototype.handeRemoveError = function(params){
			params.data[params.colDef.field] = '';
		  $(params.eGridCell).removeClass('ag-cell-error');

			var errorsColumn =  params.data['_error'];
			if(($.isArray(errorsColumn))) {
			  var index = errorsColumn.indexOf(params.colDef.field);
			  if (index > -1) {
			      errorsColumn.splice(index, 1);
			  }
			}
			params.data['_error'] = errorsColumn;
		};

		Thesaurus.prototype.handleError = function(params) {
			params.data[params.colDef.field] = '';
		  $(params.eGridCell).addClass('ag-cell-error');
		  $(this.eGui).html();

			var errorsColumn =  params.data['_error'];

			if(!($.isArray(errorsColumn))) {
			  errorsColumn = [];
			}
			errorsColumn.push(params.colDef.field);
			errorsColumn = errorsColumn.filter(function(elem, index, self) {
			    return index == self.indexOf(elem);
			})
			params.data['_error'] = errorsColumn;
		};

		Thesaurus.prototype.getGui = function() {
		  return this.eGui;
		};

		Thesaurus.prototype.formatDisplayedValue = function(value) {
			if((typeof value !== 'string')){
			  return;
			}
			var tmp = value.split('>');

			if(tmp.length > 0){
			  $(this.eGui).html(tmp[tmp.length - 1]);
			} else {
			  //$(this.eGui).html(); //?
			}
		};

		Thesaurus.prototype.refresh = function (params) {
		  this.eGui.innerHTML = '';
		  this.init(params);
		};

		Renderers.Thesaurus = Thesaurus;





		function ObjectPicker() {
	    this.eGui = document.createElement('span');
		}

		ObjectPicker.prototype.init = function (params) {
			var label = '';
			if(params.value)
				label = params.value.label || params.value;
	    $(this.eGui).html(label);
		};

		ObjectPicker.prototype.getGui = function() {
	    return this.eGui;
		};

		ObjectPicker.prototype.refresh = function (params) {
	    this.eGui.innerHTML = '';
	    this.init(params);
		};

		Renderers.ObjectPicker = ObjectPicker;





		function CheckboxRenderer() {
	    this.eGui = document.createElement('span');
		}

		CheckboxRenderer.prototype.init = function (params) {
			var checked = ''; 
			if(params.value == 1)
				checked = 'checked';

			var chk = '<input disabled class="form-control" type="checkbox" '+ checked +' />';
	    $(this.eGui).html(chk);
		};

		CheckboxRenderer.prototype.getGui = function() {
	    return this.eGui;
		};

		CheckboxRenderer.prototype.refresh = function (params) {
	    this.eGui.innerHTML = '';
	    this.init(params);
		};

		Renderers.CheckboxRenderer = CheckboxRenderer;





		function AutocompleteRenderer() {
	    this.eGui = document.createElement('span');
		}

		AutocompleteRenderer.prototype.init = function (params) {
			var label = '';
			if(params.value)
				label = params.value.label || params.value;
	    $(this.eGui).html(label);
		};

		AutocompleteRenderer.prototype.getGui = function() {
	    return this.eGui;
		};

		AutocompleteRenderer.prototype.refresh = function (params) {
	    this.eGui.innerHTML = '';
	    this.init(params);
		};

		Renderers.AutocompleteRenderer = AutocompleteRenderer;

    return Renderers;

});
