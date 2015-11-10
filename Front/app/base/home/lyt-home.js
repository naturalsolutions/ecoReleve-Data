define(['marionette',
	'ns_map/ns_map',
	'./views/curveGraph',
	'./views/donutGraph',
	'./views/info',
	'i18n'
	],
function(Marionette, NsMap, CurveGraphView,DonutGraphView, InfoView) {
	'use strict';

	return Marionette.LayoutView.extend({
		template: 'app/base/home/tpl/tpl-home.html',
		className: 'home-page ns-full-height animated',
		events: {
		},
		regions: {
			graph : '#graph',
			info : '#info',
			donuts : '#donuts',
		},

		animateIn: function() {
			this.$el.addClass('zoomInDown');
			
			this.$el.animate(
				{ opacity: 1 },
				200,
				_.bind(this.trigger, this, 'animateIn')
			);
		},

		// Same as above, except this time we trigger 'animateOut'
		animateOut: function() {
			this.$el.removeClass('zoomInUp');

			this.$el.animate(
				{ opacity : 0 },
				200,
				_.bind(this.trigger, this, 'animateOut')
			);
		},


		onShow : function(options) {
			this.info.show(new InfoView());
			this.graph.show(new CurveGraphView());
			this.donuts.show(new DonutGraphView());
			this.$el.i18n();
		}
	});
});
