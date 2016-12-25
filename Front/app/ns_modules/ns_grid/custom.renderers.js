define(['ag-grid'], function(AgGrid) {

    var Renderers = {};

		function Thesaurus() {
		    this.eGui = document.createElement("span");
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


    return Renderers;

});
