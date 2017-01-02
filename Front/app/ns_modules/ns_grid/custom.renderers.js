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


    return Renderers;

});
