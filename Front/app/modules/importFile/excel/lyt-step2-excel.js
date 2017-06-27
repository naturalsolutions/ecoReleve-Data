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
      'gridWsMsg': '#js-wsmsg-grid',
      'gridProcess':'#js-wsmsg-process'
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
      this.displayForm();
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
            _this.fetchProcess();
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

    updateGrid: function(grid, data){
      // var data = {process: 'pr_Check_Boolean', msg: 'OK'};

      var rowList = grid.gridOptions.api.getModel().rowsToDisplay;
      var rowNode = rowList[0];
      rowNode = rowList.filter(function(row){
        if (row.data.id == data.process){
          return row;
        }
      })[0];
      var message;
      if(data.msg =='OK'){
        message = 'OK'
      } else {
        message = data.errorIndexes
      }
      rowNode.setDataValue(data.column, message);

    },

    fetchProcess : function(){
      var _this = this;
       $.ajax({
        url: config.coreUrl + 'file_import/processList?fileType=excel_protocol',
        type: 'GET',
        success: function(msg){
          _this.process = msg;
          _this.fetchColumns();
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

    displayProcess: function(){
      var divContent = document.createElement('div');
      divContent.className = 'row excel-process';

      var divProcess = document.createElement('div');
      var divMsg = document.createElement('div');
      var divError = document.createElement('div');
      
      divProcess.className = 'col-md-7 content_import_process';
      divMsg.className = 'col-md-3 content_import_status';
      divError.className = 'col-md-3 content_import_error hide';
      divMsg.textContent = "Unstarted" ;


      // divContent.appendChild(divRow);
      // divContent.appendChild(divRowDetails);
      divContent.appendChild(divProcess);
      divContent.appendChild(divMsg);
      divContent.appendChild(divError);

       for (var j=0; j < this.process.length ; j++ ){
         var currentProcess = this.process[j]
         if(currentProcess.type.indexOf('column') === -1){
            divContent.id = 'js-process-'+currentProcess.name;
            divProcess.textContent = currentProcess.name ;
            $('#js-wsmsg-grid').append(divContent);

         }
       }
    },

    displayGrid: function(columns){
      var _this =this;

      var classRules =  {
          // rule shouldn't apply to header or footer, so ignore when node.group = true
          'import-error': '!node.group && x!="OK" && x!="Unstarted"',
          'import-ok': '!node.group && x=="OK"',
          'import-notexec': '!node.group && x=="not executed"',
      };
      this.columns = [];
      this.data = [];
      var colDefProcess = [{field:'process_name',
                          headerName: 'runing process',
                          pinned: 'left',
                          maxWidth: 400
                          },{field:'status',
                            headerName: 'status',
                            maxWidth: 400,
                            cellClassRules: classRules
                          }];
      var dataProcess= [];

      for( var i=0; i < columns.length ; i++ ) {
        this.columns.push({
          field: columns[i],
          headerName: columns[i],
          maxWidth: 500,
          cellClassRules: classRules
        });
      }

      this.columns.unshift({field:'process_name',
                            headerName: 'runing process',
                            pinned: 'left',
                            maxWidth: 400
                          });
      for (var j=0; j < this.process.length ; j++ ){
        if(this.process[j].type.indexOf('column') !== -1){

          this.data.push({
              process_name: this.process[j].descriptionFr,
              id: this.process[j].name
            });
        } else {
          dataProcess.push({
            process_name: this.process[j].descriptionFr,
            id: this.process[j].name,
            status: 'Unstarted'
          });
        }
      }

      this.data = this.data.map(function(x){
        for( var i=0; i < columns.length ; i++ ) {
          x[columns[i]] = 'Unstarted';
        }
        return x
      });

      this.gridProcess.show(this.importGridProcess = new GridView({
        columns: colDefProcess,
        clientSide: true,
        enableFilter: true,
        gridOptions: {
          rowData: dataProcess
        }
      }));
      this.gridWsMsg.show(this.importGrid = new GridView({
        columns: this.columns,
        clientSide: true,
        enableFilter: true,
        gridOptions: {
          rowData: this.data,
          onGridReady: function(){
            _this.startWebSocket();
          }
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
        if (jsonMsg.column == 'status') {
          _this.updateGrid(_this.importGridProcess, jsonMsg);
        } else {

          _this.updateGrid(_this.importGrid, jsonMsg);
        }

        for( var i = 0 ; i < uniqProcressArray.length ; i++) {
          if( uniqProcressArray[i] === jsonMsg.process ) {
            break;
          }
        }
        if( i === uniqProcressArray.length ) {
          uniqProcressArray.push(jsonMsg.process)
          nbLines+=1;
          _this.updateProgressBar('js_statusProcess',nbLines,_this.nbProcess)
        }
      };
      ws.onclose = function(msg){
      };

      ws.onopen = function(msg){
      };

    },

  });
});
