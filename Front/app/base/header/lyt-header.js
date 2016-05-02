
define(['marionette', 'config', './lyt-breadCrumb'],
function(Marionette, config, Breadcrumb) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/base/header/tpl-header.html',
    className: 'header',
    events: {
      'click #logout': 'logout',
      'click #pipefy' : 'pipefyform'
    },
    regions: {
      'breadcrumb': '#breadcrumb'
    },

    ui: {
      'userName': '#userName',
      'pypefy' : '#pipefy',
      'pypefypanel' :'div.supportpanel'
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
        success: function() {
          _this.ui.userName.html(window.app.user.get('fullname'));
        }
      });
    },
    pipefyform : function(e){
      var notdisplayed = $(this.ui.pypefypanel).hasClass('hidden');
      if(notdisplayed){
        $(this.ui.pypefypanel).removeClass('hidden').animate({ "right": "+=560px" }, "slow" );

      } else {
        $(this.ui.pypefypanel).animate({ "right": "-=560px" }, "slow" ).addClass('hidden');
      }
    }
  });
});
