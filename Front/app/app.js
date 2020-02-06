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
  'ns_modules/ns_bbfe/bbfe-fieldworkarea-autocomplete',
  'ns_modules/ns_bbfe/bbfe-objectPicker/bbfe-objectPicker',
  'ns_modules/ns_bbfe/bbfe-mediaFile',

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

    function oauth2Flow() {

      /****** STARTING define function ****/

      function checkCode () {
        var keyToFind = "code"
        var toRet = null
        var qs = window.location.search.substring(1)
        if ( qs != '') {
          var pairs = qs.split('&')
          for (var i = 0; i < pairs.length; i++) {
            var tmp = pairs[i].split('=');
            var key = tmp[0];
            var value = tmp[1]
            if (decodeURIComponent(key) == keyToFind) {
              toRet = value
            }
          }
        }
        return toRet
      }
      function storeTokens(data) {
        localStorage.setItem("Authorization", data['access_token']);
        localStorage.setItem("refreshToken", data['refresh_token']);
      }
      function getTokenWithCode(codeToSend) {
        $.ajax({
          context: this,
          type: 'POST',
          url: 'http://api.com:6544/security/oauth2/v1/token',
          data: JSON.stringify({
            'grant_type' : "code",
            "code" : codeToSend
          }),
          dataType: 'json',
          contentType: 'application/json',
          success: function(data) {
            storeTokens(data)
          },
          error: function() {

          },
          complete: function() {

          }
        })
      }

      function checkValidityToken(token) {
        var toRet = false
        var tmp = token.split('.')
        var payload = JSON.parse(atob(tmp[1]))
        var now = new Date()
        //js timestamp is in milliseconds
        //python timestamp is in seconds
        var dateExp = new Date( payload['exp'] * 1000 )

        if ( now < dateExp ) {
          toRet = true
        }
        return toRet
      }
      function accessTokenExistAndValid() {
        var token = localStorage.getItem("Authorization")
        var toRet = false
        if (token == null) {
          toRet = false
        }
        else {
          toRet = checkValidityToken(token)
        }
        return toRet
      }
      function refreshTokenExistAndValid() {
        var token = localStorage.getItem("refreshToken")
        var toRet = false
        if (token == null) {
          toRet = false
        }
        else {
          toRet = checkValidityToken(token)
        }
        return toRet
      }
      function callPortalAndGetNewAccessToken() {
        var refresh_token = localStorage.getItem('refreshToken')
        $.ajax({
          context: this,
          type: 'POST',
          url: 'http://api.com:6544/security/oauth2/v1/token',
          data: JSON.stringify({
            'grant_type' : "refresh_token",
            "refresh_token" : refresh_token
          }),
          dataType: 'json',
          contentType: 'application/json',
          success: function(data) {
            localStorage.setItem("Authorization", data['access_token']);
          },
          error: function() {

          },
          complete: function() {

          }
        })
      }
      function redirectToAuht() {
        redirect_uri = window.location.origin + window.location.pathname
        client_id = config.client_id
        encodedRedirectUri = encodeURIComponent(redirect_uri)
        url = 'http://api.com/nsportal/front/'
        search = '?redirect_uri='+encodedRedirectUri+'&client_id='+client_id
        urlToRedirect = url + search
        window.location = urlToRedirect
      }

      /****** ENDING define function ******/

      /******  STARTING FLOW    ******/
      var qsCode = checkCode();
      if (qsCode == null) {
        var accessTokenValid = accessTokenExistAndValid();
        if (accessTokenValid) {
          //case No code but accessTokenAndValid
          //do the call
        }
        else {
          var refreshTokenInMemory = refreshTokenExistAndValid();
          if (refreshTokenInMemory) {
            callPortalAndGetNewAccessToken(refreshTokenInMemory);
          }
          else {
            //case No code and no access token and refreshtoken
            redirectToAuht();
          }
        }
      }
      else {
        //code in url get token
        getTokenWithCode(qsCode);
      }
      /******  ENDING FLOW    ******/
    }

  app = new Marionette.Application();
  app.on('start', function() {

    oauth2Flow()


    app.rootView = new LytRootView();
    app.controller = new Controller();
    app.router = new Router({controller: app.controller});
    app.rootView.render();
    Backbone.history.start();
    $.ajax({
      context: this,
      url: config.coreUrl +'security/has_access',
      dataType: 'json'
    }).done(function(data) {
      console.log(data);
    });
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
      heightAuto: false,
      title: opt.title,
      text: opt.text || '',
      type: type,
      showCancelButton: showCancelBtn,
      confirmButtonColor: btnColor,
      confirmButtonText: 'OK'
    }).then(result => {
      if( result.value && callback ) {
        callback();
      }
    });
    // function(isConfirm) {
    //   //could be better
    //   if (isConfirm && callback) {
    //     callback();
    //   }
    // });

    // Swal({
    //   title: opt.title,
    //   text: opt.text || '',
    //   type: type,
    //   showCancelButton: showCancelBtn,
    //   confirmButtonColor: btnColor,
    //   confirmButtonText: 'OK',
    //   closeOnConfirm: true,
    // },
    // function(isConfirm) {
    //   //could be better
    //   if (isConfirm && callback) {
    //     callback();
    //   }
    // });
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

