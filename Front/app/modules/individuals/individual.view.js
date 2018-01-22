define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  
  'sweetAlert',
  'translater',
  
  './individual.model',
  'modules/objects/detail.view',

  'ns_map/ns_map',
  'ns_form/NSFormsModuleGit',
  'ns_grid/grid.view',

], function(
  $, _, Backbone, Marionette,
  Swal, Translater, IndividualModel, DetailView,
  NsMap, NsForm, GridView
){

  'use strict';

  return DetailView.extend({
    className: 'individual full-height animated white',

    events: {
      'click .tab-link': 'displayTab',
      'click button.js-btn-delete-locations': 'warnDeleteLocations',
      'click button.js-btn-delete-history': 'warnDeleteHistory'
    },

    ModelPrototype: IndividualModel,

    displayForm: function(){
      var detailsFormRegion = this.$el.find('.js-rg-details-grid');
      var _this = this;

      var formConfig = this.model.get('formConfig');

      formConfig.id = this.model.get('id');
      formConfig.formRegion = detailsFormRegion;
      formConfig.buttonRegion = [this.ui.formBtns];
      formConfig.parent = this.parent;
      formConfig.afterDelete = function(response, model){
        Backbone.history.navigate('#' + _this.model.get('type'), {trigger: true});
      };
      formConfig.afterShow = function(options){
         var globalEl = $(this.BBForm.el).find('fieldset').first().detach();
         _this.ui.form.html(globalEl);
         
         if(this.displayMode.toLowerCase() == 'edit'){
           this.bindChanges(_this.ui.form);
         }
       };

      formConfig.afterSaveSuccess = function() {
        _this.historyGrid.fetchData();
      };

      formConfig.savingError = function(response){
        var msg = 'in updating '+_this.model.get('single');
          if (response.status == 520 && response.responseText){
            msg = response.responseText;
          }
        Swal({
          title: 'Error',
          text: msg ,
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: 'rgb(147, 14, 14)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        });
      };
      this.nsForm = new NsForm(formConfig);
    },

    displayMap: function() {
      var _this = this;
      this.map = new NsMap({
        url: this.model.get('type') + '/' + this.model.get('id')  + '/locations?geo=true',
        cluster: true,
        legend: true,
        zoom: 3,
        element: 'map',
        popup: true,
        com: this.com,
        selection: true,
        //bbox: true,
      });

      $.when(this.map.google.defered).then(
        function(){
          _this.map.url = false;
        }
      );
    },

    displayGrids: function() {
      this.displayHistoryGrid();
      this.displayEquipmentGrid();
      this.displayLocationsGrid();
    },

    displayHistoryGrid: function() {
      this.rgHistoryGrid.show(this.historyGrid = new GridView({
        columns: this.model.get('historyColumnDefs'),
        type: this.model.get('type'),
        url: this.model.get('type') + '/' + this.model.get('id')  + '/history',
        clientSide: true,
        gridOptions: {
          onCellFocused: _.bind(function(cell) {
            if (!cell) {
              cell = this.historyGrid.gridOptions.api.getFocusedCell();
            }

            this.historyGrid.focusedRow = this.historyGrid.gridOptions.api.rowModel.getRow(cell.rowIndex);
            var $deleteBtn = this.$el.find(".js-btn-delete-history");
            switch (this.historyGrid.focusedRow.data.Name) {
              case 'Monitoring_Status':
              case 'Survey_type':
                $deleteBtn.attr("disabled", null);
                break;
              default:
                $deleteBtn.attr("disabled", true);
                break;
            }
          }, this)
        }
      }));
      this.gridViews.push(this.historyGrid);
    },

    displayEquipmentGrid: function() {
      this.rgEquipmentGrid.show(this.equipmentGrid = new GridView({
        columns: this.model.get('equipmentColumnDefs'),
        type: this.model.get('type'),
        url: this.model.get('type') + '/' + this.model.get('id')  + '/equipment',
        clientSide: true,
      }));
      this.gridViews.push(this.equipmentGrid);
    },

    displayLocationsGrid: function() {
      var _this = this;
      this.rgLocationsGrid.show(this.locationsGrid = new GridView({
        com: this.com,
        columns: this.model.get('locationsColumnDefs'),
        type: this.model.get('type'),
        url: this.model.get('type') + '/' + this.model.get('id')  + '/locations',
        clientSide: true,
        gridOptions: {
          rowSelection: 'multiple',
          enableFilter: true,
          onRowDoubleClicked: function (row){
            _this.locationsGrid.interaction('focusAndZoom', row.data.ID || row.data.id);
          },
          onRowClicked: function(row){
            _this.locationsGrid.interaction('focus', row.data.ID || row.data.id);
          }
        }
      }));
      this.gridViews.push(this.locationsGrid);
    },

    warnDeleteLocations: function() {
      var _this = this;
      var selectedNodes = this.locationsGrid.gridOptions.api.getSelectedNodes();
      if(!selectedNodes.length){
        return;
      }

      var callback = function() {
        _this.deleteLocations(selectedNodes);
      };
      var opt = {
        title: 'Are you sure?',
        text: 'selected locations will be deleted'
      };
      this.swal(opt, 'warning', callback);
    },

    warnDeleteHistory: function(e) {
      if ($(e.delegateTarget).attr("disabled")) {
        return;
      }
      this.swal({
        title: 'Are you sure?',
        text: 'selected event will be deleted'
      }, 'warning', _.bind(this.deleteHistory, this));
    },

    deleteLocations: function(selectedNodes) {
      var _this = this;
      var url = this.model.get('type') + '/' + this.model.get('id')  + '/locations';

      var selectedIds = selectedNodes.map(function(node){
        return node.data.ID;
      });

      $.ajax({
        url: url,
        method: 'PUT',
        data: {'IDs': JSON.stringify(selectedIds)},
        context: this,
      }).done(function(resp) {
        this.locationsGrid.gridOptions.api.removeItems(selectedNodes);
        this.locationsGrid.clientSideFilter();
      }).fail(function(resp) {
        this.swal(resp, 'error');
      });
    },

    deleteHistory: function(row) {
      if (!row) {
        row = this.historyGrid.focusedRow;
        if (!row) {
          console.error("attempting deleteHistory with no row selected");
          return;
        }
      }

      var url = this.model.get('type') + '/' + this.model.get('id')  + '/history/' + row.data.ID;
      $.ajax({
        url: url,
        method: 'DELETE',
        context: this
      }).done(function(resp) {
        this.historyGrid.gridOptions.api.removeItems([row]);
        // call onCellFocused to update current focusedRow, event is not called otherwise
        this.historyGrid.gridOptions.onCellFocused();
      }).fail(function(resp) {
        this.swal(resp, 'error');
      });
    },

    swal: function(opt, type, callback) {
      var btnColor;
      switch (type){
        case 'success':
          btnColor = 'green';
          opt.title = 'Success';
          break;
        case 'error':
          btnColor = 'rgb(147, 14, 14)';
          opt.title = 'Error';
          break;
        case 'warning':
          if (!opt.title) {
            opt.title = 'warning';
          }
          btnColor = 'orange';
          break;
        default:
          return;
          break;
      }

      Swal({
        title: opt.title,
        text: opt.text || '',
        type: type,
        showCancelButton: true,
        confirmButtonColor: btnColor,
        confirmButtonText: 'OK',
        closeOnConfirm: true,
      },
      function(isConfirm) {
        //could be better
        if (isConfirm && callback) {
          callback();
        }
      });
    },
  });
});
