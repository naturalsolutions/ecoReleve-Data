define(['jquery', 'ag-grid'], function($, AgGrid) {

    var Renderers = {};

    var CustomRenderer = function(){
    	this.eGui = document.createElement('span'); //not sure it's necessary
    }

    CustomRenderer.prototype.init = function (params) {
    	var _this= this;
    	var value = params.value;
    	var first = true;
    	var dfd;

    	if(value instanceof Object){
    		first = true;
    		value = params.value.value;
    		dfd = params.value.dfd;
    	}
    	_this.formatDisplayedValue(value);

    	var validators = params.colDef.schema.validators;
    	if(validators.length){
    		// required //'cause thesaurus validators are weird
    		if(validators[0] === 'required'){
    				$(params.eGridCell).addClass('ag-cell-required');
    				if(!value){
    					this.handleError(params);
    				}
    		}
    	}

    	if(dfd && value){
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
    };

  	CustomRenderer.prototype.refresh = function (params) {
      this.eGui.innerHTML = '';
      this.init(params);
  	};


  	CustomRenderer.prototype.handeRemoveError = function(params){
  	  $(params.eGridCell).removeClass('ag-cell-error');

  		var errorsColumn =  params.data['_errors'];
  		if(($.isArray(errorsColumn))) {
  		  var index = errorsColumn.indexOf(params.colDef.field);
  		  if (index > -1) {
  		      errorsColumn.splice(index, 1);
  		  }
  		}
  		params.node.setDataValue('_errors', errorsColumn);
  	};

  	CustomRenderer.prototype.handleError = function(params) {
  		params.data[params.colDef.field] = '';
  	  $(params.eGridCell).addClass('ag-cell-error');
  	  //$(params.eGridCell).removeClass('ag-cell-required');
  	  $(this.eGui).html();

  		var errorsColumn =  params.data['_errors'];

  		if(!($.isArray(errorsColumn))) {
  		  errorsColumn = [];
  		}
  		errorsColumn.push(params.colDef.field);
  		errorsColumn = errorsColumn.filter(function(elem, index, self) {
  		    return index == self.indexOf(elem);
  		})
  		params.node.setDataValue('_errors', errorsColumn);
  		
  	};

  	CustomRenderer.prototype.getGui = function() {
  	  return this.eGui;
  	};
  	CustomRenderer.prototype.formatDisplayedValue = function() {
  	  
  	};


		/*
			Custom childrens
		*/



		var Thesaurus = function(options) {
				CustomRenderer.call(this, options);
		    this.eGui = document.createElement('span');
		}
		Thesaurus.prototype = new CustomRenderer();

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

		Renderers.AutocompleteRenderer = AutocompleteRenderer;

    return Renderers;

});
