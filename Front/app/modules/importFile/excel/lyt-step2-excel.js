define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  'ns_form/NSFormsModuleGit',
  'sweetAlert',
  'models/excelForm',
  'ns_grid/grid.view',
  'i18n'

], function($, _, Backbone, Marionette, config, NsForm, Swal,ExcelForm, GridView) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/importFile/excel/templates/tpl-step2-excel.html',

    name: 'File selection',

    ui: {
      'form': '#form',
      'progressBar': '.progress'
    },

    regions: {
      'checkGrid': '#checkGrid',
      'updateGrid':'#updateGrid',
      'insertGrid': '#insertGrid'
    },

    events: {
      'change input[type="file"]': 'importFile',
    },

    initialize: function(options) {
      this.model = options.model;
      this.nbLines = 0;
      this.nbProcess = 0;

    },

    onShow: function() {
      this.fetchProcess();
      this.displayForm();
      this.displayGrids();
    },

    onDestroy: function() {
    },

    check: function() {
    },

    validate: function() {
    },

    displayForm : function(){
      var model = new ExcelForm();
      this.nsform = new NsForm({
        model: model,
        buttonRegion: [],
        formRegion: this.ui.form,
        reloadAfterSave: false,
        disabled : false,
      });
    },

    importFile: function(e) {
      window.app.checkFormSaved = false;
      var _this = this;
      var file = e.target.files[0];
      var fileName = file.name;
      var tab = fileName.split('.');
      var fileType = tab[1].toUpperCase();

      if (fileType != 'XLSX') {
        var options = {
          title: 'Something wrong append',
        };
        window.swal(options, 'error', false);

        this.model.set('data_FileName', '');
        this.errors = true;
        $('#importGpxMsg').removeClass('hidden');

      } else {

        var formData = new FormData();
        formData.append("excelFile", file);
        formData.append("protoId",this.model.get('protoID'));
        formData.append("protoName",this.model.get('protoName'));
        $.ajax({
          url: config.coreUrl + 'file_import/getExcelFile',
          type: 'POST',
          data: formData,
          processData: false, // Don't process the files
          contentType: false, // Set content type to false as jQuery will tell the server its a query string request
          xhr : function () {
            //upload Progress
            var xhr = $.ajaxSettings.xhr();
            if (xhr.upload) {
              _this.updateProgressBar('js_uploadFileImported',0,100);
              xhr.upload.addEventListener('progress', function(event) {
                  var percent = 0;
                  var position = event.loaded || event.position;
                  var total = event.total;
                  if (event.lengthComputable) {
                      percent = Math.ceil(position / total * 100);
                  }
                  _this.updateProgressBar('js_uploadFileImported',percent,100);
                  //update progressbar
                  /*$(progress_bar_id +" .progress-bar").css("width", + percent +"%");
                  $(progress_bar_id + " .status").text(percent +"%");*/
              }, true);
            }
            return xhr;
          },
          success: function(msg){
            _this.file_id = msg;
            _this.startWebSocket();
          },
          error: function(jqXHR, textStatus, errorThrown){
            var options = {
              title: 'Something wrong append',
              text: jqXHR.responseText,
            };
            window.swal(options, 'error', false);
          }
        });

      }
    },

    fetchProcess : function(){
      var _this = this;
       $.ajax({
        url: config.coreUrl + 'file_import/processList?fileType=excel_protocol',
        type: 'GET',
        success: function(msg){
          _this.process = msg;
        },
        error: function(jqXHR, textStatus, errorThrown){
          var options = {
            title: 'Something wrong append',
          };
          window.swal(options, 'error', false);
        }
        });
    },

    fetchColumns: function(){
      var _this = this;
       $.ajax({
        url: config.coreUrl + 'file_import/'+_this.file_id+'/columns',
        type: 'GET',
        success: function(msg){
          _this.displayGrid(msg);
        },
        error: function(jqXHR, textStatus, errorThrown){
          var options = {
            title: 'Something wrong append',
          };
          window.swal(options, 'error', false);
        }
        });
    },

    getTargetGrid: function(processType){
      var targetGrid;
      switch (processType){
        case 'sql_check_column': case 'sql_check_data':
          targetGrid = this.gridProcessCheck;
          break;
        case 'sql_insert':
          targetGrid = this.gridProcessInsert;
          break;
       case 'sql_update_column':
          targetGrid = this.gridProcessCheck;
          break;
      }
      return targetGrid;
    },

    updateGrids: function(grid, data){
      var targetGrid = this.getTargetGrid(data.processType);
      var errorIndexes = data.errorIndexes.split(',');
      var foundProcess = this.process.filter(function(process){
          if(process.name === data.process){
            return process;
          }
        })[0];
      if (foundProcess.type.indexOf('check')!==1 && parseInt(errorIndexes[0])){
        errorIndexes.forEach(function(index) {
          targetGrid.gridOptions.api.addItems([{id:index, column:data.column, process:foundProcess.descriptionFr}]);
        }, this);
      }
    },

    displayGrids: function(){
      var _this =this;

      var classRules =  {
          // rule shouldn't apply to header or footer, so ignore when node.group = true
          'import-error': '!node.group && x!="OK" && x!="Unstarted"',
          'import-ok': '!node.group && x=="OK"',
          'import-notexec': '!node.group && x=="not executed"',
      };
      var colDefCheck = [{ field:'id',
                           filter:'number',
                           headerName: 'row number',
                           pinned: 'left',
                           width:80,
                           minWidth:50,
                           maxWidth: 120
                        },
                        { field:'column',
                          headerName: 'column name',
                          width:150,
                          maxWidth: 400,
                          //cellClassRules: classRules
                          },
                          {
                            field:'process',
                            headerName: 'process error',
                            maxWidth: 400
                          }];

      var colDefInsert = [{ field:'process',
                            headerName: 'process error',
                            maxWidth: 400
                          },
                          { field:'msg',
                            headerName: 'error message',
                            width:150,
                            maxWidth: 400
                          }];
      
      var colDefUpdate = [{ field:'process',
                      headerName: 'process error',
                      maxWidth: 400,
                          width:150,
                      
                    },
                    { field:'column',
                          headerName: 'column name',
                          maxWidth: 400,
                          width:150,
                          
                          //cellClassRules: classRules
                    },
                    { field:'msg',
                      headerName: 'error message',
                      maxWidth: 400
                    }];

      this.insertGrid.show(this.gridProcessInsert = new GridView({
        columns: colDefInsert,
        clientSide: true,
        gridOptions: {
          enableFilter: true,
          rowData: [],
        }
      }));

      this.updateGrid.show(this.gridProcessUpdate = new GridView({
        columns: colDefUpdate,
        clientSide: true,
        gridOptions: {
          enableFilter: true,
          rowData: [],
        }
      }));
      this.checkGrid.show(this.gridProcessCheck = new GridView({
        columns: colDefCheck,
        clientSide: true,
        gridOptions: {
          enableFilter: true,
          rowData: [],
          paginationPageSize: 100,
          rowModelType :'pagination',
          pagination: true
        }
      }));
    },

    updateProgressBar: function(idBar,valueCur,valueMax) {
      var progressBar = this.ui.progressBar.filter('#'+idBar).find('.progress-bar');
      var percentage = Math.trunc( (valueCur/valueMax) * 100 )
      progressBar[0].setAttribute('aria-valuenow',valueCur);
      progressBar[0].style.width = percentage+'%' ;
      progressBar[0].textContent = percentage+'% Complete';

    },

    startWebSocket: function(){
      var _this = this;
      var nbLines = 0;
      var uniqProcressArray = [];
      // domain name should be in config
      var ws = new WebSocket('ws://127.0.0.1:6545/ecoReleve-Websockets/fileImport/' + _this.file_id);
      ws.onmessage = function(msg) {
        var jsonMsg = JSON.parse(msg.data);
        _this.updateGrids(_this.importGridProcess, jsonMsg);
        // for( var i = 0 ; i < uniqProcressArray.length ; i++) {
        //   if( uniqProcressArray[i] === jsonMsg.process ) {
        //     break;
        //   }
        // }
        // if( i === uniqProcressArray.length ) {
        //   uniqProcressArray.push(jsonMsg.process)
        //   nbLines+=1;
        //   _this.updateProgressBar('js_statusProcess',nbLines,_this.nbProcess)
        // }
      };
      ws.onclose = function(msg){
      };

      ws.onopen = function(msg){
      };

    },

  });
});
