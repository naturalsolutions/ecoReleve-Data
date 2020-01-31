define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',

  'ns_map/ns_map',
  'ns_grid/grid.view',
  'ns_form/NSFormsModuleGit',

  'modules/objects/detail.view',
  './sensor.model',

], function(
  $, _, Backbone, Marionette, Swal, Translater,
  NsMap, GridView, NsForm,
  DetailView, SensorModel
){

  'use strict';

  return DetailView.extend({

    regions: {
      'rgNavbar': '.js-rg-navbar',
      'rgHistoryGrid': '.js-rg-history-grid',
      'rgEquipmentGrid': '.js-rg-equipment-grid',
      'rgStationsGrid': '.js-rg-stations-grid',
    },

    events: {
      'click .tab-link': 'displayTab',
      'click button.js-btn-delete-history': 'warnDeleteHistory',
    },

    ModelPrototype: SensorModel,


    displayForm: function(){
      var _this = this

      DetailView.prototype.displayForm.call(this)

      this.nsForm.afterSaveSuccess = function() {
        _this.historyGrid.fetchData()
      }
    },

    displayGrids: function(){
      this.displayHistoryGrid();
      this.displayDeploymentGrid();
    },

    displayMap: function() {
      this.map = new NsMap({
        url: this.model.get('type') + '/' + this.model.get('id')  + '?geo=true',
        cluster: true,
        zoom: 3,
        element: 'map',
        popup: true,
      });
    },

    displayHistoryGrid: function() {
      this.rgHistoryGrid.show(this.historyGrid = new GridView({
        columns: this.model.get('historyColumnsDefs'),
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
            if (typeof(this.historyGrid.focusedRow) == "undefined") {
                console.log("No row focusable")
            }
            else {
              switch (this.historyGrid.focusedRow.data.Name) {
                case 'Status':
                  $deleteBtn.attr("disabled", null);
                  break;
                default:
                  $deleteBtn.attr("disabled", true);
                  break;
              }
            }
          }, this)
        }
      }));
      this.gridViews.push(this.historyGrid);
    },

    warnDeleteHistory: function(e) {
      if ($(e.delegateTarget).attr("disabled")) {
        return;
      }
      this.swal({
        heightAuto: false,
        title: 'Are you sure?',
        text: 'selected event will be deleted'
      }, 'warning', _.bind(this.deleteHistory, this));
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
      })
    },

    displayDeploymentGrid: function() {
      this.rgDeploymentGrid.show(this.deploymentGrid = new GridView({
        columns: this.model.get('deploymentColumnsDefs'),
        type: this.model.get('type'),
        url: this.model.get('type') + '/' + this.model.get('id')  + '/equipment',
        clientSide: true,
      }));
      this.gridViews.push(this.deploymentGrid);
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
        heightAuto: false,
        title: opt.title,
        text: opt.text || '',
        type: type,
        showCancelButton: true,
        confirmButtonColor: btnColor,
        confirmButtonText: 'OK',
        closeOnConfirm: true,
      }).then( (result) => {
        if( 'value' in result && callback) {
          callback();
        }
      });

      // Swal({
      //   title: opt.title,
      //   text: opt.text || '',
      //   type: type,
      //   showCancelButton: true,
      //   confirmButtonColor: btnColor,
      //   confirmButtonText: 'OK',
      //   closeOnConfirm: true,
      // },
      // function(isConfirm) {
      //   //could be better
      //   if (isConfirm && callback) {
      //     callback();
      //   }
      // });
    }

  });
});
