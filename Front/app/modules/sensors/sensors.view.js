define([
  'modules/objects/manager.view'
], function(ManagerView) {

  'use strict';

  return ManagerView.extend({
    model: new Backbone.Model({
      label: 'sensors',
      single: 'sensor',
      type: 'sensors',
      availableOptions: [{
        label: 'Argos',
        val: 'argos'
      }, {
        label: 'GSM',
        val: 'gsm'
      },{
        label: 'RFID',
        val: 'rfid'
      },{
        label: 'VHF',
        val: 'vhf'
      }],
    }),
  });
});
