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
    	var valueTodisplay;

    	if(value instanceof Object){
    		value = params.value.value;
    		valueTodisplay = params.value.label;
    	}

			if(!valueTodisplay)
				valueTodisplay = value;

    	_this.formatValueToDisplay(valueTodisplay);

				//could be a call whith params.colDef
    	if(this.deferred && value){
    		this.deferredValidation(params, value);
    	} else {
    		var validators = params.colDef.schema.validators;
    		if(validators.length){
    			
    			if(validators[0] === 'required'){
    					$(params.eGridCell).addClass('ag-cell-required');
    					if(!value){
    						this.handleError(params);
    					} else {
		    				this.handleRemoveError(params);
								this.manualDataSet(params, value);
    					}
    			} else {
						this.handleRemoveError(params);
            if(value){
						  this.manualDataSet(params, value);
            }
    			}

    		}
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


  	CustomRenderer.prototype.handleRemoveError = function(params){
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
  	  //$(this.eGui).html();

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

    CustomRenderer.prototype.deferredValidation = function() {
  	  return false;
  	};
  	CustomRenderer.prototype.formatValueToDisplay = function(value) {
  	  $(this.eGui).html(value);
  	};

		var Thesaurus = function(options) {}
    Thesaurus.prototype = new CustomRenderer();
    Thesaurus.prototype.deferred = true;

		Thesaurus.prototype.deferredValidation = function(params, value){
      var _this = this;
      var TypeField = 'FullPath';
      if (value && value.indexOf('>') == -1) {
          TypeField = 'Name';
      }  
      var data = {
        sInfo: value,
        sTypeField: TypeField,
        iParentId: params.colDef.schema.options.startId,
        lng: params.colDef.schema.options.lng //language
      };

      var url = params.colDef.schema.options.wsUrl + '/getTRaductionByType';

      $.ajax({
        url: url,
        data: JSON.stringify(data),
        dataType: 'json',
        type: 'POST', //should be a GET
        contentType: 'application/json; charset=utf-8',
        success: function (data){
          if(data['TTop_FullPath'] != null){
            _this.formatValueToDisplay(data['TTop_NameTranslated']);
            _this.handleRemoveError(params);
            _this.manualDataSet(params, data['TTop_FullPath']);
          } else {
            _this.handleError(params);
          }
        },
        error: function (data) {
          if (data.statusText == 'abort') {
            return;
          }
          _this.handleError(params);
        }
      });

      return true;

    };

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
    AutocompleteRenderer.prototype.deferred = true;

    AutocompleteRenderer.prototype.deferredValidation = function(params, value){
      var data = {
        term: value
      };

      var opt = params.colDef.schema.options;

      $.ajax({
        url: opt.object + '/' + value,
        context: this,
        success: function(data){
            this.handleRemoveError(params);
            this.manualDataSet(params, data['PK_id']);

            if (typeof data.fullname != 'undefined') {
              this.formatValueToDisplay(data.fullname);
            } else {
              this.formatValueToDisplay(data[opt.label]);
            }
        }
      })

      return;
    };

		Renderers.Thesaurus = Thesaurus;
		Renderers.ObjectPicker = ObjectPicker;
		Renderers.CheckboxRenderer = CheckboxRenderer;
		Renderers.AutocompleteRenderer = AutocompleteRenderer;

    return Renderers;

});
