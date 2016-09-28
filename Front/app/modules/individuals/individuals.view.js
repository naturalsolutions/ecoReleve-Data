define([
  'modules/objects/manager.view',
  './individual.model',
], function(ManagerView, IndividualModel) {

  'use strict';

  return ManagerView.extend({
  	model: new IndividualModel(),
  });
});
