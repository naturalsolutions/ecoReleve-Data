define(['jquery','marionette','config','i18n'], function($, Marionette, config) {

  var Translater = Marionette.Object.extend({

    initialize: function(options) {
      this.initi18n('en');
    },

    initi18n: function(language){
      i18n.init({
        resGetPath: window.location.origin+ window.location.pathname + 'app/locales/'+language+'/translation.json',
        getAsync: false,
        lng: language || 'en' //navigator.language || navigator.userLanguagenavigator.language || navigator.userLanguage
      });
    },

    getValueFromKey: function(key) {
      return $.t(key);
    }
  });

  var translater = new Translater();

  return {
    getTranslater: function(options) { return translater; }
  };

});
