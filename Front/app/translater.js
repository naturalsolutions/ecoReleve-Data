define(['marionette','config','i18n'], function(Marionette, config) {

  var Translater = Marionette.Object.extend({

    initialize: function(options) {
      this.url = 'app/locales/__lng__/__ns__.json';
      this.initi18n();
    },

    initi18n: function() {
      var isDomoInstance = config.instance ;
      if(isDomoInstance == 'demo') {
      // get user language
          $.ajax({
              context: this,
              url: config.coreUrl + 'currentUser',
              success : function(data){
                var language = data.Language;
                i18n.init({
                      resGetPath: this.url,
                      getAsync: true,
                      lng: language || 'en'
                    });
              }
          });

      } else {
        i18n.init({
          resGetPath: this.url,
          getAsync: true,
          lng: config.language || 'en' //navigator.language || navigator.userLanguagenavigator.language || navigator.userLanguage
        });
      }

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
