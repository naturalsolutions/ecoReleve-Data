define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'radio',
    'config',
    'text!filter/tpl-demo.html',
    'filter/model-filter',
    'grid/model-grid',
   

], function($, _, Backbone, Marionette, Radio,
    config, tpl, NSFilter, NSGrid, Slider) {

    'use strict';


    return Marionette.LayoutView.extend({
        template: tpl,


        events: {
            'click #update' : 'update',

        },



        initialize: function(){
            this.cols= [{
                editable: true,
                name: 'FK_creator',
                label: 'FK_creator',
                cell: 'integer'
            }, {
                editable: true,
                name: 'identifier',
                label: 'identifier',
                cell: 'string'
            }, {
                editable: true,
                name: 'creation_date',
                label: 'creation_date',
                cell: 'date'
            },
             {
                editable: true,
                name: 'model',
                label: 'model',
                cell: 'string'
            },
            ];
        },

        onRender: function(){
            
           
            //Passer un objet / collection
            this.filters = new NSFilter({
                channel: 'modules',
                url: config.coreUrl + 'rfid/',
                template: 'filter/tpl-filters.html',
            });

            //Passer un objet / collection remplie (cols + content)
            this.grid= new NSGrid({
                
                checkedColl: false,
                channel: 'modules',
                /*columns: this.cols,*/
                /*collection:this.collection,*/
                url: config.coreUrl + 'rfid/',
                pageSize : 15,
                pagingServerSide : false,
                
            });
            

            this.$el.find('#grid').html(this.grid.displayGrid());
            this.$el.find('#paginator').html(this.grid.displayPaginator());


        },


        onShow: function(){
             $('#bt-slider').slider({
                formatter: function(value) {
                    return 'Current value: ' + value;
                },
            });
        },
        onDestroy: function(){},

        update: function(){
            this.filters.update();
        },

    
    });
});
