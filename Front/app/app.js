define(['marionette', 'lyt-rootview', 'router', 'controller','sweetAlert','config',
  //circular dependencies, I don't konw where to put it 4 the moment
  'ns_modules/ns_bbfe/bbfe-number',
  'ns_modules/ns_bbfe/bbfe-timePicker',
  'ns_modules/ns_bbfe/bbfe-dateTimePicker',
  'ns_modules/ns_bbfe/bbfe-autocomplete',
  'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',
  'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-nonIdPicker',
  'ns_modules/ns_bbfe/bbfe-listOfNestedModel/bbfe-listOfNestedModel',
  'ns_modules/ns_bbfe/bbfe-gridForm',
  'ns_modules/ns_bbfe/bbfe-autocompTree',
  'ns_modules/ns_bbfe/bbfe-fileUpload',
  'ns_modules/ns_bbfe/bbfe-select',
  'ns_modules/ns_bbfe/bbfe-gridForm',
  'ns_modules/ns_bbfe/bbfe-ajaxButton',
  'ns_modules/ns_bbfe/bbfe-lon',
  'ns_modules/ns_bbfe/bbfe-lat',
  'ns_modules/ns_cell/bg-timestampCell',
  'ns_modules/ns_cell/autocompCell',
  'ns_modules/ns_cell/bg-integerCell',

  ],
function( Marionette, LytRootView, Router, Controller,Swal,config) {

  var app = {};
  var JST = window.JST = window.JST || {};
  window.xhrPool = [];


  Backbone.Marionette.Renderer.render = function(template, data) {
    if (!JST[template]) throw 'Template \'' + template + '\' not found!';
    return JST[template](data);
  };

  app = new Marionette.Application();
  app.on('start', function() {
    app.rootView = new LytRootView();
    app.controller = new Controller();
    app.router = new Router({controller: app.controller});
    app.rootView.render();
    Backbone.history.start();
  });

  window.thesaurus = {};

  $(window).ajaxStart(function(e) {
    $('#header-loader').removeClass('hidden');
  });

  $(window).ajaxStop(function() {
    $('#header-loader').addClass('hidden');
  });

  $(window).ajaxError(function() {
    $('#header-loader').addClass('hidden');
  });

  window.onerror = function() {
    $('#header-loader').addClass('hidden');
  };

  $.xhrPool = []; // array of uncompleted requests
  $.xhrPool.allowAbort = false;
  $.xhrPool.abortAll = function() { // our abort function
    if ($.xhrPool.allowAbort){
      $(this).each(function(idx, jqXHR) { 
          jqXHR.abort();
      });
      $.xhrPool.length = 0
    }
  };

  $.ajaxSetup({
    beforeSend: function(jqXHR) { // before jQuery send the request we will push it to our array
      $.xhrPool.push(jqXHR);
    },
    complete: function(jqXHR) { // when some of the requests completed it will splice from the array
      var index = $.xhrPool.indexOf(jqXHR);
      if (index > -1) {
        $.xhrPool.splice(index, 1);
      }
    }
  });

  window.UnauthAlert = function(){
    Swal({
        title: 'Unauthorized',
        text: "You don't have permission",
        type: 'warning',
        showCancelButton: false,
        confirmButtonColor: 'rgb(240, 173, 78)',
        confirmButtonText: 'OK',
        closeOnConfirm: true,
      });
  }

  $(document).ajaxError(function( event, jqxhr, settings, thrownError ) {
    if (jqxhr.status == 401){
      window.UnauthAlert();
    }
  });

  window.formChange = false;
  window.formEdition = false;
  window.checkExitForm = function(confirmCallback,cancelCallback) {
    if(window.formChange && window.formEdition){
        Swal({
            title: 'Saving form',
            text: 'Current form is not yet saved. Would you like to continue without saving it?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'rgb(221, 107, 85)',
            confirmButtonText: 'OK',
            cancelButtonColor: 'grey',
            cancelButtonText: 'Cancel',
            closeOnConfirm: true,
        },
        function(isConfirm) {
           if (!isConfirm) {
              if (cancelCallback){
                cancelCallback();
              }
              return false;
            }else {
                if (confirmCallback){
                  window.formChange = false;
                  window.formEdition = false;
                  confirmCallback();
                }
            }
        });
      } else {
        if (confirmCallback){
          confirmCallback();
        }
      }
  };

  window.onerror = function (errorMsg, fileURI, lineNumber, column, errorObj) {
    $.ajax({
      type : 'POST',
      url : config.coreUrl+'log/error',
      data:{StackTrace:errorObj,
        errorMsg: errorMsg,
        file : fileURI,
        lineNumber:lineNumber,
        column:column }
    });
  }

  window.app = app;
  return app;
});
