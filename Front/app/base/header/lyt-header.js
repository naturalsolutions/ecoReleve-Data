
define([
  'jquery',
  'marionette',
  'config',
  './lyt-breadCrumb',
  'bootstrap'
],
function ($, Marionette, config, Breadcrumb) {
  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/base/header/tpl-header.html',
    className: 'header',
    events: {
      'click #logout': 'logout'
    },
    regions: {
      breadcrumb: '#breadcrumb'
    },

    ui: {
      userName: '#userName'
    },

    logout: function () {
      $.ajax({
        context: this,
        url: 'security/logout'
      }).done(function () {
        document.location.href = config.portalUrl;
      });
    },

    onShow: function () {
      // activate pipefy if it is demo instance
      var _this = this;
      var isDomoInstance = config.instance;
      if (isDomoInstance == 'demo') {
        $('.pipefy-support').removeClass('hidden');
        this.$el.i18n();
      }

      this.breadcrumb.show(new Breadcrumb());
      window.app.user = new Backbone.Model();
      window.app.user.url = 'currentUser';
      window.app.user.fetch({
        success: function (data) {
          $('body').addClass(window.app.user.get('role'));
          $.xhrPool.allowAbort = true;
          _this.ui.userName.html(window.app.user.get('fullname'));
        }
      });
    }
  });
});
