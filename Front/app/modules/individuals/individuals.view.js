define([
  'modules/objects/manager.view'
], function(ManagerView) {

  'use strict';

  return ManagerView.extend({
  	//template: 'app/modules/individuals/individuals.tpl.html',
  	model: new Backbone.Model({
  	  label: 'individuals',
  	  single: 'individual',
  	  type: 'individuals',
  	}),
		
  });
});
