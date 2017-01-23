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
      //console.log('errors detected');
      console.log(errors);
    },

    saveObs: function(){
      var _this = this;
      var rowDataAndErrors = this.gridView.getRowDataAndErrors();

      if(rowDataAndErrors.errors.length){
        this.handleErrors(rowDataAndErrors.errors);
        return;
      }

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
        this.model.trigger('change:obs', this.model);
        this.toggleEditionMode();
        this.hardRefresh();
      }).fail(function(resp) {
        
      });
    },

    addRow: function(){
      this.gridView.gridOptions.api.addItems([{}]);
    },

    deleteObs: function(){
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
      var columnsDefs = [];

      for (var i = 0; i < this.model.get('fieldsets').length; i++) {
        var ordFields = this.model.get('fieldsets')[i].fields;
        for (var j = 0; j < ordFields.length; j++) {
                      
          var field = this.model.get('schema')[ordFields[j]];
          var colDef = {
            editable: this.editable,
            field: field.name,
            headerName: field.title,
            type: field.type,
            options: field.options,
            schema: field,
          };

          columnsDefs.push(colDef)
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
      //this.editable = true;
      //this.$el.find('.js-btn-form').toggleClass('hide');

      this.rgGrid.show(this.gridView = new GridView({
        columns: this.formatColumns(this.options.model),
        clientSide: true,
        url: this.url,
        objectType: this.model.get('ID'),
        gridOptions: {
          rowSelection: (this.editable)? 'multiple' : '',
        }
      }));
    },

  });
});
