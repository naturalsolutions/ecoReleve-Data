define([
  'modules/objects/manager.view',
  './sensor.model'
], function(ManagerView, SensorModel) {

  'use strict';

  return ManagerView.extend({
    model: new SensorModel(),
  });
});
