define([
    'jquery',
    'underscore',
    'backbone',
    'config',
    'backgrid',
    'backgridSelect_all',


], function($, _, Backbone, config, Backgrid, BGSA){
    'use strict';
    return Backbone.Model.extend({

        /*
        {
            name: 'age',
            label: 'AGE',
            editable: false,
            cell: 'string',
            headerCell: null,        }, {*/

        initialize: function(options){
            this.checkedColl=options.checkedColl;
            this.getHeaderCell();


            if(options.paginable){
                Backgrid.Column.prototype.defaults.headerCell = this.hc;
            }

           
                this.columns= new Backgrid.Columns();
                this.columns.url=options.url;
                this.columns.fetch({reset: true, data: {'checked' : this.checkedColl}});


        },

        checkedColl: function(){
            
        },


        getHeaderCell: function(){
            this.hc=Backgrid.HeaderCell.extend({
                onClick: function (e) {
                    e.preventDefault();
                    var that=this;
                    var column = this.column;
                    var collection = this.collection;
                    var sortCriteria = (collection.sortCriteria && typeof collection.sortCriteria.id === 'undefined') ? collection.sortCriteria : {};
                    switch(column.get('direction')){
                        case null:
                            column.set('direction', 'ascending');
                            sortCriteria[column.get('name')] = 'asc';
                            break;
                        case 'ascending':
                            column.set('direction', 'descending');
                            sortCriteria[column.get('name')] = 'desc';
                            break;
                        case 'descending':
                            column.set('direction', null);
                            delete sortCriteria[column.get('name')];
                            break;
                        default:
                            break;
                    }
                    var tmp= this.column.attributes.name;

                    if(!Object.keys(sortCriteria).length > 0)
                        collection.sortCriteria[tmp] = 'asc';


                    collection.fetch({reset: true});
                },
            });
        },








    });
});
