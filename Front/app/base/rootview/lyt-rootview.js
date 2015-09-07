define(['marionette', 'transition-region', './base/header/lyt-header'],
function(Marionette, TransitionRegion, LytHeader) {
	'use strict';

	return Marionette.LayoutView.extend({
		el: 'body',
		template: 'app/base/rootview/tpl-rootview.html',
		className: 'full-height',

		regions: {
			rgHeader: 'header',
			rgMain: new Marionette.TransitionRegion({
				el: 'main'
			}),
			rgFooter: 'footer'
		},

		onRender: function(){
			this.rgHeader.show(new LytHeader);
		},
	});
});
