define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'ns_grid/grid.view',
  'i18n'
], function($, _, Backbone, Marionette, GridView) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/protocols/protocol.grid.tpl.html',
    className: 'protocol full-height',

    regions: {
      'rgGrid': '.js-rg-grid',
    },

    events: {
      'click .js-btn-form': 'handleBtnClick'
    },

    initialize: function(options){
      this.editable = false;
      this.url = 'stations/' + this.model.get('stationId') + '/observations';

       window.formInEdition.form.baseUri = window.location.href;
    },

    handleBtnClick: function(e){
      switch($(e.currentTarget).attr('role')){
        case 'save':
          this.saveObs();
          break;
        case 'edit':
          this.toggleEditionMode();
          this.hardRefresh();
          break;
        case 'cancel':
          this.toggleEditionMode();
          this.hardRefresh();
          break;
        case 'delete': 
          this.deleteObs();
          break;        
        case 'add': 
          this.addRow();
          break;
      }
    },

    handleErrors: function(errors){
      var opt = {
        title: 'Errors detected',
        text: 'Please fix error before save your data'
      };
      
      window.swal(
        opt,
        'warning',
        null,
        false);
    },

    saveObs: function() {
      var _this = this;
      var nbVirtualObs = 0;
      this.gridView.gridOptions.api.forEachNode( function() {
        nbVirtualObs+=1;
      });
      var nbObs = this.gridView.getRowDataAndErrors();//.length
      nbObs = nbObs.rowData.length
      var nbObsDeleted = this.gridView.removeEmptyRow();

      if( (nbVirtualObs - nbObsDeleted) > 0 ) {
        var rowDataAndErrors = this.gridView.getRowDataAndErrors();
      



      if(rowDataAndErrors.errors.length){
        this.handleErrors(rowDataAndErrors.errors);
        return;
      }

      this.gridView.gridOptions.api.setSortModel({});

      var data = JSON.stringify({
          'rowData': rowDataAndErrors.rowData,
          'FK_ProtocoleType': this.model.get('ID')
        });
      $.ajax({
        url: this.url + '/batch',
        method: 'POST',
        contentType: 'application/json',
        data: data,
        context: this,
      }).done(function(response) {
        response.createdObservations.map(function(obs){
          _this.model.get('obs').push(obs.id);
        });
        window.formInEdition.form['.js-obs-form'].formChange = false;
        this.model.trigger('change:obs', this.model);
        this.toggleEditionMode();
        this.hardRefresh();
      }).fail(function(reponse) {
        var opt = {
          title: 'Something went wrong',
          text: reponse.responseText
        };
        
        window.swal(
            opt,
           'warning',
            null,
           false);
      });
    }
    else {
      var opt = {
        title : ' There is no observations',
        text: 'Sorry but there is nothing to save'
      };
      
      window.swal(
          opt,
         'warning',
          null,
          false);
      
      this.toggleEditionMode();
      this.hardRefresh();
    }
    },

    addRow: function(){    
      this.gridView.gridOptions.api.stopEditing(false);
      this.gridView.gridOptions.api.setSortModel({});
      this.gridView.gridOptions.api.addItems([{}]);
    },

    deleteObs: function(){
      this.gridView.gridOptions.api.setSortModel({});
      var _this = this;
      var afterDestroySelectedRows = function(){
        var rowData = [];
        _this.gridView.gridOptions.api.forEachNode( function(node) {
          if(Object.keys(node.data).length !== 0 && node.data.ID){
            rowData.push(node.data.ID);
          }
        });
        _this.model.set('obs', rowData);
        _this.model.trigger('change:obs', _this.model);
      }
      
      this.gridView.deleteSelectedRows(afterDestroySelectedRows);
      
    },

    toggleEditionMode: function(){
      this.editable = !this.editable;
    },

    hardRefresh: function(){
      this.onShow(); 
      this.$el.find('.js-btn-form').toggleClass('hide');
    },

    formatColumns: function(model){
      var _this = this;
      var columnsDefs = [];

      var editable = this.editable;

      for (var i = 0; i < this.model.get('fieldsets').length; i++) {
        var ordFields = this.model.get('fieldsets')[i].fields;
        for (var j = 0; j < ordFields.length; j++) {

          var field = this.model.get('schema')[ordFields[j]];
          if(field.editorAttrs.disabled){
            editable = false;
          }

          var colDef = {
            editable: field.editable ? this.editable : this.editable,
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

          editable = this.editable;

          columnsDefs.push(colDef);
        }
      }
      var errorCol = {
        field: '_errors',
        headerName: '_errors',
        hide: true
      }
      columnsDefs.push(errorCol);

      return columnsDefs;
    },

    onShow: function(){
      //debbug
      //this.$el.find('.js-btn-form').toggleClass('hide');
      var _this = this;
      var rowData = null;
      if(!(this.model.get('obs').length)){
        this.toggleEditionMode();
        this.$el.find('.js-btn-form').toggleClass('hide');
        rowData = [{}];
      }

      this.rgGrid.show(this.gridView = new GridView({
        columns: this.formatColumns(this.options.model),
        clientSide: true,
        url: this.url,
        objectType: this.model.get('ID'),
        displayRowIndex: true,
        gridOptions: {
          editType: 'fullRow',
          singleClickEdit : true,
          rowData: rowData,
          rowSelection: (this.editable)? 'multiple' : '',
          onRowDataChanged : function() {
            if( _this.editable) {
              _this.gridView.gridOptions.api.addItems([{}]);
            }
          }
        },
        noResizeToFit: true
      }));

    },

  });
});
