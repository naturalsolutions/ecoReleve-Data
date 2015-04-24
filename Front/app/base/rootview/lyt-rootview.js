define(['marionette', 'transition-region'],
function(Marionette, TransitionRegion) {
	'use strict';

	return Marionette.LayoutView.extend({
		el: 'body',
		template: 'app/base/rootview/tpl-rootview.html',
		className: 'ns-full-height',

		regions: {
			rgHeader: 'header',
			rgMain: new Marionette.TransitionRegion({
				el: 'main'
			}),
			rgFooter: 'footer'
		},
	});
});
