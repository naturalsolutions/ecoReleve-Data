
define(['jquery','marionette', 'config', './lyt-breadCrumb'],
function($,Marionette, config, Breadcrumb) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/base/header/tpl-header.html',
    className: 'header',
    events: {
      'click #logout': 'logout',
    },
    regions: {
      'breadcrumb': '#breadcrumb'
    },

    ui: {
      'userName': '#userName'
    },

    logout: function() {
      $.ajax({
        context: this,
        url: config.coreUrl + 'security/logout'
      }).done(function() {
        document.location.href = config.portalUrl;
      });
    },

    onShow: function() {
      var _this = this;
      this.breadcrumb.show(new Breadcrumb());
      window.app.user = new Backbone.Model();
      window.app.user.url = config.coreUrl + 'currentUser';
      window.app.user.fetch({
        success: function(data) {
          $('body').addClass(window.app.user.get('role'));
          $.xhrPool.allowAbort = true;
          _this.ui.userName.html(window.app.user.get('fullname'));
        }
      });
    },
  });
});
