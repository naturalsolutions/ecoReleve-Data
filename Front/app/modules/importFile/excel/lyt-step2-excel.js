define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  'ns_form/NSFormsModuleGit',
  'sweetAlert',
  'models/excelForm',
  'i18n'

], function($, _, Backbone, Marionette, config, NsForm, Swal,ExcelForm) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/importFile/excel/templates/tpl-step2-excel.html',

    name: 'File selection',

    ui: {
      'form': '#form',
      'gridWsMsg': '#js-wsmsg',
      'progressBar': '.progress'
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
      this.displayProcess();
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
        console.log(file);
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
                  console.log(event);
                  _this.updateProgressBar('js_uploadFileImported',percent,event.total);
                  //update progressbar
                  /*$(progress_bar_id +" .progress-bar").css("width", + percent +"%");
                  $(progress_bar_id + " .status").text(percent +"%");*/
              }, true);
            }
            return xhr;
          },
          success: function(msg){
            _this.startWebSocket(msg);
          },
          error: function(jqXHR, textStatus, errorThrown){
            console.log(jqXHR, textStatus, errorThrown);
            var options = {
              title: 'Something wrong append',
            };
            window.swal(options, 'error', false);
          }
        });

      }
    },

    displayProcess: function(){
      var _this = this;
      $.ajax({
        url: config.coreUrl + 'file_import/processList?fileType=excel_protocol',
        type: 'GET',
        success: function(msg){
          _this.nbProcess = msg.length;
          _this.updateProgressBar('js_statusProcess',0,_this.nbProcess)
          _this.initiateGridImport(msg);
        },
        error: function(jqXHR, textStatus, errorThrown){
          var options = {
            title: 'Something wrong append',
          };
          window.swal(options, 'error', false);
        }
        });
    },
    notPresent: function(tab , elem) {
      for( var i = 0 ; i < tab.length ; i++) {
        if(tab[i] === elem){
          return false;
        }
      }
      return true;

    },

    initiateGridImport: function(data) {
      var _this = this;
      var uniqProcressArray = [];
      for( var i=0; i < data.length ; i++ ) {
        if( this.notPresent(uniqProcressArray, data[i].name ) ) {
          this.nbLines +=1;
          uniqProcressArray.push(data[i].name);

        var divContent = document.createElement('div');
        var divRow = document.createElement('div');
        var divProcess = document.createElement('div');
        var divMsg = document.createElement('div');
        var divError = document.createElement('div');
        var divErrorIndexes = document.createElement('div');
        var btnDetails = document.createElement('a');
        var divRowDetails = document.createElement('div');

        if( this.nbLines % 2 ) {
          divRow.className = 'row content even';
        }
        else {
          divRow.className = 'row content odd';
        }
        divContent.className = 'row';
        divContent.id = 'js-'+this.nbLines+'-'+data[i].name;
        divProcess.className = 'col-md-7 content_import_process';
        divMsg.className = 'col-md-3 content_import_status';
        divError.className = 'col-md-3 content_import_error hide';
        divErrorIndexes.className = 'col-md-2 content_import_details';
        divRowDetails.className = 'row col-md-12 detailsContent collapse';
        divRowDetails.id = 'importLg'+data[i].name;

        divProcess.textContent = data[i].name ;
        divMsg.textContent  = "Unstarted" ;
        divError.textContent = "-" ;
        //divErrorIndexes.textContent = "-" ;
        divRowDetails.textContent = "-";
        btnDetails.textContent = "-";

        divContent.appendChild(divRow);
        divContent.appendChild(divRowDetails);
        divRow.appendChild(divProcess);
        divRow.appendChild(divMsg);
        divRow.appendChild(divError);
        divRow.appendChild(divErrorIndexes);

        //divRow.appendChild(divRowDetails);

        _this.ui.gridWsMsg.append(divContent);
        }
      }



    },

    updateRow : function(idRow,data) {
      var elemRootRow = this.ui.gridWsMsg.find('[id$='+idRow+'][class=row]');
      var elemProcess = elemRootRow[0].querySelector('.content_import_process');
      var elemMsg = elemRootRow[0].querySelector('.content_import_status');
      var elemError = elemRootRow[0].querySelector('.content_import_error');
      var elemErrorIndexes = elemRootRow[0].querySelector('.content_import_details');
      var elemRowDetails = elemRootRow[0].querySelector('.detailsContent');

      switch(data.msg.toLowerCase()) {
        case 'ok' : {
          var elemIcon = document.createElement('i');
          elemIcon.className = "reneco reneco-checked";
          elemMsg.textContent = data.msg;//+'<i class=" reneco reneco-entrykey "></i>';
          elemMsg.appendChild(elemIcon);
          break;
        }
        case 'error': {
          var elemIcon = document.createElement('i');
          elemIcon.className = "reneco reneco-close";
          elemMsg.textContent = data.msg;//+'<i class=" reneco reneco-entrykey "></i>';
          elemMsg.appendChild(elemIcon);
          break;
        }
        default : {
          elemMsg.textContent = data.msg;
          break;
        }
      }
      elemError.textContent = data.error;
      elemRowDetails.textContent = data.errorIndexes;
      if( data.error.toLowerCase() !== 'none') {
        var btnDetails = document.createElement('a');
        btnDetails.textContent = "Details";
        btnDetails.setAttribute('data-toggle','collapse');
        btnDetails.setAttribute('href','#importLg'+idRow);

        elemRootRow[0].querySelector('.row.content').className += ' errorImport';//addClass('errorImport');
        elemErrorIndexes.append(btnDetails);
      }
      else {
        elemErrorIndexes.textContent = '-';
      }

    },

    updateProgressBar: function(idBar,valueCur,valueMax) {
      var progressBar = this.ui.progressBar.filter('#'+idBar).find('.progress-bar');
      var percentage = Math.trunc( (valueCur/valueMax) * 100 )
      progressBar[0].setAttribute('aria-valuenow',valueCur);
      progressBar[0].style.width = percentage+'%' ;
      progressBar[0].textContent = percentage+'% Complete';

    },

    startWebSocket: function(guid){
      var _this = this;
      var nbLines = 0;
      var uniqProcressArray = [];
      // domain name should be in config
      var ws = new WebSocket('ws://127.0.0.1:6545/ecoReleve-Websockets/fileImport/' + guid);
      ws.onmessage = function(msg) {
        var jsonMsg = JSON.parse(msg.data);
        _this.updateRow(jsonMsg.process,jsonMsg);
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
        //_this.$el.find('#js-wsmsg').append('<span>' + msg.data + '</span></br>');
/******

        var divContent = document.createElement('div');
        var divRow = document.createElement('div');
        var divProcess = document.createElement('div');
        var divMsg = document.createElement('div');
        var divError = document.createElement('div');
        var divErrorIndexes = document.createElement('div');
        var btnDetails = document.createElement('a');
        var divRowDetails = document.createElement('div');

        if( nbLines % 2 ) {
          divRow.className = 'row content even';
        }
        else {
          divRow.className = 'row content odd';
        }
        divContent.className = 'row';
        divProcess.className = 'col-md-3 content_import_process';
        divMsg.className = 'col-md-3 content_import_status';
        divError.className = 'col-md-3 content_import_error';
        divErrorIndexes.className = 'col-md-3 content_import_details';
        divRowDetails.className = 'row col-md-12 detailsContent collapse';
        divRowDetails.id = 'importLg'+nbLines;
        btnDetails.setAttribute('data-toggle','collapse');
        btnDetails.setAttribute('href','#importLg'+nbLines);

        divProcess.textContent = jsonMsg.process ;
        divMsg.textContent  = jsonMsg.msg ;
        divError.textContent = jsonMsg.error ;
        //divErrorIndexes.textContent = jsonMsg.errorIndexes ;
        divRowDetails.textContent = jsonMsg.errorIndexes;
        btnDetails.textContent = "Details";

        divContent.appendChild(divRow);
        divContent.appendChild(divRowDetails);
        divRow.appendChild(divProcess);
        divRow.appendChild(divMsg);
        divRow.appendChild(divError);
        divRow.appendChild(divErrorIndexes);

        //divRow.appendChild(divRowDetails);
        if( jsonMsg.error.toLowerCase() !== 'none') {
          divRow.className = divRow.className +' errorImport '
          divErrorIndexes.appendChild(btnDetails);
        }
        else {
          divErrorIndexes.textContent = 'NA'
        }
        _this.ui.gridWsMsg.append(divContent);
        //_this.ui.gridWsMsg.append(divRowDetails);
        ****/
      };
      ws.onclose = function(msg){
      };

      ws.onopen = function(msg){
      };

    },

  });
});
