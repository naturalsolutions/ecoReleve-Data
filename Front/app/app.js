define([
  'marionette',
  'lyt-rootview',
  'router',
  'controller',
  'sweetAlert',
  'config',

  //circular dependencies, I don't konw where to put it 4 the moment
  'ns_modules/ns_bbfe/bbfe-number',
  'ns_modules/ns_bbfe/bbfe-timePicker',
  'ns_modules/ns_bbfe/bbfe-dateTimePicker',
  'ns_modules/ns_bbfe/bbfe-autocomplete',
  'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',
  'ns_modules/ns_bbfe/bbfe-listOfNestedModel/bbfe-listOfNestedModel',
  'ns_modules/ns_bbfe/bbfe-gridForm',
  'ns_modules/ns_bbfe/bbfe-autocompTree',
  'ns_modules/ns_bbfe/bbfe-fileUpload',
  'ns_modules/ns_bbfe/bbfe-select',
  'ns_modules/ns_bbfe/bbfe-gridForm',
  'ns_modules/ns_bbfe/bbfe-ajaxButton',
  'ns_modules/ns_bbfe/bbfe-lon',
  'ns_modules/ns_bbfe/bbfe-lat',

  ],

function( Marionette, LytRootView, Router, Controller,Swal,config) {

    var app = {};
    var JST = window.JST = window.JST || {};
    window.xhrPool = [];

    window.onkeydown = function (e) {
      if (e.keyCode == 8 ) {  //backspace key
        if( e.target.tagName != 'INPUT') { //handle event if not in input
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

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

  $.xhrPool = {};

  $.xhrPool.calls = []; // array of uncompleted requests
  
  $.xhrPool.allowAbort = false;

  $.xhrPool.abortAll = function() { // our abort function
    if ($.xhrPool.allowAbort){
      this.calls.map(function(jqxhr){
          jqxhr.abort();
      });
      $.xhrPool.calls = [];
    }
  };
  $.ajaxSetup({
    // before jQuery send the request we will push it to our array
    beforeSend: function(jqxhr, options) {
      if(options.url.indexOf('http://') !== -1) {
        options.url = options.url;
      } else {
        options.url = config.coreUrl + options.url;
      }
      if(options.type === 'GET'){
        $.xhrPool.calls.push(jqxhr);
      }
    },
    // when some of the requests completed it will splice from the array
    complete: function(jqxhr, options){      
      // var index = $.xhrPool.indexOf(jqxhr);
      // if (index > -1) {
      //   $.xhrPool.splice(index, 1);
      // }
    },
    error: function(jqxhr, options){
      if(jqxhr.status == 403){
        document.location.href = config.portalUrl;
      }
      if(jqxhr.status == 401){
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
    }
  });

    window.formChange = false;
    window.formEdition = false;

    // get not allowed urls in config.js
    window.notAllowedUrl = [];
    if (config.disabledFunc) {
      var disabled = config.disabledFunc;
      for (var i=0; i< disabled.length;i++) {
        window.notAllowedUrl.push(disabled[i]);
      }
    }

  window.checkExitForm = function(confirmCallback,cancelCallback) {
    if(window.formChange && window.formEdition){
      var title = i18n.translate('swal.savingForm-title');
      var savingFormContent =  i18n.translate('swal.savingForm-content');
      var cancelMsg = i18n.translate('button.cancel');
      Swal({
        title: title,
        text: savingFormContent,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'rgb(221, 107, 85)',
        confirmButtonText: 'OK',
        cancelButtonColor: 'grey',
        cancelButtonText: cancelMsg,
        closeOnConfirm: true,
      },
      function(isConfirm) {
        if (!isConfirm) {
          if (cancelCallback) {
            cancelCallback();
          }
          return false;
        } else {
          if (confirmCallback) {
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
    // $.ajax({
    //   type : 'POST',
    //   url : config.coreUrl+'log/error',
    //   data:{StackTrace:errorObj,
    //     errorMsg: errorMsg,
    //     file : fileURI,
    //     lineNumber:lineNumber,
    //     column:column }
    // });
  };

  window.app = app;
  return app;
});
