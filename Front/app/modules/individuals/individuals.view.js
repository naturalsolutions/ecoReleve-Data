define([
  'modules/objects/manager.view',
  './individual.model',
], function(ManagerView, IndividualModel) {

  'use strict';

  return ManagerView.extend({
  	model: new IndividualModel(),

  	toggleTab: function(e) {
  	  if(!$(e.currentTarget).hasClass('active')){
  	    this.$el.find('.tab-ele').each(function(){
  	      $(this).toggleClass('active');
  	    });

        var typeObj = this.availableTypeObj.filter(function(obj){
          if (obj.label.toLowerCase() === $(e.currentTarget).attr('id').toLowerCase()){
            return obj;
          }
        })[0];

        this.model.set('objectType',typeObj.val);
        this.model.set('objectTypeLabel',typeObj.label);

        if(typeObj.label.toLowerCase() === 'standard'){
          this.$el.find('.js-link-new').html('<span class="reneco reneco-entrykey"></span> &nbsp; New individual');
        } else {
          this.$el.find('.js-link-new').html('<span class="reneco reneco-entrykey"></span> &nbsp; Save from criteria');
        }
        this.setDefaultOperatorFilter();
				this.onShow();
  	  }
  	},

    filter: function() {
    //  if (this.moduleName != 'IndivFilter'){
    //    this.grid.collection.queryParams.startDate =  $('#dateVal').val();
    //    this.grid.collection.queryParams.history =0;
    //    if ($('#histVal:checked').val()){
    //      this.grid.collection.queryParams.history =1;
    //    }
    //  }
      this.gridView.dataSource.startDate = $('#dateVal').val();
      if ($('#histVal:checked').val()){
        this.gridView.dataSource.history = 1;
      } else {
        this.gridView.dataSource.history = 0;
      }
      this.filters.update();
     //this.filters.criterias = {startDate:$('#dateVal').val(), criteria};
    },

    afterShow: function(){
      var _this = this;
      $('.border-bottom-filter').removeClass('hide');
       this.$el.find('#datetimepicker2').datetimepicker({format : "DD/MM/YYYY HH:mm:ss"});
      $('#histVal').on('click',_this.resetDate);
      $('#datetimepicker2').on('dp.change',_this.resetHist);
    },

    resetDate: function(e){
      if ($('#histVal:checked').val()){
        $('#dateVal').val(null);
      }
    },
    resetHist: function(e){
      if ($('#histVal:checked').val()){
        $('#histVal').prop('checked', false);
      }
    },

    setDefaultOperatorFilter: function(){
      // to extend
    },

    new: function(){
      var url = '#' + this.model.get('type') + '/new/'+this.availableTypeObj[0].val;
      Backbone.history.navigate(url, {trigger: true});
    }
  });
});
