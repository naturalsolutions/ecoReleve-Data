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
  return Form.editors.GridFormEditor = Form.editors.Base.extend({
    events: {
        'click .js-btn-add' : 'addRow',
        'click .js-btn-delete' : 'deleteRows',
        'click .js-cloneLast' : 'cloneLast',
    },

    template: '\
        <div class="js-rg-grid-subform col-xs-12 no-padding" style="height: 300px">\
        </div>\
        <button type="button" class="js-btn-add btn btn-success"><span class="reneco reneco-add"></span></button>\
        <button type="button" class="js-btn-delete btn btn-danger pull-right"><span class="reneco reneco-trash"></span> Delete selected rows</button>\
    ',

    
    addRow: function(){
        this.gridView.gridOptions.api.addItems([{}]);
    },



    deleteRows: function() {
      var selectedNodes = this.gridView.gridOptions.api.getSelectedNodes();

      var _this = this;
      
      //2fix
      var url = this.model.get('type') + '/' + this.model.get('id')  + '/';

      

      var selectedIds = selectedNodes.map(function(node){
        return node.data.ID;
      });

      $.ajax({
        url: url,
        method: 'DELETE',
        data: {'IDs': JSON.stringify(selectedIds)},
        context: this,
      }).done(function(resp) {
        this.gridView.gridOptions.api.removeItems(selectedNodes);
        this.gridView.clientSideFilter();
      }).fail(function(resp) {
        this.swal(resp, 'error');
      });
    },

    initialize: function(options) {
      var _this = this; 

      options.schema.fieldClass = 'col-xs-12';
      this.formatColumns(options.schema);

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
        return this;
    },

    afterRender: function(options){
      var rowData = options.model.get(options.key) || [];
      this.regionManager.addRegions({
        rgGrid: '.js-rg-grid-subform'
      });

      this.regionManager.get('rgGrid');
      this.regionManager.get('rgGrid').show(this.gridView = new GridView({
        columns: this.formatColumns(options.schema),
        clientSide: true,
        gridOptions: {
          rowData: rowData,
          rowSelection: 'multiple',
        },
        onFocusedRowChange: function(row){

        }
      }));

    },

    formatColumns: function(schema){
      var editable = schema.editable;
      var odrFields = schema.fieldsets[0].fields;
                        
      var columnsDefs = [];

      for (var i = odrFields.length - 1; i >= 0; i--) {
          var field = schema.subschema[odrFields[i]];

          var colDef = {
              editable: editable,
              field: field.name,
              headerName: field.title,
              type: field.type,
              options: field.options
          };
          
          columnsDefs.push(colDef)
      }

      return columnsDefs;             
    },



    getValue: function() {
      var rowData = [];
      this.gridView.gridOptions.api.forEachNode( function(node) {
          rowData.push(node.data);
      });
      return rowData;
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