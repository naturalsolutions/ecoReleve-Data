define(['marionette',
	'ns_map/ns_map',
	'./views/curveGraph',
	'./views/donutGraph',
	'./views/info',
	'requirejs-text!base/home/tpl/tpl-dounutGraph.html',
	'requirejs-text!base/home/tpl/tpl-dounutGraph2.html',
	'config',
	'i18n'
	],
function(Marionette, NsMap, CurveGraphView, DonutGraphView, InfoView, TplGraph1, TplGraph2,config) {
  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/base/home/tpl/tpl-home.html',
    className: 'home-page ns-full-height animated',
    events: {
    },
    regions: {
      graph: '#graph',
      info: '#info',
    },

    ui: {
      'donuts': '#donuts',
      'userFirst': '#userFirst',
      'userLast': '#userLast',
    },

    animateIn: function() {
      this.$el.addClass('zoomInDown');

      this.$el.animate(
            {opacity: 1},
            200,
            _.bind(this.trigger, this, 'animateIn')
            );
    },

    // Same as above, except this time we trigger 'animateOut'
    animateOut: function() {
      this.$el.removeClass('zoomInUp');

      this.$el.animate(
      {opacity: 0},
      200,
      _.bind(this.trigger, this, 'animateOut')
      );
    },

    initStats: function() {
      var isDomoInstance = config.instance ;
      var collGraphObj = [{
        url: 'sensor/uncheckedDatas/graph',
        ele: '#validate',
        title: 'pending',
        stored: false,
        template: 'app/base/home/tpl/tpl-dounutGraph.html'
      },{
        url: 'individuals/location/graph',
        ele: '#locations',
        title: 'location',
        stored: false,
        template: 'app/base/home/tpl/tpl-dounutGraph2.html'
      }/*,{
				url : 'stats/individuals/monitored/graph',
				ele : '#monitored',
				title : 'monitored',
				stored : false,
				template : 'app/base/home/tpl/tpl-dounutGraph3.html'
			}*/];
      var collGraph = new Backbone.Collection(collGraphObj);


      if(!isDomoInstance || (isDomoInstance != 'demo')) {
          var GraphViews = Backbone.Marionette.CollectionView.extend({
            childView: DonutGraphView,
          });
          this.donutGraphs = new GraphViews({collection: collGraph});
      }
      this.infoStat = new InfoView();
      this.curveGraph = new CurveGraphView();
    },

    onRender: function() {
      this.initStats();
      var isDomoInstance = config.instance ;
      if(!isDomoInstance || (isDomoInstance != 'demo')) {
        this.donutGraphs.render();
      }
    },

    onShow: function(options) {
      var isDomoInstance = config.instance ;
      this.disableTiles();

      if(!isDomoInstance || (isDomoInstance != 'demo')) {
        this.ui.donuts.html(this.donutGraphs.el);
        $('.hello').addClass('masqued');
      } else {
        this.getUser();
        $('#siteName').addClass('masqued');
      }
      this.info.show(this.infoStat);
      this.graph.show(this.curveGraph);

      this.$el.i18n();
      // mobile compatibility
      /*var isMobile = window.matchMedia("only screen and (max-width: 760px)");
      if (isMobile.matches && (!window.alertMobile)) {
          Swal({
              title: 'Mobile compatibility',
              text: 'This application is not adapted to mobile browsers yet',
              type: 'warning',
              showCancelButton: false,
              confirmButtonColor: 'rgb(221, 107, 85)',
              confirmButtonText: 'OK',
              closeOnConfirm: true
          });
          $('.sweet-alert.showSweetAlert.visible').css('margin-left', '0px;');
          window.alertMobile = true;
      }*/
    },
    disableTiles : function(){
      // disable tiles for disabled fonctionalities in config.js
      var disabled = config.disabledFunc ;
      if (! disabled){
        return ;
      }
      for (var i=0; i< disabled.length;i++){
        var functionnality = disabled[i];
        $("." + functionnality).addClass('tile-locked');
      }
    },
    getUser : function(){
      var _this = this;
      var user  = new Backbone.Model();
      user.url = config.coreUrl + 'currentUser';
      user.fetch({
        success: function(md) {
          _this.ui.userFirst.html(user.get('Firstname'));
          _this.ui.userLast.html(user.get('Lastname'));
        }
      });
    }
  });
});
