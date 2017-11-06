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
  'dateTimePicker',
  'moment',
  'i18n'

], function($, _, Backbone, Marionette, Swal,  config,
  Step, Com, Resumable ,GridView, Decimal5Renderer, DateTimeRenderer ,
  Editors, Renderers,	DateTimePicker, Moment
) {

  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/camTrap/templates/tpl-step3-camtrap.html',

    name: 'Camera Trap Files Send',
    events: {
    },
    regions: {
      rgGrid: '.js-rg-grid'
    },
    ui: {
    },
    initialize: function(options) {
      var _this = this;
      this.nbDateOutOfLimit = 0;
      this.nbDateInLimit = 0;
      this.flagDate
      this.parent = options.parent;
      this.model = options.model || new Backbone.Model();
      this.com = new Com();
      this.r = this.model.get('resumable');
      this.evalSizeOfPhotos(this.model.get('resumable').files);
      this.configResumable();
      this.model.set('availableSpace', 'N/A');
      this.getAvailableSpace().then(function() {
         _this.render();
        });
      this.model.set('minDate', new Date (this.model.get('row').StartDate) );
      this.model.set('maxDate', new Date(this.model.get('row').EndDate ) ) ;
      this.checkDate();
    },

    evalSizeOfPhotos: function(arrayOfResumableFile) {

      //TODO V2 do it on step1 when add file
      this.model.set('size', ( arrayOfResumableFile.reduce(function(acc,file) { return acc+file.size},0) / (1024*1024)).toFixed(2));
    },

    checkDate : function() {
      var dateMin = new Date ( this.model.get('minDate') );
      var dateMax = new Date ( this.model.get('maxDate') );
      if( this.r.files.length > 0 ) {
        this.r.files.forEach(function(element) {
          var diffMin = (element.dateFind.dateObj - dateMin) / 1000 / 3600; //number of hours in abs
          var diffMax = (dateMax - element.dateFind.dateObj) / 1000 / 3600;

          if( diffMin <= -24 || diffMax <= -24) {
            this.nbDateOutOfLimit +=1;
            element.outOfRange = true;
          }
          else if( (-24 < diffMin && diffMin < 0) || ( -24 < diffMax && diffMax < 0) ) {
            this.nbDateInLimit +=1;
            element.inRange = true;
          }
          else {
            console.log("date in range")
          }
        }, this);

      }
      console.log(" nb date out of range " , this.nbDateOutOfLimit);
      console.log(" nb date in range for correction ", this.nbDateInLimit)

      //TODO check all date swal and define range possible, impossible

    },


    sendData : function(params) {
      var _this = this;
      this.progressBar.startUpload();
      $.ajax({
        type: "POST",
        url: config.coreUrl + 'sensorDatas/camtrap/concat',
        data: {
          path : params.path,
          action : 0 // create folder
        }
      })
      .done( function(response,status,jqXHR){
        if( jqXHR.status === 200 ){
          this.r = _this.model.get('resumable'); // TODO mettre dans init
          this.r.updateQuery({
            path : params.path,
            id : params.sensorId,
            startDate: params.startDate,
            endDate: params.endDate
          });
          this.r.upload();
        }
      })
      .fail( function( jqXHR, textStatus, errorThrown ){
        console.log("error");
        console.log(errorThrown);
      });

    },

    check: function() {

      return true;
      // if (this.ui.requirement.val()) {
      //   return true;
      // } else {
      //   return false;
      // }
    },

    getAvailableSpace : function() {

      this.dfd = $.Deferred();
      
      var _this = this;
      return this.dfd = $.ajax({
        type: "GET",
        url: config.coreUrl + 'dashboard/availableSpace',
      })
      .done( function(response,status,jqXHR){
        if( jqXHR.status === 200 ){
          var tmpSpace = response.free/(1024*1024)
          if (tmpSpace >= (1024*1024) ) {
            _this.model.set('availableSpace', (tmpSpace/(1024*1024)).toFixed(2) + ' Tb');
          }
          else if( tmpSpace >= 1024) {
            _this.model.set('availableSpace', (tmpSpace/(1024)).toFixed(2) + ' Gb');
          }
          else {
            _this.model.set('availableSpace', (tmpSpace).toFixed(2) + ' Mb');
          }
          _this.$el.show();
        }
      })
      .fail( function( jqXHR, textStatus, errorThrown ){
        console.log("error");
        console.log(errorThrown);
      });
      //this.dfd.resolve();


    },
    ProgressBar : function(ele) {
      this.thisEle = $(ele);

      this.startUpload = function() {
        (this.thisEle).removeClass('hide').find('.progress-bar').css('width','0%');
      },

      this.uploading = function(progress) {
        (this.thisEle).find('.progress-bar').attr('style', "width:"+progress+'%');
      },

      this.finish = function() {
        (this.thisEle).find('.progress-bar').css('width','100%');
      }
    },

    displayGrid: function() {
      var _this = this;

      var columnsDefs = [
        // {
        //   field: 'id',
        //   headerName: 'ID',
        //   hide: true
        // },
        {
          field: 'fileName',
          headerName: 'Name',
          filter :"text"
        },{
          field: 'size',
          headerName: 'Size',
          // cellRenderer: Decimal5Renderer,
          // filter :"number"
        },{
          field: 'dateFind',
          headerName: 'date',
          // cellRenderer: DateTimeRenderer,
          // filter : "date"
        }
      ];
      
      var data = {}
      data = this.r.files.map(function(elem) {
        return {
          fileName : elem.fileName,
          size : elem.size,
          dateFind: elem.dateFind.dateString
        }
      })


      this.rgGrid.show(this.gridView = new GridView({
        com: this.com,
        columns: columnsDefs,
        clientSide: true,
        gridOptions: {
          rowData: data,
        //  enableFilter: true,
        //  singleClickEdit : true,
        //  rowSelection: 'multiple'
         /* onRowDoubleClicked: function (row){
            if(_this.gridView.gridOptions.api.getFocusedCell().column.colId != 'fieldActivity'){
              _this.gridView.interaction('focusAndZoom', row.data.ID || row.data.id);
            }
          },
          onRowClicked: function(row){
            var currentClickColumn = _this.gridView.gridOptions.api.getFocusedCell().column.colId;
            if(currentClickColumn != 'fieldActivity' && currentClickColumn != 'Place' ){
              _this.gridView.interaction('focus', row.data.ID || row.data.id);
            }
          }*/
        }
      }));

    },


    onShow: function() {
      
      this.progressBar = new this.ProgressBar($('#upload-progress'));
      // this.nbDateOutOfLimit = 0;
      // this.nbDateInLimit = 0;
      if( this.nbDateOutOfLimit > 0 ) {
        Swal({
          title: 'Out of range\'s limit',
          text: 'Some photos are out of session range limit (+- 24h)', 
          type: 'error',
          showCancelButton: false,
          confirmButtonText: 'OK',
          closeOnCancel: true
        });
      }

      $('#datetimepicker3').dateTimePicker({
        format :'LT'
      });

      this.displayGrid();




    },

    configResumable: function() {
      var _this = this;
      this.r.on('fileError',function(file,message) {
        console.warn("fichier refusé",file.fileName);
      })
      this.r.on('progress' , function(file,message) {
        /*
        $("#"+file.uniqueIdentifier+"").css("color" ,"#f0ad4e");
        $("#"+file.uniqueIdentifier+" > "+"#status").text("Uploading");*/
        _this.progressBar.uploading(_this.r.progress()*100);
      //  $('#pause-upload-btn').find('.reneco').removeClass('reneco-play').addClass('reneco-pause');
      });

      

    },

    onDestroy: function() {

    },

    validate: function() {
      var _this = this;
      var rowFromGrid = this.model.get('row'); 
      if(rowFromGrid) {
        var unicIdentifier = rowFromGrid.UnicIdentifier;
        var name = rowFromGrid.Name;
        var startDate = rowFromGrid.StartDate;
        var endDate = rowFromGrid.EndDate || "0000-00-00 00:00:00";
        var path = String(unicIdentifier)+"_"+String(startDate.split(" ")[0])+"_"+String(endDate.split(" ")[0])+"_"+String(name);
        var sensorId = this.model.get('sensorId');
        var listOfResumableFile = this.model.get('resumableFile');
  
        var params = {
          unicIdentifier : unicIdentifier,
          name : name,
          startDate : startDate,
          endDate : endDate,
          path : path,
          sensorId : sensorId
        };
  
        this.r.updateQuery({
          path : params.path,
          id : params.sensorId,
          startDate: params.startDate,
          endDate: params.endDate
        });
        this.sendData(params);
      //  return this.model;
      }
      else {
        Swal({
          title: 'Warning',
          text: 'You need to choose a session', 
          type: 'warning',
          showCancelButton: false,
          confirmButtonText: 'OK',
          closeOnCancel: true
        })
      }
      
    },

  });
});
