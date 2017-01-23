define(['jquery', 'ag-grid'], function($, AgGrid) {

    var Renderers = {};

    var CustomRenderer = function(){
    }

    CustomRenderer.prototype.init = function (params) {
    	this.eGui = document.createElement('span'); //not sure it's necessary
			this.afterInit(params);
    };

    CustomRenderer.prototype.afterInit = function(params) {
    	var _this= this;
    	var value = params.value;
    	var dfd;
    	var valueTodisplay;


    	if(value instanceof Object){
    		value = params.value.value;
    		dfd = params.value.dfd;
    		valueTodisplay = params.value.label;
    	}

			if(!valueTodisplay)
				valueTodisplay = value;

    	_this.formatValueToDisplay(valueTodisplay);

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

			//could be a call whith params.colDef
    	if(dfd && value){
    		dfd.then(
    		function(resp){
    			_this.handeRemoveError(params);
    			_this.formatValueToDisplay(valueTodisplay);
    			
    			_this.manualDataSet(params, value);
    		},
    		function(){
    			_this.handleError(params);
    		});
    	} else {
				this.manualDataSet(params, value)
    	}
    };

    CustomRenderer.prototype.manualDataSet = function(params, value) {
    	//critic
    	if(!this.error){
    		params.data[params.colDef.field] = value;
    	}
    };

  	CustomRenderer.prototype.refresh = function (params) {
      this.eGui.innerHTML = '';
      this.afterInit(params);
  	};


  	CustomRenderer.prototype.handeRemoveError = function(params){
  		this.error = false;
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
  		this.error = true;
  		params.data[params.colDef.field] = '';
  	  $(params.eGridCell).addClass('ag-cell-error');
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
  	CustomRenderer.prototype.formatValueToDisplay = function(value) {
  	  $(this.eGui).html(value);
  	};




		/*
			Custom childrens
		*/

		var Thesaurus = function(options) {}
		Thesaurus.prototype = new CustomRenderer();

		Thesaurus.prototype.formatValueToDisplay = function(value) {
			if((typeof value !== 'string')){
			  return;
			}
			var tmp = value.split('>');

			//not sure
			$(this.eGui).html(tmp[tmp.length - 1]);
			
			/*if(tmp.length > 0){
			} else {
			  //$(this.eGui).html(); //?
			}*/
		};



		var ObjectPicker = function () {}
		ObjectPicker.prototype = new CustomRenderer();




		var CheckboxRenderer = function() {}
		CheckboxRenderer.prototype = new CustomRenderer();
		CheckboxRenderer.prototype.formatValueToDisplay = function (value) {
			var checked = ''; 
			if(value == 1)
				checked = 'checked';

			var chk = '<input disabled class="form-control" type="checkbox" '+ checked +' />';
	    $(this.eGui).html(chk);
		};




		var AutocompleteRenderer = function() {}
		AutocompleteRenderer.prototype = new CustomRenderer();




		Renderers.Thesaurus = Thesaurus;
		Renderers.ObjectPicker = ObjectPicker;
		Renderers.CheckboxRenderer = CheckboxRenderer;
		Renderers.AutocompleteRenderer = AutocompleteRenderer;

    return Renderers;

});
