define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'config',
    'text!./tpl-demo.html',
    'ns_modules_map/ns_map',
    'ns_modules_com',
    'modules2/validate/gsm/views/gsm-grid',

], function($, _, Backbone , Marionette, config, tpl, NsMap, Com, GsmGridView) {

    'use strict';

    return Marionette.LayoutView.extend({
        template: tpl,
        className: 'map-view',
        events: {

        },

        regions: {
          rg_map : '#rg_map',
          rg_grid : '#rg_grid'
        },

        /*====================================
        =            Interactions            =
        ====================================*/

        /*
        features & interactions
        - click on map: 
          - focus -> grid
          - popup -> focus -> grid
          - selection/desecletion -> grid
          - 
        Map: 
        - focus ok
        - popup ko
        - selection/deselection (cluster) ok
        - selection bbBox 
        - bar controll 
        

        Grid : 
        - focus
        - selection/deselcetion

        */


        initialize: function() {
          this.com = new Com();
          var myCell = Backgrid.NumberCell.extend({
              decimals: 5,
              orderSeparator: ' ',
          });
        },
        onShow: function(){
          this.rg_map.show(new NsMap({
            url: config.coreUrl+'/individuals/stations?id=3',
            cluster: true,
            popup: false,
            com : this.com,
          }));


          //we took gsmValidationGrid 4 example
          this.rg_grid.show(new GsmGridView({
            com : this.com,
            id_ind: 68602,
            gsmID: 278
          }));


        }


    });
});
