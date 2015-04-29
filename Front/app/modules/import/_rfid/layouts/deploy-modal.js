define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'config',
    'radio',
    'modules2/rfid/layouts/rfid-deploy',
    'modules2/rfid/views/rfid-map',
    'sweetAlert',
    'modules2/map/views/basemap',
    'text!modules2/import/_rfid/templates/rfid-deploy-modal.html',

], function($, _, Backbone, Marionette, config, Radio, DeployRFID, Map, Swal, BaseMap,tpl) {
    'use strict';

    return DeployRFID.extend({
        template: tpl,
        regions: {
            mapRegion: "#map-container"
        },
        initialize: function() {
            this.map2 = new Map();
            DeployRFID.prototype.initialize.apply(this, arguments);
        },

        onShow: function() {
            this.$el.find('#input-begin').attr('placeholder', config.dateLabel);
            this.$el.find('#input-end').attr('placeholder', config.dateLabel);
            //this.mapRegion.show(this.map);
            this.mapRegion.show(this.map2);
                $(window).keyup(function (e) {
                    var code = (e.keyCode ? e.keyCode : e.which);
                    if (code === 9) {
                        $('.step-content').trigger('click');
                    }
                });
          

        },

        onRender: function() {
         /*   var map = Map.extend({
                onRender: function() {
                    this.$el.find('#map').height('300px');
                },
            });
            this.map=new map();*/
            this.mapRegion.show(this.map2);

        },

        onDestroy: function() {
          
        },

        pose : function (evt) {
             evt.preventDefault();
            if ( this.isValid() ) {
                evt.stopPropagation();
                $.ajax({
                    url: config.coreUrl + 'monitoredSiteEquipment/pose',
                    context: this,
                    type: 'POST',
                    data: {
                        identifier: this.ui.mod.val(),
                        type: this.ui.type.val(),
                        name: this.ui.name.val(),
                        begin: this.ui.begin.val(),
                        end: this.ui.end.val(),
                        action: this.action
                    }
                }).done( function(data) {
                    Swal({
                              title: 'Well done !',
                              text: data.responseText,
                              type: 'success',
                              showCancelButton: true,
                              confirmButtonColor: 'green',
                              confirmButtonText: 'New deploy',
                              cancelButtonColor: 'blue',
                              cancelButtonText: 'Finish',
                                
                              closeOnConfirm: true,
                             
                            },
                            function(isConfirm){
                               
                              
                                if (isConfirm){
                                   
                                } else {
                                   $('#modal-close').trigger('click');
                               }
                                });
                    $('form').trigger('reset');
                    this.disableAll();
                }).fail( function(data) {
                   Swal({
                              title: 'Error',
                              text: data.responseText,
                              type: 'error',
                              showCancelButton: false,
                              confirmButtonColor: 'green',
                              confirmButtonText: 'New deploy',
                              cancelButtonColor: 'blue',
                              cancelButtonText: 'Finish',
                                
                              closeOnConfirm: true,
                             
                            },
                            function(isConfirm){
                               
                               
                                if (isConfirm){
                                   
                                } else {
                                   
                                }
                                });
                    $('form').trigger('reset');
                    this.disableAll();
                });
            }
        }
     
    });


});
