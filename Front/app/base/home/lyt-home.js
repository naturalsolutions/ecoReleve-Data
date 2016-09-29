define(['marionette',
	'ns_map/ns_map',
	'./views/curveGraph',
	'./views/donutGraph',
	'./views/info',
	'requirejs-text!base/home/tpl/tpl-dounutGraph.html',
	'requirejs-text!base/home/tpl/tpl-dounutGraph2.html',
	'i18n'
	],
function(Marionette, NsMap, CurveGraphView, DonutGraphView, InfoView, TplGraph1, TplGraph2) {
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
      'donuts': '#donuts'
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
      var GraphViews = Backbone.Marionette.CollectionView.extend({
        childView: DonutGraphView,
      });

      this.donutGraphs = new GraphViews({collection: collGraph});
      this.curveGraph = new CurveGraphView();
      this.infoStat = new InfoView();
    },

    onRender: function() {
      this.initStats();
      this.donutGraphs.render();
    },

    onShow: function(options) {
      this.info.show(this.infoStat);
      this.ui.donuts.html(this.donutGraphs.el);
      this.graph.show(this.curveGraph);
      this.$el.i18n();
    }
  });
});
