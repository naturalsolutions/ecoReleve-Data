define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'config',
  'ns_stepper/lyt-step',
  'ns_modules/ns_com',
  'resumable',
  'ns_grid/grid.view',
  'ns_grid/customCellRenderer/decimal5Renderer',
  'ns_grid/customCellRenderer/dateTimeRenderer',
  'ns_grid/custom.editors',
  'ns_grid/custom.renderers',
  'moment',
  'i18n'

], function ($, _, Backbone, Marionette, Swal, config,
  Step, Com, Resumable, GridView, Decimal5Renderer, DateTimeRenderer,
  Editors, Renderers, Moment
) {

  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/camTrap/templates/tpl-step3-camtrap.html',

    name: 'Camera Trap Files Send',
    events: {},
    regions: {
      rgGridSession: '.js-rg-grid-session',
      rgGridPhotos: '.js-rg-grid-photos'
    },
    ui: {},
    initialize: function (options) {
      var _this = this;
      this.nbDateOutOfLimit = 0;
      this.showHiddenCols = true;
      this.nbDateInLimit = 0;
      this.availableSpace = {
        free : 0,
        total : 0,
        used : 0,
        usedPercentage : 0
      };
      this.uploadInfos = {
        nbFilesRefused : 0,
        nbFilesAccepted : 0,
        nbFilesExistOnServer : 0
      };
      this.reasonRefused = {
        date : 0,
        exist : 0,
        unknown : 0
      };
      this.jetLag = {
        hours : '00:00:00',
        operator : '+'
      };
      this.parent = options.parent;
      this.model = options.model || new Backbone.Model();
      this.com = new Com();
      this.r = this.model.get('resumable');
      this.nbPhotos = this.r.files.length;
      this.evalSizeOfPhotos(this.model.get('resumable').files);
      this.configResumable();
      this.model.set('availableSpace', 'N/A');
      this.jetLag = {
        hours: "00:00:00",
        operator: '+'
      }
      this.jetLag.operator = '+';
      this.jetLag.hours = "00:00:00";
      /* this.getAvailableSpace().then(function() {
          _this.show();
         });*/

      this.deferredSize = this.getAvailableSpace();
    },

    evalSizeOfPhotos: function (arrayOfResumableFile) {

      //TODO V2 do it on step1 when add file
      this.model.set('size', (arrayOfResumableFile.reduce(function (acc, file) {
        return acc + file.size
      }, 0) / (1024 * 1024)).toFixed(2));
    },

    cleanOldResult: function() {
      debugger;

      this.r.files.forEach(function (element,idx) {
          delete element.outOfRange;
          delete element.inRange;
      });
      
    },

    checkDate: function () {
      
      var _this = this;
      this.cleanOldResult();//pb if prev change session and next we need to destroy old outOfRange and inRange
      var dateMin = new Date(this.model.get('minDate'));
      var dateMax = new Date(this.model.get('maxDate'));
      if (this.r.files.length > 0) {
        this.r.files.forEach(function (element) {
          var diffMin = (element.dateFind.dateObj - dateMin) / 1000 / 3600; //number of hours in abs
          var diffMax = (dateMax - element.dateFind.dateObj) / 1000 / 3600;

          if (diffMin <= -24 || diffMax <= -24) {
            _this.nbDateOutOfLimit += 1;
            element.outOfRange = true;
          } else if ((-24 < diffMin && diffMin < 0) || (-24 < diffMax && diffMax < 0)) {
            _this.nbDateInLimit += 1;
            element.inRange = true;
          } else {
            console.log("date in range")
          }
        });

      }
      console.log(" nb date out of range ", this.nbDateOutOfLimit);
      console.log(" nb date in range for correction ", this.nbDateInLimit)

      //TODO check all date swal and define range possible, impossible

    },

    removeRefusedFiles: function (resumableObj) {
      var idx = 0
      while (resumableObj.files.length) {
        if (idx >= resumableObj.files.length) {
          break;

        }
        if (typeof (resumableObj.files[idx].outOfRange) != 'undefined') {
          if (resumableObj.files[idx].outOfRange === true) {
            resumableObj.removeFile(resumableObj.files[idx]);
          }
        } else {
          idx += 1;
        }
      }
    },


    sendData: function (params) {
      var _this = this;

      // this.progressBar.startUpload();
      $('#myPleaseWait').modal({"keyboard":false,"backdrop": "static","show":true});
      $.ajax({
          type: "POST",
          url: config.coreUrl + 'sensorDatas/camtrap/concat',
          data: {
            path: params.path,
            action: 0 // create folder
          }
        })
        .done(function (response, status, jqXHR) {
          if (jqXHR.status === 200) {
           _this.removeRefusedFiles(_this.r);
           _this.r.upload();
          }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.log("error");
          console.log(errorThrown);
        });

    },

    check: function () {

      return true;
      // if (this.ui.requirement.val()) {
      //   return true;
      // } else {
      //   return false;
      // }
    },

    getAvailableSpace: function () {

      this.dfd = $.Deferred();

      var _this = this;
      return this.dfd = $.ajax({
          type: "GET",
          url: config.coreUrl + 'dashboard/availableSpace',
        })
        .done(function (response, status, jqXHR) {
          if (jqXHR.status === 200) {
            _this.availableSpace = response;
            _this.availableSpace.usedPercentage = ((response.used / response.total)*100).toFixed(2);
            _this.$el.show();
          }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.log("error");
          console.log(errorThrown);
        });
      //this.dfd.resolve();


    },
    ProgressBar: function (ele) {
      //TODO go to html elem
      this.thisEle = $(ele);

      this.startUpload = function () {
          (this.thisEle).removeClass('hide').find('.progress-bar').css('width', '0%');
        },

        this.uploading = function (progress) {
          (this.thisEle).find('.progress-bar').attr('style', "width:" + progress + '%');
        },

        this.finish = function () {
          (this.thisEle).find('.progress-bar').css('width', '100%');
        }
    },

    onShow: function () {
      var _this = this;

      this.model.set('minDate', new Date(this.model.get('row').StartDate));
      this.model.set('maxDate', new Date(this.model.get('row').EndDate));
      this.checkDate();

      this.progressBarElem = this.el.getElementsByClassName('progress-bar')[0];

      
      this.timePicker = $('#datetimepicker3').datetimepicker({
        format: 'hh:mm:ss'
      });

      $('.js-jetlagoperator').click(function (e) {
        var elem = this.firstElementChild;
        _this.jetLag.operator = '+'
        if (elem.className.indexOf('plus') > -1) {
          elem.className = elem.className.replace('plus', 'minus')
          _this.jetLag.operator = '-';
        } else {
          elem.className = elem.className.replace('minus', 'plus')
        }


        _this.updateColJetLag({
          hours: _this.jetLag.hours,
          operator: _this.jetLag.operator
        });
      })

      $('#datetimepicker3 input').blur(function (e) {
        _this.updateColJetLag({
          hours: _this.jetLag.hours,
          operator: _this.jetLag.operator
        });
      });

      this.timePicker.on('dp.change', function (e) {
        if (e.date.hour() == 0) {
          _this.jetLag.hours = e.date.format('HH:mm:ss');
          $('#datetimepicker3 input')[0].value = _this.jetLag.hours;
        } else {
          _this.jetLag.hours = e.date.format('hh:mm:ss');
        }


        /* _this.updateColJetLag({
           hours : this.jetLag.hours,
           operator : this.jetLag.operator
         });*/
      });

      $.when(this.deferredSize).then(function () {
        _this.progressBar = new _this.ProgressBar($('#upload-progress'));
        var textInfosSwal = ''
        var textWarningSwal =''
        if (_this.nbDateOutOfLimit > 0 || _this.nbDateInLimit > 0 ) {
          if(_this.nbPhotos === 1 ) {
            textInfosSwal+=_this.nbDateOutOfLimit+'/'+_this.nbPhotos+' photo out of session and will not be uploaded\n'
          }
          else {
            textInfosSwal+=_this.nbDateOutOfLimit+'/'+_this.nbPhotos+' photos out of session and will not be uploaded\n'
          }
         
        }
        if(_this.nbDateInLimit > 0) {
          if(_this.nbPhotos === 1 ) {
            textInfosSwal+=_this.nbDateInLimit+'/'+_this.nbPhotos+ ' photos in session range limit (+- 24h) and could be uploaded\n'
          }
          else {
            textInfosSwal+=_this.nbDateInLimit+'/'+_this.nbPhotos+ ' photos in session range limit (+- 24h) and could be uploaded\n'
          }
          
        }
        if(_this.availableSpace.usedPercentage > 70) {
          textWarningSwal+='Care : disk usage: '+_this.availableSpace.usedPercentage+'% \n'
          textWarningSwal+='Please contact and admin to inform'
        }

        if(textWarningSwal && textInfosSwal) {
          Swal({
            title: 'Infos',
            text: textInfosSwal,
            type: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            closeOnCancel: false,
            closeOnConfirm: false,

          },function(isconfirm) {
            Swal({
              title: 'Warning',
              text: textWarningSwal,
              type: 'warning',
              showCancelButton: false,
              confirmButtonText: 'OK',
              closeOnCancel: true
            });
          })
        }
        else if(textInfosSwal || textWarningSwal) {
          var text = textInfosSwal || textWarningSwal;
          Swal({
            title: 'Warning',
            text: text,
            type: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            closeOnCancel: true
          });
        }
      
        _this.displayGridSession();
        _this.displayGridPhotos();
        _this.gridViewSession.gridOptions.api.sizeColumnsToFit()
        /*  $('.btn.btn-primary.start').on('click' , function() {
            _this.detailColClicked(this);
          })*/


      });

    },

    detailColClicked: function (ref) {
      var _this = this;
      var elem = ref.firstElementChild;
      if (elem.className.indexOf('plus') > -1) {
        elem.className = elem.className.replace('plus', 'minus')
      } else {
        elem.className = elem.className.replace('minus', 'plus')
      }

      var cols = _this.gridViewSession.gridOptions.columnApi.getAllColumns();
      cols.forEach(function (col) {
        if (col.colDef.hide) {
            _this.gridViewSession.gridOptions.columnApi.setColumnVisible(col.colId, _this.showHiddenCols);
        }
      });
      _this.showHiddenCols = !_this.showHiddenCols
      _this.gridViewSession.gridOptions.api.sizeColumnsToFit()
      /* $('.btn.btn-primary.start').on('click' , function() {
         _this.detailColClicked(this);
       })*/
    },


    updateColJetLag: function (newDateObj) {
      var _this = this;
      this.gridViewPhotos.gridOptions.api.forEachNode(function (rowNode) {
        rowNode.setDataValue('jetLag', '' + _this.jetLag.operator + '' + _this.jetLag.hours + '')
        rowNode.setDataValue('dateFind', rowNode.data.dateFind);
        rowNode.setDataValue('status', _this.calculateStatus(rowNode.data.dateFind));
      });
      this.gridViewPhotos.gridOptions.api.refreshView();


    },

    configResumable: function () {
      var _this = this;
      //TODO extend error (date , present on server etc)
      this.r.on('fileError', function (file, message) {
        _this.uploadInfos.nbFilesRefused+=1;
        switch(message){
          case 'Date not valid' : {
            _this.reasonRefused.date += 1;
            break;
          }
          case 'exist' : {
            _this.reasonRefused.exist += 1;
            break;
          }
          default : {
            _this.reasonRefused.unknown += 1;
            break;
          }
        }
      });
      this.r.on('fileSuccess', function(file,message) {
        if(message === "ok") {
          _this.uploadInfos.nbFilesAccepted += 1;
        }
        else {
          _this.uploadInfos.nbFilesExistOnServer += 1;
        }
      });
      this.r.on('complete', function() {
        $('#myPleaseWait').modal('hide');
        var text = '';
        if(_this.nbDateOutOfLimit) {
          text+= 'You try to upload '+_this.nbPhotos+' photos\n';
          if(_this.nbDateOutOfLimit === 1 ) {
            text += _this.nbDateOutOfLimit + ' photo cancelled before upload, because out of range session\n'
          }
          else {
            text += _this.nbDateOutOfLimit + ' photos cancelled before upload, because out of range session\n'
          }
          text+= 'So on '+(_this.nbPhotos - _this.nbDateOutOfLimit)+' photos you sent : \n'
        }
        else {
          text+='You sent '+_this.nbPhotos+' photos : \n';
        }
        if(_this.uploadInfos.nbFilesExistOnServer) {
          if(_this.uploadInfos.nbFilesExistOnServer === 1 ) {
            text += _this.uploadInfos.nbFilesExistOnServer + ' photo already exists on the server\n'
          }
          else {
            text += _this.uploadInfos.nbFilesExistOnServer + ' photos already exist on the server\n'
          }
        }
        if(_this.uploadInfos.nbFilesRefused ) {
          if(_this.uploadInfos.nbFilesRefused === 1 ) {
            text += _this.uploadInfos.nbFilesRefused + ' photo has been refused\n'
          }
          else {
            text += _this.uploadInfos.nbFilesRefused + ' photos have been refused\n'
          }
        }
        if(_this.uploadInfos.nbFilesAccepted) {
          if(_this.uploadInfos.nbFilesAccepted === 1 ) {
            text += _this.uploadInfos.nbFilesAccepted + ' photo has been accepted\n'
          }
          else {
            text += _this.uploadInfos.nbFilesAccepted + ' photos have been accepted\n'
          }
        }
        Swal({
          title: 'Upload complete',
          text: text,
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: 'green',
          confirmButtonText: 'Go to Validate',
          cancelButtonText: 'Import new camera trap photo',
          closeOnCancel: true
        },
        function(isConfirm){
          if(isConfirm) {
           Backbone.history.navigate('validate/camtrap',{trigger:true}) ;
          } else {
            Backbone.history.loadUrl(Backbone.history.fragment);
          }
        }
      );

      })

      this.r.on('progress', function (file, message) {
        var val = (_this.r.progress() * 100).toFixed(2);
        _this.progressBarElem.style.width = val+'%';
      });



    },

    onDestroy: function () {

    },
    formatSize: function(params) {

    },
    displayGridSession: function () {
      var _this = this;
      var dataObj = this.model.get('row');
      dataObj['free'] = this.availableSpace.free;
      dataObj['total'] = this.availableSpace.total;
      dataObj['used'] = this.availableSpace.used;
      dataObj['usedPercentage'] = this.availableSpace.usedPercentage;

      var data = Array(dataObj);

      console.log(data)

      var columnsDefs = [{
          field: 'StartDate',
          headerName: 'Start Date',
          maxWidth: 500
        },
        {
          field: 'EndDate',
          headerName: 'End Date',
          maxWidth: 500
        },
        {
          field: 'UnicIdentifier',
          headerName: 'Monitored Site',
          maxWidth: 500
        },
        {
          field: 'Name',
          headerName: 'Site Name',
          maxWidth: 500
        },
        {
          field: 'usedPercentage',
          headerName: "disk occupation",
          hide: true,
          maxWidth: 500,
          cellRenderer: function (params) {
            var divContainer = document.createElement('div');
            var divContent = document.createElement('div');

            divContainer.style.width = '100%';
            divContainer.style.height = '100%';
            divContainer.style.boxSizing = 'border-box';
            divContainer.style.border = 'solid 1px black';
            divContent.style.height = '100%';
            switch(true) {
              case (params.data.usedPercentage >= 90) : {
                divContent.style.backgroundColor = 'Red';
                break;
              }
              case (70 < params.data.usedPercentage < 90) : {
                divContent.style.backgroundColor = 'Yellow';
                break;
              }
              default : {
                divContent.style.backgroundColor = 'Green';
                break;
              }

            }
            
            divContent.style.textAlign = 'center';
            divContent.style.width = params.data.usedPercentage+'%';
            divContent.innerHTML = params.data.usedPercentage+'%';
            divContainer.append(divContent);
            return divContainer;
          }
        },
        {
          field: 'free',
          headerName: "free size",
          hide: true,
          maxWidth: 500,
          valueGetter : function(params) {
            var tmpSpace = params.data.free / (1024 * 1024)
            if (tmpSpace >= (1024 * 1024)) {
              return (tmpSpace / (1024 * 1024)).toFixed(2) + ' Tb';
            } else if (tmpSpace >= 1024) {
              return (tmpSpace / 1024).toFixed(2) + ' Gb';
            } else {
              return (tmpSpace).toFixed(2) + ' Mb';
            }
          }
        },
        {
          field: 'total',
          headerName: "total size",
          hide: true,
          maxWidth: 500,
          valueGetter : function(params) {
            var tmpSpace = params.data.total / (1024 * 1024)
            if (tmpSpace >= (1024 * 1024)) {
              return (tmpSpace / (1024 * 1024)).toFixed(2) + ' Tb';
            } else if (tmpSpace >= 1024) {
              return (tmpSpace / 1024).toFixed(2) + ' Gb';
            } else {
              return (tmpSpace).toFixed(2) + ' Mb';
            }
          }
        },
        {
          field: 'Details',
          // headerName :'Details',
          headerCellTemplate: function () {
            var eCell = document.createElement('span');
            var btnElem = '<button class="js-btndetailssession btn btn-primary start"><i class="glyphicon glyphicon-plus"></i><span></span></button>';
            if (_this.showHiddenCols === false) {
              btnElem = '<button class="js-btndetailssession btn btn-primary start"><i class="glyphicon glyphicon-minus"></i><span></span></button>'
            }
            eCell.innerHTML =
              // '<div class="ag-header-cell">'+
              '<div id="agResizeBar" class="ag-header-cell-resize"></div>' +
              '<span id="agMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
              '<div id="agHeaderCellLabel" class="ag-header-cell-label">' +
              btnElem +
              '<span id="agSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
              '<span id="agSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
              '<span id="agNoSort" class="ag-header-icon ag-sort-none-icon"></span>' +
              '<span id="agFilter" class="ag-header-icon ag-filter-icon"></span>' +
              '<span id="agText" class="ag-header-cell-text"></span>' +
              // '</div>'+
              '</div>'

            // put a button in to show calendar popup
            var eCalendar = eCell.querySelector('.js-btndetailssession');
            eCalendar.addEventListener('click', function () {
              _this.detailColClicked(this);
            });

            return eCell;
          },
          width: 50,
          maxWidth: 50,
          suppressSizeToFit: true

        }
        //headerName: '<button class="btn btn-primary start"><i class="glyphicon glyphicon-plus"></i><span></span></button>', maxWidth : 50}
      ];

      this.rgGridSession.show(
        this.gridViewSession = new GridView({
          columns: columnsDefs,
          clientSide: true,
          gridOptions: {
            rowData: Array(this.model.get('row')),
            skipFocus: true,
            enableFilter: false,
            enableSorting: false,
            suppressRowClickSelection: false,

          }
        })
      );

    },

    calculateStatus : function(curDate) {
      var _this = this;
      var dateSessionStartDate = new Date(_this.model.get('minDate'));
      var dateSessionEndDate = new Date(_this.model.get('maxDate'));
      var dateCurrent = new Date(curDate);
      var time = _this.jetLag.hours.split(':');
      var operator = 1;
      if (_this.jetLag.operator == '-') {
        operator = -1;
      }
      dateCurrent.setHours(dateCurrent.getHours() + operator * Number(time[0]));
      dateCurrent.setMinutes(dateCurrent.getMinutes() + operator * Number(time[1]));
      dateCurrent.setSeconds(dateCurrent.getSeconds() + operator * Number(time[2]));
      // dateCurrent+= dateCurrent.getHours + time[0]
      switch (true) {
        case (dateCurrent >= dateSessionStartDate && dateCurrent <= dateSessionEndDate):{
          return 1;
          break;
        }
        case (dateCurrent < dateSessionStartDate || dateCurrent > dateSessionEndDate): {
          return  -1;
          break;
        }
      }
    },

    displayGridPhotos: function () {
      var _this = this;

      var columnsDefs = [{
        field: 'fileName',
        headerName: 'Name',
        cellRenderer: function (params) {
          if (params.data.status == -1)
            return '<del>' + params.value + '</del>';
          else
            return params.value;
        },
        maxWidth: 500
      }, {
        field: 'size',
        headerName: 'Size',
        cellRenderer: function (params) {

          if (params.data.status == -1)
            return '<del>' + (Number(params.value) / (1024 * 1024)).toFixed(2) + 'Mo </del>';
          else
            return (Number(params.value) / (1024 * 1024)).toFixed(2) + 'Mo';
        },
        maxWidth: 500
      }, {
        field: 'dateFind',
        headerName: 'date(+/- décalage horaire)',
        maxWidth: 500,
        cellRenderer: function (params) {
          if (params.data.jetLag != '00:00:00' && params.data.jetLag != '+00:00:00' && params.data.jetLag != '-00:00:00')
            return '<span>' + params.data.dateFind + '(' + params.data.jetLag + ')</span>'
          else
            return '<span>' + params.data.dateFind + '</span>'
        },
        cellStyle: function (params) {
          switch(params.data.status) {
            case -1: {
              return { 'color': 'red'};
              break;
            }
            default : {
              return {'color' : 'green'}
            }
          }

        }

      }, {
        field: 'jetLag',
        headerName: 'jetLag',
        maxWidth: 500,
        hide: true
      }, {
        field: 'status',
        headerName: 'Status',
        maxWidth: 500,
        cellRenderer : function(params) {
          var elem = document.createElement('span');
         if(params.data.status === -1 ) {
          elem.innerHTML = 'Will be refused'
         }
         if(params.data.status === 1) {
          elem.innerHTML = 'Will be accepted'
         }
         return elem;
        } ,
        cellStyle : function (params) {
          switch (params.value) {
            case -1:
              return {
                'color': 'red'
              }
              break;
            default:{
              return {
                'color': 'green',
                'font-weight': 'bold'
              }
              break;
            }
          }
        }
      }];

      var data = {}
      data = this.r.files.map(function (elem) {
        var status = 1;
          status = _this.calculateStatus(elem.dateFind.dateString)

        return {
          fileName: elem.fileName,
          size: elem.size,
          dateFind: elem.dateFind.dateString,
          jetLag: '00:00:00',
          status: status
        }
      });

      this.rgGridPhotos.show(this.gridViewPhotos = new GridView({
        columns: columnsDefs,
        clientSide: true,
        gridOptions: {
          rowData: data,
          skipFocus: true,
          enableFilter: false,
          enableSorting: false,
          suppressRowClickSelection: true,
        }
      }));
    },

    validate: function () {
      var _this = this;
      var rowFromGrid = this.model.get('row');
      if (rowFromGrid) {
        var unicIdentifier = rowFromGrid.UnicIdentifier;
        var name = rowFromGrid.Name;
        var startDate = rowFromGrid.StartDate;
        var endDate = rowFromGrid.EndDate || "0000-00-00 00:00:00";
        var path = String(unicIdentifier) + "_" + String(startDate.split(" ")[0]) + "_" + String(endDate.split(" ")[0]) + "_" + String(name);
        var sensorId = this.model.get('sensorId');
        var listOfResumableFile = this.model.get('resumableFile');

        var params = {
          unicIdentifier: unicIdentifier,
          name: name,
          startDate: startDate,
          endDate: endDate,
          path: path,
          sensorId: sensorId
        };

        this.r.updateQuery({
          path: params.path,
          id: params.sensorId,
          monitoredSiteId: rowFromGrid.MonitoredSiteID,
          startDate: params.startDate,
          endDate: params.endDate,
          jetLagHours: _this.jetLag.hours,
          jetLagOperator: _this.jetLag.operator
        });
        this.sendData(params);
        //  return this.model;
      }
    },

  });
});

