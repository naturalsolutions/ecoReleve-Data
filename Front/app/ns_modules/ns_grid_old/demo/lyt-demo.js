define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'radio',
    'config',
    'text!./tpl-demo.html',
    'ns_modules_grid/model-grid',

], function($, _, Backbone, Marionette, 
    Radio, config, tpl, NSGrid) {

    'use strict';

    return Marionette.LayoutView.extend({
        template: tpl,



        initialize: function(){
            // this.cols=["DATE", "StaID", "StaName"];
            //this.colGene = new colGene({url : 'rfid/getFields', paginable: true});
        },

        onRender: function(){
            this.grid= new NSGrid({
                url: config.coreUrl + 'rfid/',
                pageSize: 25,
                pagingServerSide: true,
                channel : 'plouf',
            });
            this.$el.find('#grid').html(this.grid.displayGrid());
            this.$el.find('#paginator').html(this.grid.displayPaginator());
        },

        onShow: function(){

        },
        onDestroy: function(){},


    });
});
