define([
  'modules/objects/manager.view',
  './project.model',
  
], function(ManagerView, ProjectModel) {

  'use strict';

  return ManagerView.extend({
  	ModelPrototype: ProjectModel,
  });
});
