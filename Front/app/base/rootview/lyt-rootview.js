define(['marionette',],
function(Marionette) {
	'use strict';

	return Marionette.LayoutView.extend({
		el: 'body',
		template: 'app/base/rootview/tpl-rootview.html',
		className: 'full-height',

		regions: {
			rgHeader: 'header',
			rgMain: 'main',
			rgFooter: 'footer'
		},
	});
});
