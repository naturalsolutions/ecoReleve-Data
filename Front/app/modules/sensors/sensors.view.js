define([
  'modules/objects/manager.view',
  './sensor.model',
  
], function(ManagerView, SensorModel) {

  'use strict';

  return ManagerView.extend({
  	ModelPrototype: SensorModel,
  });
});
