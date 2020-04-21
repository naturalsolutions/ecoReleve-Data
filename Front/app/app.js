define([
  'marionette',
  'oauth2',
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

function( Marionette, OAuth2, LytRootView, Router, Controller,Swal,config, $, Backbone) {

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

  function redirectToAuht() {
    redirect_uri = window.location.origin + window.location.pathname
    client_id = config.client_id
    encodedRedirectUri = encodeURIComponent(redirect_uri)
    url = config.portalFrontUrl
    search = '?redirect_uri=' + encodedRedirectUri + '&client_id=' + client_id
    urlToRedirect = url + search
    window.location.href = urlToRedirect
  }

  var xhrRefeshToken;

  function checkValidityToken(keyToken) {
    var token = localStorage.getItem(keyToken);
    var toRet = false;
    try {
      var tmp = token.split('.');
      var payload = JSON.parse(atob(tmp[1]));
    }
    catch(error) {
      localStorage.removeItem(keyToken);
      return toRet;
    }

    var now = new Date().getTime();
    //js timestamp is in milliseconds
    //python timestamp is in seconds
    var dateExp = new Date( payload['exp'] * 1000 ).getTime();

    if ( now - 5000 < dateExp ) {
      toRet = token;
    }
    return toRet;
  }

  $(document).bind("ajaxSend", function(a, b, c){
    console.log('ajaxStart', c.url);
  });

  // $( document ).ajaxStart(function() {
  //   console.log('ajaxStart');
  // })
  $( document ).ajaxError(function( event, jqxhr, settings, thrownError ) {
    //TODO
  });
  $.ajaxSetup({
    // before jQuery send the request we will push it to our array
    beforeSend: function(jqxhr, options) {
      // if(options.type === 'GET' || options.url.indexOf('http://') !==-1 ){ //should be a GET!! (thesaurus calls)
      //   $.xhrPool.calls.push(jqxhr);
      // }
    },
    // when some of the requests completed it will splice from the array
    complete: function(jqxhr, options){
      var index = $.xhrPool.calls.indexOf(jqxhr);
      if (index > -1) {
        $.xhrPool.calls.splice(index, 1);
      }
    },
    error: function(jqxhr, options){
      if(jqxhr.status == 401){

        console.log(arguments, "you are not logged or the api could not identify you, you will be redirected to the portal")
        // document.location.href = config.portalFrontUrl;
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
  var xhrRefeshToken
  $.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
    if(options.url.indexOf('http://') > -1) {
      options.url = options.url;
    } else {
      options.url = config.erdApiUrl + options.url;
    }
    if (options.url.indexOf(config.erdApiUrl) > -1 || options.url.indexOf(config.thesaurusUrl) > -1) {
      if (localStorage.getItem('NSERDAccess_token') != null) {
        jqXHR.setRequestHeader('Authorization', 'Bearer '+ localStorage.getItem('NSERDAccess_token') )
      }
      if (options.refreshRequest) {
        return;
      }

      // our own deferred object to handle done/fail callbacks
      var dfd = $.Deferred();

      // if the request works, return normally
      jqXHR.done(dfd.resolve);

      // if the request fails, do something else
      // yet still resolve
      jqXHR.fail(function() {
          var args = Array.prototype.slice.call(arguments);
          if (jqXHR.status != 401) {
            dfd.rejectWith(jqXHR, args);
          }
          else {
            var refresh_token = checkValidityToken("NSERDRefresh_token")
            if (!refresh_token) {
              redirectToAuht();
            }
            else {
              var refresh_token = localStorage.getItem('NSERDRefresh_token');
              if (!xhrRefeshToken) {
                xhrRefeshToken = $.ajax({
                  context: this,
                  type: 'POST',
                  url: config.portalApiUrl + 'security/oauth2/v1/token',
                  data: JSON.stringify({
                    'grant_type' : "refresh_token",
                    "refresh_token" : refresh_token
                  }),
                  dataType: 'json',
                  contentType: 'application/json'
                }).then(function(data) {
                    localStorage.setItem('NSERDAccess_token', data.access_token);
                  },
                  function(err) {
                    redirectToAuht();
                  }
                  ).always(function() {
                    xhrRefeshToken = null;
                });
              }
              xhrRefeshToken.then(function() {
                // retry with a copied originalOpts with refreshRequest.
                var newOpts = $.extend({}, originalOptions, {
                  refreshRequest: true,
                  headers: {
                    Authorization: 'Bearer '+ localStorage.getItem('NSERDAccess_token')
                  }
                });
                // pass this one on to our deferred pass or fail.
                $.ajax(newOpts).then(dfd.resolve, dfd.reject);
              });
            }
          }
      });

      // NOW override the jqXHR's promise functions with our deferred
      return dfd.promise(jqXHR);

      // var access_token = checkValidityToken("NSERDAccess_token");
      // if (access_token) {
      //   //var access_token = localStorage.getItem('NSERDAccess_token')
      //   //  API TOKEN NOT EXPIRED
      //   console.log("access_token still valid");
      //   jqXHR.setRequestHeader('Authorization', 'Bearer '+ localStorage.getItem('NSERDAccess_token') )
      //   $.xhrPool.calls.push(jqXHR);
      //   return;
      // }
      // jqXHR.abort();
      // console.log("on est bon ? ")
      // //call on erd api need to check token first
      // var refresh_token = checkValidityToken("NSERDRefresh_token")
      // if (!refresh_token) {
      //   redirectToAuht();
      // } else {
      //   // $.xhrPool.calls.push(jqXHR);
      //   // return;
      //   var refresh_token = localStorage.getItem('NSERDRefresh_token');
      //   console.log("refresh_token still valid");
      //   //  REFRESH TOKEN NOT EXPIRED - NEED NEW API TOKEN
      //   if (!xhrRefeshToken) {
      //     xhrRefeshToken = $.ajax({
      //       context: this,
      //       type: 'POST',
      //       url: config.portalApiUrl + 'security/oauth2/v1/token',
      //       data: JSON.stringify({
      //         'grant_type' : "refresh_token",
      //         "refresh_token" : refresh_token
      //       }),
      //       dataType: 'json',
      //       contentType: 'application/json'
      //     }).then(function(data) {
      //       console.log("A");
      //       localStorage.setItem('NSERDAccess_token', data.access_token);
      //       return;
      //     }, function(err) {
      //       redirectToAuht();
      //     }).always(function() {
      //       xhrRefeshToken = null;
      //     });
      //   }
      //   xhrRefeshToken.then(function() {
      //     console.log("B", options);
      //     originalOptions.headers = originalOptions.headers || {};
      //     originalOptions.headers.Authorization =  'Bearer '+ localStorage.getItem('NSERDAccess_token');
      //     $.ajax(originalOptions);
      //   });
      // }
    }
    else {
      return;
    }
  });

  app = new Marionette.Application();
  app.on('start', function() {

    OAuth2.then(function() {
      app.rootView = new LytRootView();
      app.controller = new Controller();
      app.router = new Router({controller: app.controller});
      app.rootView.render();
      Backbone.history.start();
      $.ajax({
        context: this,
        url: config.erdApiUrl +'security/has_access',
        dataType: 'json'
      }).done(function(data) {
        console.log(data);
      });
    }, function(err) {
      //
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
