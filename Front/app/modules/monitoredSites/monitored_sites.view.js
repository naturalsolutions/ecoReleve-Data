define([
  'modules/objects/manager.view',
  './monitored_site.model'
], function (ManagerView, MonitoredSiteModel) {
  'use strict';

  return ManagerView.extend({
  	ModelPrototype: MonitoredSiteModel
  });
});
