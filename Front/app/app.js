define([
  'marionette',
  'lyt-rootview',
  'router',
  'controller',
  'sweetAlert',
  'config',
  'jquery',
  'backbone',

  //circular dependencies, I don't konw where to put it 4 the moment

  'ns_modules/ns_bbfe/bbfe-timePicker',
  'ns_modules/ns_bbfe/bbfe-dateTimePicker',
  'ns_modules/ns_bbfe/bbfe-autocomplete',
  'ns_modules/ns_bbfe/bbfe-listOfNestedModel/bbfe-listOfNestedModel',
  'ns_modules/ns_bbfe/bbfe-gridForm',
  'ns_modules/ns_bbfe/bbfe-autocompTree',
  'ns_modules/ns_bbfe/bbfe-fileUpload',
  'ns_modules/ns_bbfe/bbfe-select',
  'ns_modules/ns_bbfe/bbfe-gridForm',
  'ns_modules/ns_bbfe/bbfe-ajaxButton',
  'ns_modules/ns_bbfe/bbfe-lon',
  'ns_modules/ns_bbfe/bbfe-lat',
  'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',

  ],

function( Marionette, LytRootView, Router, Controller,Swal,config, $, Backbone) {

    var app = {};
    var JST = window.JST = window.JST || {};
    window.xhrPool = [];

    window.onkeydown = function (e) {
      if (e.keyCode == 8 ) {  //backspace key
         if( !( e.target.tagName == 'INPUT' ||  e.target.tagName == 'TEXTAREA') ) { //handle event if not in input or textarea
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

     window.addEventListener('mousewheel', function(event) {
      if(document.activeElement.type == "number"){
        event.preventDefault();
        event.stopPropagation();
        document.activeElement.blur();
      }
    });

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

  window.swal = function(opt, type, callback, showCancelBtn) {
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
      title: opt.title,
      text: opt.text || '',
      type: type,
      showCancelButton: showCancelBtn,
      confirmButtonColor: btnColor,
      confirmButtonText: 'OK',
      closeOnConfirm: true,
    },
    function(isConfirm) {
      //could be better
      if (isConfirm && callback) {
        callback();
      }
    });
  };

  window.thesaurus = {};
  window.RegionLayers = {};

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
      $('#header-loader').addClass('hidden');
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
      if(options.type === 'GET' || options.url.indexOf('http://') !==-1 ){ //should be a GET!! (thesaurus calls)
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
      if(jqxhr.status == 409){
        Swal({
          title: 'Data conflicts',
          text: jqxhr.responseText,
          type: 'warning',
          showCancelButton: false,
          confirmButtonColor: 'rgb(240, 173, 78)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        });
      }
    }
  });

    window.formInEdition= {};

    // get not allowed urls in config.js
    window.notAllowedUrl = [];
    if (config.disabledFunc) {
      var disabled = config.disabledFunc;
      for (var i=0; i< disabled.length;i++) {
        window.notAllowedUrl.push(disabled[i]);
      }
    }

  window.checkExitForm = function(confirmCallback,cancelCallback) {
    var i = 0;
    var urlChangeMax = 0 ;
    var indexMax = 0 ;
    if(!$.isEmptyObject(window.formInEdition)){

        var newUrlSplit=  window.location.hash.split('?');
        var oldUrlSplit = window.formInEdition.form.baseUri.replace(window.location.origin,'').replace(window.location.pathname,'').split('?');

        var toto = Object.keys(window.formInEdition.form).map(function(key2, index2) {
          if( (newUrlSplit[index2-1] != oldUrlSplit[index2-1]) || newUrlSplit[0] != oldUrlSplit[0]){
            if(window.formInEdition.form[key2].formChange){
              i++;
            }
            urlChangeMax++;
            return 1;
          } else{
            indexMax++;
            return 0;
          }
        });
    }

    if(i > 0){
      var title = i18n.translate('swal.savingForm-title');
      var savingFormContent =  i18n.translate('swal.savingForm-content');
      window.onExitForm = $.Deferred();
      //var cancelMsg = i18n.translate('button.cancel');

      Swal({
        title: title,
        text: savingFormContent,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'rgb(221, 107, 85)',
        confirmButtonText: 'Quit',
        customClass: 'swal-cancel-btn-green',
        cancelButtonText: 'Continue edition',
        closeOnConfirm: true,
      },
      function(isConfirm) {
        if (!isConfirm) {
          if (cancelCallback) {
            window.onExitForm.reject();
            cancelCallback();
          }
          return false;
        } else {
          if (confirmCallback) {
            // Swal({
            //   title: 'Saving form',
            //   text: 'save it ?',
            //   type: 'warning',
            //   showCancelButton: true,
            //   confirmButtonColor: 'green',
            //   confirmButtonText: 'Yes',
            //   cancelButtonColor: 'grey',
            //   cancelButtonText: 'No',
            //   closeOnConfirm: true,
            // }, 
            // function(isConfirm){
            //   if (isConfirm) {
            //     var toto = Object.keys(window.formInEdition.form).map(function(key2, index2) {
            //         if(window.formInEdition.form[key2].formChange){
            //           window.formInEdition.form[key2].reloadingAfterSave = function(){};
            //           window.formInEdition.form[key2].afterSaveSuccess = function(response){};
            //           window.formInEdition.form[key2].butClickSave(null);
            //         }
            //     });
          // }
              if(indexMax-urlChangeMax<=0){
                window.formInEdition = {};
              }
              window.onExitForm.resolve();
              confirmCallback();
            // });
          }
        }
      });
    } else {
      if (confirmCallback){
        if(indexMax-urlChangeMax<=0){
          window.formInEdition = {};
        }
        //window.onExitForm.resolve();
        confirmCallback();
      }
    }
};

  window.app = app;
  return app;
});
