define([
  'modules/objects/manager.view',
  './individual.model',
], function(ManagerView, IndividualModel) {

  'use strict';

  return ManagerView.extend({
  	//template: 'app/modules/individuals/individuals.tpl.html',
  	model: new IndividualModel(),
  });
});
