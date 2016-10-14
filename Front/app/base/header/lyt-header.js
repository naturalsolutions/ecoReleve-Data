
define(['jquery','marionette', 'config', './lyt-breadCrumb'],
function($,Marionette, config, Breadcrumb) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/base/header/tpl-header.html',
    className: 'header',
    events: {
      'click #logout': 'logout'
    },
    regions: {
      'breadcrumb': '#breadcrumb'
    },

    ui: {
      'userName': '#userName',
    },

    logout: function() {
      $.ajax({
        context: this,
        url: 'security/logout'
      }).done(function() {
        document.location.href = config.portalUrl;
      });
    },

    onShow: function() {
      // activate pipefy if it is demo instance
      var _this = this;
      var isDomoInstance = config.instance ;
      if(isDomoInstance == 'demo') {
        $('.pipefy-support').removeClass('hidden');
        if(window.app.logged) {
              this.getUser();
        } else {
                var func_rep = window.setInterval(function(){
                  if(window.app.logged){
                    _this.getUser();
                    window.clearInterval(func_rep);
                  }
              }, 50);
        }
            this.$el.i18n();
      }
      else {
            window.app.user = new Backbone.Model();
            window.app.user.url = config.coreUrl + 'currentUser';
            window.app.user.fetch({
              success: function(data) {
                $('body').addClass(window.app.user.get('role'));
                $.xhrPool.allowAbort = true;
                _this.ui.userName.html(window.app.user.get('fullname'));
              }
            });
      }
      this.breadcrumb.show(new Breadcrumb());
      window.app.user = new Backbone.Model();
      window.app.user.url = 'currentUser';
      window.app.user.fetch({
        success: function(data) {
          $('body').addClass(window.app.user.get('role'));
          $.xhrPool.allowAbort = true;
          _this.ui.userName.html(window.app.user.get('fullname'));
        }
      });
    }
  });
});
