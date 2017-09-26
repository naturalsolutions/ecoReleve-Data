define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'ns_ruler/ruler',
  'backbone-forms',
  'ns_grid/grid.view',

  ], function ($, _, Backbone, Marionette,Ruler, Form, GridView, tpl) {

  'use strict';

  Backbone.Form.validators.SubFormGrid = function (options) {
      return function SubFormGrid(value) {
          if (!options.parent.isError) {
              return null;
          }
          var retour = {
              type: 'subFormGrid',
              message: ''
          };
          return retour;
      };
  };

  return Form.editors.GridFormEditor = Form.editors.Base.extend({
    events: {
        'click .js-btn-add' : 'addRow',
        'click .js-btn-delete' : 'deleteRows',
        'click .js-cloneLast' : 'cloneLast',
    },

    template: '\
        <div class="btn-group-grid">\
        <button type="button" class="js-btn-add btn btn-success hide"><span class="reneco reneco-add"></span></button>\
        <button type="button" class="js-btn-delete btn btn-danger btn-sm hide"><span class="reneco reneco-trash"></span> Delete selected rows</button>\
        </div>\
        <div class="js-rg-grid-subform col-xs-12 no-padding grid-margin" style="height: 400px">\
        </div>\
    ',

    className: 'sub-grid-form' ,

    // set here the rule function according the rule operator
    rulesList : {
      disable: function(colDef, field){
        if(colDef.editable){
          colDef.editable = function(params){
            // apply disable only on existing data
            var editable = true
            if (params.node.data.ID){
              var testedValue = params.node.data[field.rule.source];
              if(field.rule.value.indexOf('match@')!= -1 && testedValue){
                editable = testedValue.toString().match(field.rule.value.replace('match@','')) ? false : true;
              } else{
                editable = testedValue != field.rule.value;
              }
              if(!editable){
                params.node['unRemovable'] = true;
              }
              return editable
            } else {
              return editable;
            }
          }
        }
      }
    },

    addRow: function(){
      this.gridView.gridOptions.api.stopEditing(false);
      this.gridView.gridOptions.api.setSortModel({});
      this.gridView.gridOptions.api.addItems([{}]);
      this.$el.trigger('change');
    },

    deleteRows: function() {
      var _this = this;
      var selectedNodes = this.gridView.gridOptions.api.getSelectedNodes();
      console.log(selectedNodes)
      if(!selectedNodes.length){
        return;
      }
      var selectNodesRemovable = selectedNodes.filter(function(node){
        if (!node.unRemovable){
          return node;
        }
      });
      this.gridView.gridOptions.api.deletingRows = true;
      this.gridView.gridOptions.api.setSortModel({});
      _this.gridView.gridOptions.api.removeItems(selectNodesRemovable);
      this.$el.trigger('change');
      this.gridView.gridOptions.api.deletingRows = false;
    },

    initialize: function(options){
      var _this = this; 

      this.validators = options.schema.validators || [];

      this.validators.push({ type: 'SubFormGrid', parent: this });

      this.editable = options.schema.editable;
      this.form = options.form;
      this.subProtocolType = options.schema.options.protocoleType;

      options.schema.fieldClass = 'col-xs-12';

      this.templateSettings = {
          hidden: false,
          hiddenClone: false,
      };
      
      this.regionManager = new Marionette.RegionManager();
      _.bindAll(this, 'render', 'afterRender'); 
      this.render = _.wrap(this.render, function(render) {
          render();    
          setTimeout(function(){
              _this.afterRender(options);
          }, 0);
          return _this;
      });
    },

    render: function(){
        this.template = _.template(this.template, this.templateSettings);
        this.$el.html(this.template);
        if(this.editable){
          this.$el.find('.js-btn-add').removeClass('hide');
          this.$el.find('.js-btn-delete').removeClass('hide');
        }
        return this;
    },

    afterRender: function(options){
      var _this = this;
      var rowData = options.model.get(options.key) || [];
      this.regionManager.addRegions({
        rgGrid: '.js-rg-grid-subform'
      });

      if(!(rowData.length) && this.editable){
        rowData = [{}];
      }

      var url = 'stations/' + this.model.get('FK_Station') + '/observations'; 

      this.regionManager.get('rgGrid');
      this.regionManager.get('rgGrid').show(this.gridView = new GridView({
        columns: this.formatColumns(options.schema),
        clientSide: true,
        form: _this.form,
        url: url,
        displayRowIndex: true,
        gridOptions: {
          editType: 'fullRow',
          singleClickEdit : true,
          rowData: rowData,
          rowSelection: (this.editable)? 'multiple' : '',
          onCellValueChanged: function(e){
            _this.customValueChanged(e)
          }
        },
        onFocusedRowChange: function(row){
        },
        noResizeToFit: true
      }));

    },

    customValueChanged: function(options){
      var column = options.colDef.field;
      if(column == '_errors'){
        return;
      }
      var newValue, oldValue;
      if(options.newValue instanceof Object){
        newValue = options.newValue.value;
      } else {
        newValue = options.newValue;
      }
      if(options.oldValue instanceof Object){
        oldValue = options.oldValue.value;
      } else {
        oldValue = options.oldValue;
      }

      if(newValue !== oldValue){
        this.$el.trigger('change');
      }
    },

    applyRule: function(colDef, field){
      if(field.rule && field.rule.operator){
        var ruleFunc = this.rulesList[field.rule.operator];
        ruleFunc(colDef, field);
      }
    },

    formatColumns: function(schema){
      var _this = this;
      var odrFields = schema.fieldsets[0].fields;
                        
      var columnsDefs = [];

      for (var i = 0; i < odrFields.length; i++) {
        var field = schema.subschema[odrFields[i]];
        if(field.name == 'ID'){
          continue;
        }
        var colDef = {
          editable: field.editable,
          field: field.name,
          headerName: field.title,
          type: field.type,
          options: field.options,
          schema: field,
          minWidth: field.minWidth,
          maxWidth: field.maxWidth,
          width: field.width,
          pinned : field.pinned
        };
        this.applyRule(colDef, field);
        columnsDefs.push(colDef)
      }
      var errorCol = {
        field: '_errors',
        headerName: '_errors',
        hide: true
      }
      columnsDefs.push(errorCol);

      return columnsDefs;             
    },


    getValue: function() {
      this.gridView.gridOptions.api.stopEditing(false);
      this.gridView.gridOptions.api.refreshView();
      var rowDataAndErrors = this.gridView.getRowDataAndErrors();

      if(rowDataAndErrors.errors.length){
        this.isError = true;
        return;
      } else {
        this.isError = false;
      }

      this.gridView.gridOptions.api.setSortModel({});

      for (var i = 0; i < rowDataAndErrors.rowData.length; i++) {
        rowDataAndErrors.rowData[i]['FK_ProtocoleType'] = this.subProtocolType;
      }

      return rowDataAndErrors.rowData;
    },

    initRules:function(form) {
      var _this = this;
      this.ruler = new Ruler({
            form: form
          });
      var globalError = {};
      var errorMsg = 'error on field(s): \n';

      _.each(form.schema,function(curSchema){
        if (curSchema.rule){
          var curRule = curSchema.rule;
          var target = curSchema.name;
          var curResult = _this.ruler.addRule(target,curRule.operator,curRule.source,curRule.value);
          if (curResult) {
            globalError[target] = curResult;
            errorMsg +=  curResult.object + ':  '+curResult.message+'\n' ;
          }
        }
      });

      if (!$.isEmptyObject(globalError) && this.displayMode == 'edit'){
        this.swal({
          title : 'Rule error',
          text : errorMsg,
          type:'error',
          showCancelButton: false,
          confirmButtonColor:'#DD6B55',
          confirmButtonText:'Ok'});
      }
    },

  });
});
