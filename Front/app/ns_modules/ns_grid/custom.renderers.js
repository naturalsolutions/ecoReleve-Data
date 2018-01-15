define(['jquery', 'ag-grid'], function($, AgGrid) {
  
      //number && text are default renderers.
  
      var Renderers = {};
  
      var CustomRenderer = function(){

      };
  
      //used on init but also for sorting and filtering!
      CustomRenderer.prototype.init = function (params) {


        this.eGui = document.createElement('span'); //not sure it's necessary
        
        this.params = params;
        var value = this.handleValues(params);
        this.isEmptyRow = this.checkIfEmptyRow(params);
  
        //check only before the first render of the grid, otherwise, use refresh
        // console.log('init')
        if(!params.api.firstRenderPassed){
          // alert('firstRender')
          this.onFirstRender(params, value);
          this.handleValueValidation(params, value);
        }
  
        // alert('init')
  
  
        if(this.isEmptyRow){
          // this.onFirstRender(params, value);
          this.requiredValidation(params, value);
        } else {
          // after sort filter etc check if there was already an error then display it
          this.formatValueToDisplay(value);
          if(params.data._errors !== undefined){
            for (var i = 0; i < params.data._errors.length; i++) {
              if(params.data._errors[i] == params.colDef.field){
                this.handleError(params);
              }
            }
          }
        }
  
      };
  
      CustomRenderer.prototype.checkIfEmptyRow = function(params){
        //new lines & empty lines, ciritic
        var keys = Object.keys(params.data);
        var empty = true;
        for( var key in params.data ){
          if(key == '_errors' && params.data._errors) {
            continue;
          }
          if(key == 'index') {
            continue;
          }
          //riscky
          var val = params.data[key]
          if(params.data[key] instanceof Object){
            val = params.data[key].value;
          }
          if(val != null && val != 'undefined' && val != ''){
            empty = false;
          //  return empty;
          }
        }
        //optionnal
        if(keys.length === 0 || (keys.length === 1 && keys[0] === '_errors' )){
          empty = true;
        }
        return empty;
      };
  
      CustomRenderer.prototype.handleValues = function(params){
        var value = params.value;
        var displayValue;
  
        //critic
        if(value instanceof Object){
          value = params.value.value;
          displayValue = params.value.displayValue;
        } else {
          displayValue = value;
        }
  
        this.formatValueToDisplay(displayValue);
  
        return value;
      };
  
      CustomRenderer.prototype.handleValueValidation = function(params, value) {
        if(this.deferred && value){
          this.deferredValidation(params, value);
        } else {
          this.requiredValidation(params, value)
        }
      };
  
      CustomRenderer.prototype.requiredValidation = function(params, value){
        var validators = params.colDef.schema.validators;

        if(validators.length){
          var editable;
          if(typeof params.colDef.editable === 'function'){
          editable = params.colDef.editable(params);
          } else {
            editable = params.colDef.editable;
          }
          if(validators[0] === 'required' && editable){
              $(params.eGridCell).addClass('ag-cell-required');
          if(!value && String(value) !== "0"){
                this.handleError(params);
              } else {
                this.handleRemoveError(params);
              }
          }
          else if (validators[0].type && validators[0].type === 'StateBox') {
            if ( !validators[0].nullable && ( value === null || value === undefined) ) { //can't be null and null in database
              this.handleError(params);
              var tmp = this.eGui.getElementsByTagName('label');
            }
            else {
              this.handleRemoveError(params);
            }
          }
          else {
            this.handleRemoveError(params);
          }
        }
      };
  
      CustomRenderer.prototype.manualDataSet = function(params, value) {
        //critic
        if(!this.error){
          params.data[params.colDef.field] = value;
        }
      };
  
      //used only after comeback from editor!
      CustomRenderer.prototype.refresh = function (params) {
        this.isEmptyRow = false;
        this.eGui.innerHTML = '';
        var value = this.handleValues(params);
        this.handleValueValidation(params, value);
        
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
        var editable;
        if(typeof params.colDef.editable === 'function'){
          editable = params.colDef.editable(params);
        } else {
          editable = params.colDef.editable;
        }
        if(editable){
          if(!this.isEmptyRow){
            $(params.eGridCell).addClass('ag-cell-error');
          }
    
          var errorsColumn =  params.data['_errors'];
    
          if(!($.isArray(errorsColumn))) {
            errorsColumn = [];
          }
          errorsColumn.push(params.colDef.field);
          errorsColumn = errorsColumn.filter(function(elem, index, self) {
              return index == self.indexOf(elem);
          })
          params.node.setDataValue('_errors', errorsColumn);
        }
      };
  
      CustomRenderer.prototype.getGui = function() {
        return this.eGui;
      };
  
      CustomRenderer.prototype.deferredValidation = function() {
        return false;
      };

      //format value & display
      CustomRenderer.prototype.formatValueToDisplay = function(value) {
        $(this.eGui).html(value);
      };
      CustomRenderer.prototype.onFirstRender = function() {
        return false;
      };
  
  
  
      var NumberRenderer = function(options) {};
      NumberRenderer.prototype = new CustomRenderer();
  
      var TextRenderer = function(options) {};
      TextRenderer.prototype = new CustomRenderer();
      
      var DateTimeRenderer = function(options) {
      };
      DateTimeRenderer.prototype = new CustomRenderer();
      DateTimeRenderer.prototype.handleValues = function(params){
        var objectValue = params.value;
        if( params && params.colDef && params.colDef.schema && params.colDef.schema.options &&  params.colDef.schema.options.format ) {
          if( params.colDef.schema.options.format === 'YYYY')
          {
            var tempDate = new Date(objectValue);
            objectValue = tempDate.getFullYear();
          }
        }
        this.formatValueToDisplay(objectValue); 
        return objectValue;
      };
      
      DateTimeRenderer.prototype.formatValueToDisplay = function(objectValue) {
  
        if(!objectValue){
          return;
        }
  
        $(this.eGui).html(objectValue);
      };
  
      var ThesaurusRenderer = function(options) {};
      ThesaurusRenderer.prototype = new CustomRenderer();
      ThesaurusRenderer.prototype.deferred = true;
      ThesaurusRenderer.prototype.handleValues = function(params){
         var objectValue = {};
         objectValue = params.value;
        if( typeof(params.value) === 'undefined' ) {
          if(params.colDef.schema.defaultValue ) {
           var splitTab = params.colDef.schema.defaultValue.split('>');
  
            objectValue = {
                      displayValue : splitTab[splitTab.length-1],
                      value : params.colDef.schema.defaultValue
            }
          }
        }
  
        this.formatValueToDisplay(objectValue); // prefer manage value to display here in order to keep object value all along the time
        return objectValue;
      };
  
      ThesaurusRenderer.prototype.formatValueToDisplay = function(objectValue) {
        var valueToDisplay;
        if(!objectValue){
          return;
        }
        if(objectValue.displayValue !== ''){
          valueToDisplay = objectValue.displayValue;
        } else {
          valueToDisplay = objectValue.value;
        }
        $(this.eGui).html(valueToDisplay);
      };
  
      ThesaurusRenderer.prototype.deferredValidation = function(params, objectValue){
        if(params.colDef.schema.editable && objectValue.error || (objectValue.value !== '' && objectValue.displayValue === '')){
          this.handleError(params);
        } else if ( ( objectValue.value === null && objectValue.displayValue === null && params.colDef.schema.defaultValue ) ) {
          this.handleError(params);
        }
        else {
          this.handleRemoveError(params);
        }
  
        return true;
      };
  
      var ObjectPickerRenderer = function () {}
      ObjectPickerRenderer.prototype = new CustomRenderer();
      ObjectPickerRenderer.prototype.deferred = true;
  
      ObjectPickerRenderer.prototype.init = function (params) {
        var colDef = params.colDef;
        var name = colDef.field.split('FK_')[1];
        this.objectName = name.charAt(0).toLowerCase() + name.slice(1) + 's';
  
        CustomRenderer.prototype.init.call(this, params);
      };
  
      ObjectPickerRenderer.prototype.deferredValidation = function(params, value) {
        var colDef = params.colDef;
        var url = this.objectName + '/' + value;
          $.ajax({
            url: url,
            context: this,
            success: function(data){
  
              this.handleRemoveError(params);
              var displayValue;
  
              if (colDef.schema.options && colDef.schema.options.usedLabel){
                displayValue = data[colDef.schema.options.usedLabel];
              } else {
                displayValue = data['ID'];
              }
  
              var values = {
                value: value,
                displayValue: displayValue
              };
  
              this.formatValueToDisplay(values);
  
              this.manualDataSet(params, values);
  
            }, error: function(data){
              this.handleError(params);
            }
  
          });
      };
  
      ObjectPickerRenderer.prototype.formatValueToDisplay = function (value) {
        var valueReal;
        var displayValue;
  
        if(value instanceof Object){
          rValue = value.value;
          displayValue = value.displayValue;
        } else {
          rValue = value;
          displayValue = value;
        }
  
        if(!displayValue){
          displayValue = '';
        }
  
        var url = 'http://' + window.location.hostname+window.location.pathname + '#' + this.objectName + '/' + rValue;
  
        var dictCSS = {
          'individuals':'reneco reneco-bustard',
          'sensors': 'reneco reneco-emitters',
          'monitoredSites': 'reneco reneco-site',
        };
  
        if(!rValue){
          rValue = '';
        }
        var tpl = '<div>\
                      <a href="'+ url +'" class="'+dictCSS[this.objectName]+' grid-link" target="_blank"></a>\
                      <span>' + displayValue + '</span> \
                  </div>';
        $(this.eGui).html(tpl);
      };
  
      var CheckboxRenderer = function() {}
        CheckboxRenderer.prototype = new CustomRenderer();
        
        CheckboxRenderer.prototype.formatValueToDisplay = function (value) {
          var _this = this;
          var checked = ''; 
          if(value == 1)
            checked = 'checked';
          var editable;
          if(typeof this.params.colDef.editable === 'function'){
            editable = this.params.colDef.editable(this.params);
          } else {
            editable = this.params.colDef.editable;
          }
  
          if(editable){
            
            var chk = '<input class="form-control" type="checkbox" '+ checked +' />';
          } else {
            var chk = '<input disabled class="form-control" type="checkbox" '+ checked +' />';
          }
          $(this.eGui).html(chk);
          $(this.eGui).find('input').on('click', function(e){
            if($(this).attr('checked')){
              _this.params.data[_this.params.colDef.field] = 0;
            } else {
              _this.params.data[_this.params.colDef.field] = 1;
            }
          });
      };
  
  
      var StateBoxRenderer = function() {};
        StateBoxRenderer.prototype = new CustomRenderer();

        StateBoxRenderer.prototype.init = function (params) {
          
          var value = null;
          this.params = params;
          if(typeof(value) === 'undefined') { //hack for getRowDataAndErrors , stopediting call format with value undefined
            value = null;
          }
          
          if( params.colDef.field in params.data ) {
            value = params.data[params.colDef.field];
          }
          else if ('defaultValue' in params.colDef.schema ) {
            if( params.colDef.schema.defaultValue != null && params.colDef.schema.defaultValue != '') {
              value = parseInt(params.colDef.schema.defaultValue)
            }
          }
          params.value = value;
          

         CustomRenderer.prototype.init.call(this, params);
            
        };
        StateBoxRenderer.prototype.handleValueValidation = function(params, value) {
            this.requiredValidation(params, value)
        };
        StateBoxRenderer.prototype.handleError = function(params) {
          this.error = true;
            $(params.eGridCell).addClass('ag-cell-error');
    
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
        StateBoxRenderer.prototype.onFirstRender = function (params) {

          var value = null;
          this.params = params;
          if(typeof(value) === 'undefined') { //hack for getRowDataAndErrors , stopediting call format with value undefined
            value = null;
          }
          
          if( params.colDef.field in params.data ) {
            value = params.data[params.colDef.field];
          }
          else if ('defaultValue' in params.colDef.schema ) {
            if( params.colDef.schema.defaultValue != null && params.colDef.schema.defaultValue != '') {
              value = parseInt(params.colDef.schema.defaultValue)
            }
          }
          params.value = value;

         // this.hardSetValue(params, value);
          this.formatValueToDisplay(value);
          this.requiredValidation(params, value)


          return value;
        };

              //used only after comeback from editor!
        StateBoxRenderer.prototype.refresh = function (params) {
          // alert('refresh')
          this.isEmptyRow = false;
          this.eGui.innerHTML = '';
          var value = this.handleValues(params);
          this.hardSetValue(params, value);
          this.handleValueValidation(params, value);
        };

        StateBoxRenderer.prototype.hardSetValue = function (params, value) {
          switch(value) {
            case 1 : {
              params.value = params.data[params.colDef.field] = 1;
              break;
            }
            case 0 : {
              params.value = params.data[params.colDef.field] = 0;
              break;
            }
            default : {
              params.value = params.data[params.colDef.field] = null;
              break;
            }
          }
        };


        StateBoxRenderer.prototype.formatValueToDisplay = function (value) {
          // alert(value);
          var _this = this;

          if( this.params && this.params.colDef && this.params.colDef.options && 'nullable' in this.params.colDef.options ) {
            this.nullable = this.params.colDef.options.nullable
          }
          else {
            this.nullable = true;
          }
         
    
          //input
          var input = this.input = document.createElement('input');
          input.className ='form-control statebox';
          input.type = 'checkbox'
          // input.readonly = true;
          input.id = this.params.colDef.field + '_' + this.params.rowIndex

          //label
          var label = document.createElement('label');
          label.setAttribute('for', input.id);
          label.setAttribute('data_toggle', "tooltip");


          if( !this.params.colDef.editable ) {
            input.setAttribute('disabled', true)
          }
    
          switch(value) {
            case 1 : {
              input.checked = true;
              break;
            }
            case 0 : {
              input.checked = false;
              break;
            }
            default : {
              input.indeterminate = true;
              break;
            }
          }

          var editable;
          if(typeof this.params.colDef.editable === 'function'){
            editable = this.params.colDef.editable(this.params);
          } else {
            editable = this.params.colDef.editable;
          }
          if(!editable){
            input.disabled = true;
          } else {
            label.onclick = function(e) {
              if( _this.nullable )  {
                switch(_this.params.value) {
                  case 1 : { //de true on passe a false
                    input.checked = false;
                    _this.hardSetValue(_this.params, 0);
                    break;
                  }
                  case 0 : {//de false on passe a indeterminate
                    input.indeterminate = true;
                    _this.hardSetValue(_this.params, null);
                    break;
                  }
                  default : {// de indeterminate on passe a true
                    input.checked = true;
                    _this.hardSetValue(_this.params, 1);
                    break;
                  }
                }
              }
              else {
               switch(_this.params.value) {
                 case 1 : { //de true on passe a false
                    input.checked = false;
                  _this.hardSetValue(_this.params, 0);
                  break;
                 }
                 default : {// de false on passe a true
                  input.checked = true;
                  _this.hardSetValue(_this.params, 1);
                   break;
                 }
               }    
              }               
              label.removeAttribute("onclick");
            }
          }


         $(this.eGui).html(input)
         $(this.eGui).append(label)
        };
  
  
      var AutocompleteRenderer = function() {}
      AutocompleteRenderer.prototype = new CustomRenderer();
      AutocompleteRenderer.prototype.deferred = true;
  
      AutocompleteRenderer.prototype.deferredValidation = function(params, value){
        var data = {
          term: value
        };
  
        var opt = params.colDef.schema.options;
        if(opt.source.indexOf('ID') != -1){
          $.ajax({
            url: opt.object + '/' + value,
            context: this,
            success: function(data){
              this.handleRemoveError(params);
    
              var valueToDisplay;
    
              this.manualDataSet(params, data['PK_id']);
    
              if (typeof data.fullname != 'undefined') {
                valueToDisplay = data.fullname;
              } else {
                valueToDisplay = data[opt.label];
              }
    
              this.formatValueToDisplay(data.fullname);
    
              var values = {
                value: value,
                label: valueToDisplay
              };
    
              this.manualDataSet(params, values);
            },
            error: function(){
    
              var values = {
                value: value,
                label: value
              };
    
              this.formatValueToDisplay(value);
              this.manualDataSet(params, values);
            }
          });
        }
      };
  
      var SelectRenderer = function(options) {}
      SelectRenderer.prototype = new CustomRenderer();
      SelectRenderer.prototype.formatValueToDisplay = function(value){
        var displayValue;
        var valueFound = this.params.colDef.options.find(function(obj){
          return obj.val == value;
        });
  
        if (valueFound) {
          displayValue = valueFound.label;
        } else {
          displayValue = value;
        }
        $(this.eGui).html(displayValue);
      };

      var TextAreaRenderer = function(params) {
        var value = params.value;
        var gui = $(params.eGridCell);
        gui.attr('title', value);
        gui.attr('data-original-title', value);
        
        gui.tooltip({trigger:'hover', placement:'auto left'});
        return value;
      };

      Renderers.NumberRenderer = NumberRenderer;
      Renderers.TextRenderer = TextRenderer;
      Renderers.TextAreaRenderer = TextAreaRenderer;
      Renderers.DateTimeRenderer = DateTimeRenderer;
      Renderers.ThesaurusRenderer = ThesaurusRenderer;
      Renderers.ObjectPickerRenderer = ObjectPickerRenderer;
      Renderers.StateBoxRenderer = StateBoxRenderer;
      Renderers.CheckboxRenderer = CheckboxRenderer;
      Renderers.AutocompleteRenderer = AutocompleteRenderer;
      Renderers.SelectRenderer = SelectRenderer;
  
      return Renderers;
  
  });
  