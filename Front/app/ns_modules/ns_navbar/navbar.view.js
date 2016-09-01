define(['backbone', 'marionette', 'config'],
function(Backbone, Marionette, config) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/ns_modules/ns_navbar/navbar.tpl.html',
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
      if(window.app.currentData && window.app.currentData.list.length > 1) {
        this.model = new Backbone.Model(window.app.currentData);
        this.model.set('display', true);
      } else {
        this.model = new Backbone.Model();
        this.model.set('display', false);
      }
    },

    onShow: function(){
           
    },

    disableBtns: function(disable){
      this.$el.find('button').prop('disabled', disable);
    },

    fetch: function(status){
      this.model.set('status', status);
      this.disableBtns(true);
      this.deferred = $.ajax({
        url: this.model.get('url'),
        method: 'GET',
        context: this,
        data: status
      }).done( function(response) {
        this.model.set('list', response[1]);
      });
    },

    update: function(index){
      var _this = this;

      this.model.set('index', index);

      $.when(this.deferred).then(function(data){
        var id = _this.model.get('list')[index]['ID'];
        _this.render();
        _this.parent.reloadFromNavbar(id);
        _this.disableBtns(false);
        Backbone.history.navigate('#' + window.app.currentData.type + '/' + id, {trigger: false});
      });

    },
    
    navigateNext: function(){
      var index = this.model.get('index');
      index++;
      if(index < this.model.get('status').per_page){
        this.deferred = true;
      } else {
        var status = this.model.get('status');
        if(status.page >= this.model.get('totalRecords') / status.per_page){
          status.page = 1;
        } else {
          status.page++;
        }
        index = 0;
        status.offset = status.per_page * (status.page - 1);
        this.fetch(status);
      }
      this.update(index);
    },

    navigatePrev: function(){
      var index = this.model.get('index');
      var status = this.model.get('status');

      index--;
      if(index > -1){
        this.deferred = true;
      } else {
        if(status.page == 1){
          status.page = (this.model.get('totalRecords') / status.per_page);
        } else {
          status.page--;
        }
        index = status.per_page -1;
        status.offset = status.per_page * (status.page - 1);
        this.fetch(status);
      }
      this.update(index);
    },

  });
});


/*TODO
  - store async requests
  - stop async requests unusefall
*/