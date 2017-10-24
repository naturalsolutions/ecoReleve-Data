define([
  'modules/objects/manager.view',
  './client.model',
  
], function(ManagerView, ClientModel) {

  'use strict';

  return ManagerView.extend({
  	ModelPrototype: ClientModel,
  });
});
