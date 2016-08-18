
define(['marionette', 'config', './lyt-breadCrumb'],
function(Marionette, config, Breadcrumb) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/base/header/tpl-header.html',
    className: 'header',
    events: {
      'click #logout': 'logout',
      'click #pipefy' : 'pipefyform',
      'click .pipefyclose' :'closeform'
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
      var user  = new Backbone.Model();
      user.url = config.coreUrl + 'currentUser';
      user.fetch({
        success: function(md) {
           _this.ui.userName.html(user.get('Firstname') + ' ' + user.get('Lastname') );
        }
      });
    },
    pipefyform : function(e){
      // check id div is not integrated add it
      var frmisinserted  = $('.supportpanel').length;
      if (!frmisinserted) {
        this.insertForm();
      } else {
        this.controlformdisplay();
      }
      
    },
    closeform : function(){
      $('div.supportpanel').animate({ "right": "-=560px" }, "slow" ).addClass('hidden');
    },
    insertForm : function(){
      var frm = '<div class="supportpanel hidden">'
      frm +='<iframe width="560" height="580" src="https://beta.pipefy.com/public_form/49561?embedded=true" frameborder="0" id="iframe"></iframe>'
      frm+='<a class="pipefyclose"><span class="reneco reneco-close"></span></a> </div>';
      this.$el.append(frm);
      this.controlformdisplay();
    },
    controlformdisplay : function(){
      var notdisplayed = $('div.supportpanel').hasClass('hidden');
      if(notdisplayed){
        $('div.supportpanel').removeClass('hidden').animate({ "right": "+=560px" }, "slow" );

      } else {
        this.closeform();
      }
    }
  });
});
