define(['marionette',
	'ns_map/ns_map',
	'./views/curveGraph',
	'./views/donutGraph',
	'./views/info',
	'config',
	'requirejs-text!base/home/tpl/tpl-dounutGraph.html',
	'requirejs-text!base/home/tpl/tpl-dounutGraph2.html',
  'moment',
  'i18n',
	],
function(Marionette, NsMap, CurveGraphView, DonutGraphView, InfoView, config, TplGraph1, TplGraph2,Moment) {
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
    startTime: function() {
      
      var locale = config.language;
      var dateNow ;
      if(locale == 'fr'){
        //require(['momentLocale/fr']);
        dateNow = new Moment().locale('fr').format('LLLL');
      } else {
        dateNow = new Moment().format('MMMM Do YYYY, h:mm:ss a').replace(/([rdths]{2})\s2015/,"<sup>\$1</sup> 2015");
      }
      var _this = this;
      this.$el.find('#info').html(dateNow);
      var t = setTimeout(function() {
        _this.startTime();
      }, 1000);
    },
    initStats: function() {
      var collGraphObj = [{
        url: config.coreUrl + 'sensor/uncheckedDatas/graph',
        ele: '#validate',
        title: 'pending',
        stored: false,
        template: 'app/base/home/tpl/tpl-dounutGraph.html'
      },{
        url: config.coreUrl + 'individuals/location/graph',
        ele: '#locations',
        title: 'location',
        stored: false,
        template: 'app/base/home/tpl/tpl-dounutGraph2.html'
      }/*,{
				url : config.coreUrl + 'stats/individuals/monitored/graph',
				ele : '#monitored',
				title : 'monitored',
				stored : false,
				template : 'app/base/home/tpl/tpl-dounutGraph3.html'
			}*/];
/*      var collGraph = new Backbone.Collection(collGraphObj);
      var GraphViews = Backbone.Marionette.CollectionView.extend({
        childView: DonutGraphView,
      });*/

      //this.donutGraphs = new GraphViews({collection: collGraph});
      this.curveGraph = new CurveGraphView();
      //this.infoStat = new InfoView();
    },

    onRender: function() {
      this.initStats();
     // this.donutGraphs.render();
    },

    onShow: function(options) {
      /*this.info.show(this.infoStat);
      this.ui.donuts.html(this.donutGraphs.el);*/
      var _this = this;
      var user  = new Backbone.Model();
      user.url = config.coreUrl + 'currentUser';
      user.fetch({
        success: function(md) {
          _this.ui.userFirst.html(user.get('Firstname'));
          _this.ui.userLast.html(user.get('Lastname'));
        }
      });
      this.startTime();
      this.graph.show(this.curveGraph);
      this.$el.i18n();
    }
  });
});
