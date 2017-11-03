define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',

  'ns_stepper/lyt-step',
  'ns_modules/ns_com',
  'ns_grid/grid.view',
  'i18n'

], function($, _, Backbone, Marionette, swal,
  Step, Com, GridView
) {

  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/rfid/templates/tpl-step1-rfid.html',

    name: 'RFID decoder selection',
    events: {
      'change .js-select-rfid-id': 'handleRfidSelection',
    },

    ui: {
      'rfidSelectId': '.js-select-rfid-id',
      'requirement': '#requirement',
    },

    regions: {
      rgGrid: '.js-rg-grid'
    },

    initialize: function(options) {
      this.model = new Backbone.Model();
      this.importedFiles = options.model.attributes.files;
    },

    check: function() {
      if (this.ui.requirement.val()) {
        return true;
      } else {
        return false;
      }
    },

    feedIdentifierSelect: function(){
      var identifierRdy = $.ajax({
        url: 'sensors/getUnicIdentifier',
        data: {sensorType: 3},
        context: this,
      }).done(function(data) {
        var firstId = data[0]['val'];
        var content = '';

        data.map(function(rfid){
          content += '<option value="' + rfid.val + '">' + rfid.label + '</option>';
        });
        this.ui.rfidSelectId.append(content);
        this.displayGrid(firstId);
      });
      return identifierRdy;
    },

    onShow: function() {
      var _this = this;
      var obj = {name: this.name + '_RFID_identifer',required: true};
      this.stepAttributes = [obj];
      var identifierRdy = this.feedIdentifierSelect();
    },

    handleRfidSelection: function(e){
      var id = $(e.currentTarget).val();
      this.displayGrid(id);
    },

    displayGrid: function(id) {
      var _this = this;
      _this.ui.requirement.val('').change();
      this.model.set('sensorId', id);

      var columnsDefs = [{
        field: 'ID',
        headerName: 'ID',
        hide: true
      },{
        field: 'UnicIdentifier',
        headerName: 'Identifier',
      },{
        field: 'StartDate',
        headerName: 'Start date',
        filter: 'date'
      },
      {
        field: 'EndDate',
        headerName: 'End Date',
        filter: 'date'
      },{
        field: 'Name',
        headerName: 'Site Name',
      }];

      this.rgGrid.show(this.gridView = new GridView({
        url: 'sensors/' + id + '/equipment',
        columns: columnsDefs,
        clientSide: true,
        gridOptions: {
          enableFilter: true,
          rowSelection: 'single',
          suppressRowClickSelection: false,
          onRowSelected: function(row){
            _this.model.set('row', row.node.data);
            _this.row = row.node.data;
            _this.ui.requirement.val('check').change();
          }
        }
      }));
    },

    uploadFile: function(file){
      var _this = this;
      var data = new FormData();
      this.reader = new FileReader();
      this.reader.onload = function(e) {
          data.append('data', e.target.result);
          data.append('fileName', file.name)
          data.append('FK_Sensor',_this.model.get('sensorId'));
          data.append('StartDate', _this.row.StartDate);
          data.append('EndDate', _this.row.EndDate);

          $.ajax({
            type: 'POST',
            url: 'sensors/rfid/datas',
            data: data,
            processData: false,
            contentType: false
          }).done(function(data) {
            $('.cancel').removeAttr('disabled');

            //self.ui.progressBar.css({'background-color': 'green'})
            swal(
              {
                title: 'Succes',
                text: 'importing RFID file',
                type: 'success',
                showCancelButton: true,
                confirmButtonColor: 'green',
                confirmButtonText: 'Go to Validate',
                cancelButtonText: 'Import new RFID',
                closeOnConfirm: true,

              },
              function(isConfirm) {
                //self.ui.progress.hide();
                if (isConfirm) {
                  Backbone.history.navigate('validate/rfid',{trigger: true});
                } else {
                  //Backbone.history.navigate('importFile',{trigger: true});
                  _this.options.parent.currentStepIndex = 1;
                  var index = _this.options.parent.currentStepIndex;
                  _this.options.parent.displayStep(index);
                }
              }
            );

          }).fail(function(data) {
            $('#btnNext').attr('disabled');
            if (data.status == 520 || data.status == 510) {
              var type = 'warning';
              var title = 'Warning !'
              //self.ui.progressBar.css({'background-color': 'rgb(218, 146, 15)'})
              var color = 'rgb(218, 146, 15)';
            } else {
              var type = 'error';
              var title = 'Error !'
              //self.ui.progressBar.css({'background-color': 'rgb(147, 14, 14)'})
              var color = 'rgb(147, 14, 14)';
              //_this.clearFile();

            }
            if (data.responseText.length > 250) {
              data.responseText = 'An error occured, please contact an admninstrator';
            }
            swal(
              {
                title: title,
                text: data.responseText,
                type: type,
                showCancelButton: false,
                confirmButtonColor: color,
                confirmButtonText: 'OK',
                closeOnConfirm: true,
              },
              function(isConfirm) {
              }
            );
          });
        };
      this.reader.readAsText(file);
    },

    validate: function() {
      this.uploadFile(this.importedFiles[0]);
      return this.model;
    },

  });
});
