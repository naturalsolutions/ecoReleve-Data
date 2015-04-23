define(['marionette'],
function(Marionette) {
	'use strict';
	return Marionette.LayoutView.extend({
		template: 'app/base/home/tpl/tpl-home.html',
		className: 'home-page ns-full-height animated',
		events: {
		},

		animateIn: function() {
			this.$el.removeClass('zoomOutDown');

			this.$el.addClass('zoomInUp');

			this.$el.animate(
				{ opacity: 1 },
				500,
				_.bind(this.trigger, this, 'animateIn')
			);
		},

		// Same as above, except this time we trigger 'animateOut'
		animateOut: function() {
			//this.$el.css({'position' : 'absolute'});
			this.$el.removeClass('zoomInUp');

			//this.$el.addClass('zoomOutDown');

			this.$el.animate(
				{ opacity : 0 },
				500,
				_.bind(this.trigger, this, 'animateOut')
			);
		}
	});
});
