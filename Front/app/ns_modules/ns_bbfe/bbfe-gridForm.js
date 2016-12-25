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

            // <button type="button" class=" <%= hidden %> btn btn-success js-addFormBtn">+</button>\
            // <button type="button"  class="js-cloneLast <%= hiddenClone %> btn">Clone Last</button>\
            // <button type="button"  class="<%= hidden %> btn btn-success js-addFormBtn">+</button>\
            // <button type="button"  class="js-cloneLast <%= hiddenClone %> btn ">Clone Last</button>\

        template: '\
            <div class="js-rg-grid-subform col-xs-12 no-padding" style="height: 500px">\
            </div>\
            <button type="button" class="js-btn-add btn btn-success">Add</button>\
            <button type="button" class="js-btn-delete btn btn-danger">Delete rows</button>\
        ',

        
        addRow: function(){
            this.gridView.gridOptions.api.addItems([{}]);
        },

        render: function(){
            this.template = _.template(this.template, this.templateSettings);
            this.$el.html(this.template);
            return this;
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
            method: 'PUT',
            data: {'IDs': JSON.stringify(selectedIds)},
            context: this,
          }).done(function(resp) {
            this.gridView.gridOptions.api.removeItems(selectedNodes);
            this.gridView.clientSideFilter();
          }).fail(function(resp) {
            this.swal(resp, 'error');
          });
        },


        afterRender: function(){
            this.regionManager.addRegions({
              rgGrid: '.js-rg-grid-subform'
            });
            this.regionManager.get('rgGrid');
            this.regionManager.get('rgGrid').show(this.gridView = new GridView({
                columns: this.columnsDefs,
                clientSide: true,
                gridOptions: {
                  rowData: this.options.model.get(this.options.key),
                  rowSelection: 'multiple',
                },
                onFocusedRowChange: function(row){
                }
            }));
        },

        initialize: function(options) {
            this.regionManager = new Marionette.RegionManager();
            _.bindAll(this, 'render', 'afterRender'); 
            this.render = _.wrap(this.render, function(render) {
                render();    
                setTimeout(function(){
                    _this.afterRender();
                }, 0);
                return _this;
            });

            var _this = this; 
            //Form.editors.Base.prototype.initialize.call(this, options);
            this.options = options;
            this.formatColumns();
            
            this.templateSettings = {
                hidden: false,
                hiddenClone: false,
            };
            
            this.options.schema.fieldClass = 'col-xs-12';
            return;


            if (options.schema.validators.length) {
                this.defaultRequired = true;
            } else {
                options.schema.validators.push('required');
                this.defaultRequired = false;
            }

            if (options.schema.options.nbFixedCol){
                this.nbFixedCol = options.schema.options.nbFixedCol;
            }

            if (options.schema.options.delFirst){
                this.delFirst = options.schema.options.delFirst;
            }

             if (!options.schema.options.cloneLast){
                this.hiddenClone = 'hidden';
            }


            this.template = options.template || this.constructor.template;
            this.showLines = true ;
            if (this.options.schema.options.showLines != null) {
                this.showLines = this.options.schema.options.showLines ;
            }
            this.forms = [];
            this.disabled = options.schema.editorAttrs.disabled;

            this.hidden = '';
            if(this.disabled) {
                this.hidden = 'hidden';
                this.hiddenClone = 'hidden';
            }
            this.hasNestedForm = true;

            this.key = this.options.key;
            this.nbByDefault = this.options.model.schema[this.key]['nbByDefault'];
        },

        formatColumns: function(){
            var odrFields = this.options.schema.fieldsets[0].fields;
                
            

            this.columnsDefs = [];
            for (var i = odrFields.length - 1; i >= 0; i--) {
                var field = this.options.schema.subschema[odrFields[i]];

                var colDef = {
                    editable: true,
                    field: field.name,
                    headerName: field.title,
                    type: field.type,
                    options: field.options
                };
                
                this.columnsDefs.push(colDef)
            }            
        },



        getValue: function() {
            var rowData = [];
            this.gridView.gridOptions.api.forEachNode( function(node) {
                rowData.push(node.data);
            });
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