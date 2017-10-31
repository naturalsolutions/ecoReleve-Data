define(['marionette', 'config','i18n'],
function(Marionette, config) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/base/header/tpl-breadcrumb.html',

    initialize: function() {
      this.collection = new Backbone.Collection([
      {label: 'Manual import', href: 'importFile', icon: 'reneco-import'},
      {label: 'History import', href: 'importHistory', icon: 'reneco-import'},
      {label: 'New Station', href: 'stations/new', icon: 'reneco-entrykey'},
      {label: 'Release', href: 'release', icon: 'reneco-to_release'},
      {label: 'Validate', href: 'validate', icon: 'reneco-validate'},
      {label: 'Stations', href: 'stations', icon: 'reneco-stations'},
      {label: 'Individuals', href: 'individual', icon: 'reneco-individuals'},
      {label: 'Sensors', href: 'sensor', icon: 'reneco-sensors'},
      {label: 'Monitored Sites', href: 'monitoredSite', icon: 'reneco-sensors'},
      {label: 'Export', href: 'export', icon: 'reneco-export'},
      ]);
    },

    onShow: function() {
      this.$el.i18n();
      var disabled = config.disabledFunc;
      if (!disabled){
        return;
      }
      for (var i=0; i< disabled.length;i++){
        var functionnality = disabled[i];
        $("." + functionnality).addClass('disabled');
      }
    },
  });
});
