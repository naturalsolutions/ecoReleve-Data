define(['ag-grid'], function(AgGrid) {

    var Renderers = {};

		function Thesaurus() {
		    this.eGui = document.createElement('span');
		}

		Thesaurus.prototype.init = function (params) {
		  if((typeof params.value !== 'string')){
		    return;
		  }
		  var tmp = params.value.split('>');

		  if(tmp.length > 0){
		    $(this.eGui).html(tmp[tmp.length - 1]);
		  } else {
		    $(this.eGui).html();
		  }
		};

		Thesaurus.prototype.getGui = function() {
		  return this.eGui;
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