function checkTokenExp(successCb, errorCb) {
  function checkValidityToken(token) {
    var toRet = false
    var tmp = token.split('.')
    var payload = JSON.parse(atob(tmp[1]))
    var now = new Date()
    //js timestamp is in milliseconds
    //python timestamp is in seconds
    var dateExp = new Date( payload['exp'] * 1000 )

    if ( now < dateExp ) {
      toRet = true
    }
    return toRet
  }

  var access_token = localStorage.getItem('Authorization')
  console.log("tululu")

  if (checkValidityToken(access_token)) {
    //  API TOKEN NOT EXPIRED
    console.log("access_token still valid")
    successCb();
  }
  else {
    console.log("access_token no more valid")
    var refresh_token = localStorage.getItem('refreshToken')
    if (checkValidityToken(refresh_token)) {
      console.log("refresh_token still valid")
      //  REFRESH TOKEN NOT EXPIRED - NEED NEW API TOKEN
      $.ajax({
          context: this,
          type: 'POST',
          url: 'http://api.com:6544/security/oauth2/v1/token',
          data: JSON.stringify({
            'grant_type' : "refresh_token",
            "refresh_token" : refresh_token
          }),
          dataType: 'json',
          contentType: 'application/json',
          success: function(data) {
            var data = jQuery.parseJSON(data);
            if (data.status == 'success'){
                localStorage.setItem('Authorization', data.apiToken);
                successCb(); // the new token is set, you can make ajax calls
            }
            // TODO: log error here, don't do validToken = true
          },
          fail: function(data) {
            errorCb(data)
          }
      })
    }
    else{
      console.log("refresh_token no more valid bim logout (this case will be handle by 401 returned")
      //  REFRESH TOKEN EXPIRED - FORCE LOG OUT
    }
  }


}

  $.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
    options.crossDomain ={
      crossDomain: true
    };
    options.xhrFields = {
      withCredentials: false
    };
    successCb = function() {
      $.xhrPool.calls[ options.url ] = jqXHR;
    };
    errorCb = function() {
        console.error("Could not refresh token, aborting Ajax call to " + options.url);
        $.xhrPool.calls[ options.url ].abort();
    };

    if (options.url.indexOf(config.coreUrl) > -1) {
      //call on erd api need to check token first
      checkTokenExp(successCb, errorCb);
    }
    else {
      return;
    }
  });
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
      if(jqxhr.status == 401){
        console.log("you are not logged or the api could not identify you, you will be redirected to the portal")
        // document.location.href = config.portalUrl;
      }
      if(jqxhr.status == 403){
        Swal({
          heightAuto: false,
          title: 'Unauthorized',
          text: "You don't have permission",
          type: 'warning',
          showCancelButton: false,
          confirmButtonColor: 'rgb(240, 173, 78)',
          confirmButtonText: 'OK'
        });
      }
      if(jqxhr.status == 409){
        Swal({
          heightAuto: false,
          title: 'Data conflicts',
          text: jqxhr.responseText,
          type: 'warning',
          showCancelButton: false,
          confirmButtonColor: 'rgb(240, 173, 78)',
          confirmButtonText: 'OK'
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

      // Swal({
      //   title: title,
      //   text: savingFormContent,
      //   type: 'warning',
      //   showCancelButton: true,
      //   confirmButtonColor: 'rgb(221, 107, 85)',
      //   confirmButtonText: 'Quit',
      //   customClass: 'swal-cancel-btn-green',
      //   cancelButtonText: 'Continue edition',
      //   closeOnConfirm: true,
      // },
      // function(isConfirm) {
      //   if (!isConfirm) {
      //     if (cancelCallback) {
      //       window.onExitForm.reject();
      //       cancelCallback();
      //     }
      //     return false;
      //   } else {
      //     if (confirmCallback) {
      //         if(indexMax-urlChangeMax<=0){
      //           window.formInEdition = {};
      //         }
      //         window.onExitForm.resolve();
      //         confirmCallback();
      //       // });
      //     }
      //   }
      // });
      Swal({
        heightAuto: false,
        title: title,
        text: savingFormContent,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'rgb(221, 107, 85)',
        confirmButtonText: 'Quit',
        customClass: 'swal-cancel-btn-green',
        cancelButtonText: 'Continue edition'
      }).then((result) => {
        /*
          result.value   equals confirmButton
          result.dismiss equals cancelButton
        */
       if( 'dismiss' in result ) {
        if(cancelCallback) {
          window.onExitForm.reject();
          cancelCallback();
        }
      }
      else if( 'value' in result ) {
        if(confirmCallback) {
          if(indexMax-urlChangeMax<=0){
            window.formInEdition = {};
          }
          window.onExitForm.resolve();
          confirmCallback();
        }
      }
      });   
    } 
    else {
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
