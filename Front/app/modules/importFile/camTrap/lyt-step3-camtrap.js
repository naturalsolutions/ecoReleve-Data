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
      this.did = true;
      this.nbDateInLimit = 0;
      this.flagDate
      this.parent = options.parent;
      this.model = options.model || new Backbone.Model();
      this.com = new Com();
      this.r = this.model.get('resumable');
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
      this.model.set('minDate', new Date(this.model.get('row').StartDate));
      this.model.set('maxDate', new Date(this.model.get('row').EndDate));
      this.checkDate();
      this.deferredSize = this.getAvailableSpace();
    },

    evalSizeOfPhotos: function (arrayOfResumableFile) {

      //TODO V2 do it on step1 when add file
      this.model.set('size', (arrayOfResumableFile.reduce(function (acc, file) {
        return acc + file.size
      }, 0) / (1024 * 1024)).toFixed(2));
    },

    checkDate: function () {
      var dateMin = new Date(this.model.get('minDate'));
      var dateMax = new Date(this.model.get('maxDate'));
      if (this.r.files.length > 0) {
        this.r.files.forEach(function (element) {
          var diffMin = (element.dateFind.dateObj - dateMin) / 1000 / 3600; //number of hours in abs
          var diffMax = (dateMax - element.dateFind.dateObj) / 1000 / 3600;

          if (diffMin <= -24 || diffMax <= -24) {
            this.nbDateOutOfLimit += 1;
            element.outOfRange = true;
          } else if ((-24 < diffMin && diffMin < 0) || (-24 < diffMax && diffMax < 0)) {
            this.nbDateInLimit += 1;
            element.inRange = true;
          } else {
            console.log("date in range")
          }
        }, this);

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
      this.removeRefusedFiles(this.model.get('resumable'));

      this.progressBar.startUpload();
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
            this.r = _this.model.get('resumable'); // TODO mettre dans init
            this.r.upload();
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
            var tmpSpace = response.free / (1024 * 1024)
            if (tmpSpace >= (1024 * 1024)) {
              _this.model.set('availableSpace', (tmpSpace / (1024 * 1024)).toFixed(2) + ' Tb');
            } else if (tmpSpace >= 1024) {
              _this.model.set('availableSpace', (tmpSpace / (1024)).toFixed(2) + ' Gb');
            } else {
              _this.model.set('availableSpace', (tmpSpace).toFixed(2) + ' Mb');
            }
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

        // this.nbDateOutOfLimit = 0;
        // this.nbDateInLimit = 0;
        if (_this.nbDateOutOfLimit > 0) {
          Swal({
            title: 'Out of range\'s limit',
            text: 'Some photos are out of session range limit (+- 24h)',
            type: 'error',
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
          if (_this.did)
            _this.gridViewSession.gridOptions.columnApi.setColumnVisible(col.colId, true);
          else
            _this.gridViewSession.gridOptions.columnApi.setColumnVisible(col.colId, false);

        }
      });
      _this.did = !_this.did
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
      });


    },

    configResumable: function () {
      var _this = this;
      this.r.on('fileError', function (file, message) {
        console.warn("fichier refusé", file.fileName);
      })
      this.r.on('progress', function (file, message) {
        /*
        $("#"+file.uniqueIdentifier+"").css("color" ,"#f0ad4e");
        $("#"+file.uniqueIdentifier+" > "+"#status").text("Uploading");*/
        _this.progressBar.uploading(_this.r.progress() * 100);
        //  $('#pause-upload-btn').find('.reneco').removeClass('reneco-play').addClass('reneco-pause');
      });



    },

    onDestroy: function () {

    },
    displayGridSession: function () {
      var _this = this;

      var data = Array(this.model.get('row'))
      var t = 0
      data.forEach(function (row) {
        row['Details'] = null
        row['infos1'] = 'infos1_' + t
        row['infos2'] = 'infos2_' + t
        row['infos3'] = 'infos3_' + t

      })
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
          field: 'infos1',
          headerName: "infos1",
          hide: true,
          maxWidth: 500
        },
        {
          field: 'infos2',
          headerName: "infos2",
          hide: true,
          maxWidth: 500
        },
        {
          field: 'infos3',
          headerName: "infos3",
          hide: true,
          maxWidth: 500
        },
        {
          field: 'Details',
          // headerName :'Details',
          headerCellTemplate: function () {
            var eCell = document.createElement('span');
            var btnElem = '<button class="js-btndetailssession btn btn-primary start"><i class="glyphicon glyphicon-plus"></i><span></span></button>';
            if (_this.did === false) {
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

    calculateStatus : function(params) {
      var _this = this;
      var dateSessionStartDate = new Date(_this.model.get('minDate'));
      var dateSessionEndDate = new Date(_this.model.get('maxDate'));
      var dateCurrent = new Date(params.data.dateFind);
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
          params.status = 1;
          return "<span>Will be accepted</span>"
          break;
        }
        case (dateCurrent < dateSessionStartDate || dateCurrent > dateSessionEndDate): {
          params.status = -1;
          return "<span>Will be refused</span>"
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
          var dateSessionStartDate = new Date(_this.model.get('minDate'));
          var dateSessionEndDate = new Date(_this.model.get('maxDate'));
          // var timeSession = "00:00:00"
          var dateCurrent = new Date(params.data.dateFind);
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
            case (dateCurrent >= dateSessionStartDate && dateCurrent <= dateSessionEndDate):
              params.node.setDataValue('status',1)
              return {
                'color': 'green'
              }
              break;
            case (dateCurrent < dateSessionStartDate || dateCurrent > dateSessionEndDate):
              params.node.setDataValue('status',-1)
              return {
                'color': 'red'
              }
              break;
            default:
              break;
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
          return _this.calculateStatus(params);
        } ,
        cellStyle : function (params) {
          switch (params.value) {
            case 1:
              return {
                'color': 'green',
                'font-weight': 'bold'
              }
              break;
            case -1:
              return {
                'color': 'red'
              }
              break;
            default:
              break;
          }
        }
      }];

      var data = {}
      data = this.r.files.map(function (elem) {
        var status = 1;
        if (elem.inRange || elem.outOfRange) {
          status = -1
        }

        return {
          fileName: elem.fileName,
          size: elem.size,
          dateFind: elem.dateFind.dateString,
          jetLag: '00:00:00',
          status: status
        }
      })

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

