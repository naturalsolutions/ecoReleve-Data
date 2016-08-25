define(['backbone', 'marionette', 'config'],
function(Backbone, Marionette, config) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/ns_modules/ns_navbar/ns_navbar.tpl.html',
    className: '',

    events: {
      'click .js-prev' : 'navigatePrev',
      'click .js-next' : 'navigateNext',
    },

    ui: {
      'totalRecords': '.js-total-records',
      'recordIndex': '.js-record-index'
    },

    initialize: function(options){
      this.parent = options.parent;
      this.model = new Backbone.Model();

      //ag-grid not yet compatible      
      if(window.currentData){
        this.collection = window.currentData.collection;
        this.model.set('index', this.collection.indexOf(window.currentData.model) + 1);
        this.model.set('totalRecords', this.collection.state.totalRecords);        
      } else {
        
      }
    },

    onShow: function(){
      
    },

    update: function(id, index){
      this.model.set('index', index);
      this.render();
    },
    
    navigateNext: function(){

      console.log(this.collection);
      this.collection.url = 'individuals';
      console.log(this.collection.getFirstPage);

      return;


      var _this = this;
      var index = this.model.get('index');

    },

    navigatePrev: function(){
      var _this = this;
      var index = this.model.get('index');

    },

  });
});


/*TODO
  - store async requests
  - stop async requests unusefall

*/