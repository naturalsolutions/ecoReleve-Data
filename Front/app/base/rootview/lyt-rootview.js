define(['marionette', 'transition-region', './base/header/lyt-header', 'config'],
function(Marionette, TransitionRegion, LytHeader,config) {
  'use strict';

  return Marionette.LayoutView.extend({
    el: 'body',
    template: 'app/base/rootview/tpl-rootview.html',
    className: 'full-height',

    events: {
      'click #pipefy' : 'controlformdisplay',
      'click .pipefyclose' :'closeform'
    },

    ui: {
      'pypefy' : '#pipefy',
      'pypefypanel' :'div.supportpanel'
    },

    regions: {
      rgHeader: 'header',
      rgMain: new Marionette.TransitionRegion({
        el: 'main'
      }),
      rgFooter: 'footer'
    },

    onRender: function() {
       var isDomoInstance = config.instance ;
       this.rgHeader.show(new LytHeader);
       if(isDomoInstance == 'demo') {
            this.insertForm();
       }
    },
    closeform : function(){
      $('div.supportpanel').animate({ "right": "-=560px" }, "slow" ).addClass('hidden');
    },
    onShow : function(){
       var isDomoInstance = config.instance ;
      if(isDomoInstance == 'demo') {
        $('.pipefy-support').removeClass('hidden');
      }
    },
    controlformdisplay : function(){
      var notdisplayed = $('div.supportpanel').hasClass('hidden');
      if(notdisplayed){
        $('div.supportpanel').removeClass('hidden').animate({
          "right": "+=560px"}, { duration: 700,
          complete: function() {
              $('.supportpanel').append('<a class="pipefyclose"><span class="reneco reneco-close"></span></a>');
          }
        }

       );
      } else {
        this.closeform();
      }

    },
    insertForm : function(){
      var frm = '<div class="supportpanel hidden"><div class="supportheader">Support</div>'
      frm +='<iframe width="560" height="800" src="https://beta.pipefy.com/public_form/49561?embedded=true" frameborder="0" id="iframe"></iframe></div>';
      this.$el.append(frm);
    }
  });
});
