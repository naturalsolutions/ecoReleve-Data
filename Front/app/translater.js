define(['jquery','marionette','config','i18n'], function($, Marionette, config) {

  var Translater = Marionette.Object.extend({

    initialize: function(options) {
      this.dfd = $.Deferred();
      if(config.instance == 'demo') {
        this.dfd = $.ajax({
          context: this,
          url: config.coreUrl + 'currentUser',
        }).done(function(data){
          this.initi18n(data.Language);
        });
        return;
      }
      this.dfd.resolve();
      this.initi18n();
    },

    initi18n: function(language){
      i18n.init({
        resGetPath: window.location.href + 'app/locales/__lng__/__ns__.json',
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
