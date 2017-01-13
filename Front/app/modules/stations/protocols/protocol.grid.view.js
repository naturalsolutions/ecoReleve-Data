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

    saveObs: function(){
      var _this = this;
      var rowData = [];
      this.gridView.gridOptions.api.stopEditing();
      this.gridView.gridOptions.api.forEachNode( function(node) {
        if(Object.keys(node.data).length !== 0)
        rowData.push(node.data);
      });

      var data = JSON.stringify({
          'rowData': rowData,
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
        })
        _this.model.trigger('change:obs', _this.model);
        this.toggleEditionMode();
        this.hardRefresh();
      }).fail(function(resp) {
        
      });
    },

    addRow: function(){
      this.gridView.gridOptions.api.addItems([{}]);
    },

    deleteObs: function(){
      this.gridView.deleteSelectedRows();
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
            options: field.options
          };

          columnsDefs.push(colDef)
        }
      }

      return columnsDefs;
    },

    onShow: function(){
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
